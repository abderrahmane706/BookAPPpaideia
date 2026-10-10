-- ============================================================================
-- PAIDEIA · Migration 0002 — Personal reading workspace
--
-- Adds the bibliographic / reading / evaluation columns to `books` and the
-- dependent tables (summaries, notes, quotes, reading_sessions) that back the
-- Reading Workspace.
--
-- SCOPE NOTE
--   Authentication is still deferred, so these tables are NOT yet populated by
--   the running app (see src/lib/services/library/persistence.ts). They are
--   created now, with full per-user Row Level Security, so that enabling auth
--   is the ONLY change required to move persistence to Supabase. No column or
--   enum value that already exists is renamed or removed, so existing records
--   are preserved.
--
-- Column-name mapping (app domain ⇄ persistence):
--   readingStatus  -> books.status          (unchanged: want_to_read|reading|paused|completed)
--   progress       -> books.progress         (0|25|50|75|100)
--   rating         -> books.rating           (1..5, nullable)
--   coverUrl       -> books.cover_path       (Storage object path, never artwork)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Books: add optional bibliographic metadata, reading timeline and evaluation.
-- All new columns are nullable so existing rows are untouched and manual entry
-- never requires bibliographic knowledge.
-- ---------------------------------------------------------------------------
alter table public.books
  add column if not exists description        text,
  add column if not exists isbn               text,
  add column if not exists page_count         integer,
  add column if not exists language           text,
  add column if not exists publisher          text,
  add column if not exists published_year     integer,
  add column if not exists source             text default 'manual',
  add column if not exists current_page       integer,
  add column if not exists started_at         timestamptz,
  add column if not exists completed_at       timestamptz,
  add column if not exists personal_review    text,
  add column if not exists key_takeaway       text,
  add column if not exists most_important_idea text,
  add column if not exists personal_application text,
  add column if not exists tags               text[] not null default '{}';

-- Integrity constraints (idempotent).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'books_page_count_positive') then
    alter table public.books
      add constraint books_page_count_positive
      check (page_count is null or page_count > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'books_current_page_nonneg') then
    alter table public.books
      add constraint books_current_page_nonneg
      check (current_page is null or current_page >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'books_current_page_within_count') then
    alter table public.books
      add constraint books_current_page_within_count
      check (page_count is null or current_page is null or current_page <= page_count);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'books_published_year_range') then
    alter table public.books
      add constraint books_published_year_range
      check (published_year is null or (published_year between 1 and 3000));
  end if;

  -- Completion date must accompany a completed status.
  if not exists (select 1 from pg_constraint where conname = 'books_completed_has_date') then
    alter table public.books
      add constraint books_completed_has_date
      check (status <> 'completed' or completed_at is not null);
  end if;
end $$;

create index if not exists books_user_created_idx on public.books (user_id, created_at desc);
create index if not exists books_user_status_idx on public.books (user_id, status);

-- ---------------------------------------------------------------------------
-- Summaries — exactly one personal summary per book.
-- ---------------------------------------------------------------------------
create table if not exists public.summaries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references public.books (id) on delete cascade,
  -- Structured editor document (Tiptap/ProseMirror JSON). Never raw HTML.
  content    jsonb,
  -- Plain-text projection for search and export.
  plain_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id)
);

-- ---------------------------------------------------------------------------
-- Notes — free-form reader notes.
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references public.books (id) on delete cascade,
  title      text,
  body       text not null,
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Quotes / highlights — reader-recorded quotations (never auto-extracted).
-- ---------------------------------------------------------------------------
create table if not exists public.quotes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references public.books (id) on delete cascade,
  text       text not null,
  page       integer,
  highlight  text not null default 'gold'
             check (highlight in ('gold', 'blue', 'green', 'rose')),
  annotation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reading sessions — lightweight reading activity log.
-- ---------------------------------------------------------------------------
create table if not exists public.reading_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references public.books (id) on delete cascade,
  date       date not null,
  minutes    integer not null default 0,
  pages      integer,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (minutes >= 0),
  check (pages is null or pages >= 0)
);

-- ---------------------------------------------------------------------------
-- Row Level Security — per-user ownership, with a parent-book check so a row
-- can never be attached to another user's book.
-- ---------------------------------------------------------------------------
alter table public.summaries        enable row level security;
alter table public.notes            enable row level security;
alter table public.quotes           enable row level security;
alter table public.reading_sessions enable row level security;

-- Helper predicate reused across policies: the book must belong to the caller.
create or replace function public.owns_book(p_book_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.books
    where books.id = p_book_id and books.user_id = auth.uid()
  );
$$;

-- Summaries
drop policy if exists "summaries_select_own" on public.summaries;
create policy "summaries_select_own" on public.summaries
  for select using (auth.uid() = user_id);
drop policy if exists "summaries_insert_own" on public.summaries;
create policy "summaries_insert_own" on public.summaries
  for insert with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "summaries_update_own" on public.summaries;
create policy "summaries_update_own" on public.summaries
  for update using (auth.uid() = user_id and public.owns_book(book_id))
  with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "summaries_delete_own" on public.summaries;
create policy "summaries_delete_own" on public.summaries
  for delete using (auth.uid() = user_id);

-- Notes
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id and public.owns_book(book_id))
  with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

-- Quotes
drop policy if exists "quotes_select_own" on public.quotes;
create policy "quotes_select_own" on public.quotes
  for select using (auth.uid() = user_id);
drop policy if exists "quotes_insert_own" on public.quotes;
create policy "quotes_insert_own" on public.quotes
  for insert with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "quotes_update_own" on public.quotes;
create policy "quotes_update_own" on public.quotes
  for update using (auth.uid() = user_id and public.owns_book(book_id))
  with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "quotes_delete_own" on public.quotes;
create policy "quotes_delete_own" on public.quotes
  for delete using (auth.uid() = user_id);

-- Reading sessions
drop policy if exists "reading_sessions_select_own" on public.reading_sessions;
create policy "reading_sessions_select_own" on public.reading_sessions
  for select using (auth.uid() = user_id);
drop policy if exists "reading_sessions_insert_own" on public.reading_sessions;
create policy "reading_sessions_insert_own" on public.reading_sessions
  for insert with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "reading_sessions_update_own" on public.reading_sessions;
create policy "reading_sessions_update_own" on public.reading_sessions
  for update using (auth.uid() = user_id and public.owns_book(book_id))
  with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "reading_sessions_delete_own" on public.reading_sessions;
create policy "reading_sessions_delete_own" on public.reading_sessions
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Indexes for dependent lookups.
-- ---------------------------------------------------------------------------
create index if not exists notes_book_idx on public.notes (book_id);
create index if not exists notes_user_idx on public.notes (user_id);
create index if not exists quotes_book_idx on public.quotes (book_id);
create index if not exists quotes_user_idx on public.quotes (user_id);
create index if not exists reading_sessions_book_idx on public.reading_sessions (book_id);
create index if not exists reading_sessions_user_date_idx on public.reading_sessions (user_id, date desc);
create index if not exists summaries_user_idx on public.summaries (user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers.
-- ---------------------------------------------------------------------------
drop trigger if exists summaries_set_updated_at on public.summaries;
create trigger summaries_set_updated_at
  before update on public.summaries
  for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

drop trigger if exists reading_sessions_set_updated_at on public.reading_sessions;
create trigger reading_sessions_set_updated_at
  before update on public.reading_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage: a dedicated, private bucket for reader-uploaded covers, kept
-- separate from PAIDEIA's own application artwork.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', false)
on conflict (id) do nothing;

-- Only the authenticated owner may read/write objects under their own folder.
-- Object paths are namespaced as: {auth.uid()}/{book_id}/{token}.{ext}
drop policy if exists "book_covers_select_own" on storage.objects;
create policy "book_covers_select_own" on storage.objects
  for select using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "book_covers_insert_own" on storage.objects;
create policy "book_covers_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "book_covers_update_own" on storage.objects;
create policy "book_covers_update_own" on storage.objects
  for update using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "book_covers_delete_own" on storage.objects;
create policy "book_covers_delete_own" on storage.objects
  for delete using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
