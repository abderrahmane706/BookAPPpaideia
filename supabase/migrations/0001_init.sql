-- ============================================================================
-- PAIDEIA · Migration 0001 — Foundation
--
-- Phase 1 scope: profiles + books only. Authentication is introduced in a
-- later production phase, but every resource is designed from day one for
-- per-user ownership protected by Row Level Security, so adding auth later
-- requires no restructuring.
--
-- Future tables (summaries, notes, mind_maps, ai_conversations, insights)
-- are intentionally NOT created yet; they will be added as their phases land.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Profiles: a public-facing row per auth user.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user may read/update only their own profile.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Books: the core reading entity, owned by a user.
-- ---------------------------------------------------------------------------
create table if not exists public.books (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  author       text not null,
  category     text,
  -- Cover path within Supabase Storage 'book-covers' bucket (namespaced per user).
  cover_path   text,
  -- Reading status: want_to_read | reading | paused | completed
  status       text not null default 'want_to_read'
               check (status in ('want_to_read', 'reading', 'paused', 'completed')),
  -- Milestone progress as a percentage: 0, 25, 50, 75, 100.
  progress     integer not null default 0 check (progress in (0, 25, 50, 75, 100)),
  -- Personal 1–5 star rating (nullable until rated).
  rating       integer check (rating between 1 and 5),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.books enable row level security;

-- A user may only ever access their own books.
create policy "books_select_own" on public.books
  for select using (auth.uid() = user_id);

create policy "books_insert_own" on public.books
  for insert with check (auth.uid() = user_id);

create policy "books_update_own" on public.books
  for update using (auth.uid() = user_id);

create policy "books_delete_own" on public.books
  for delete using (auth.uid() = user_id);

-- Useful indexes for library listing.
create index if not exists books_user_idx on public.books (user_id);
create index if not exists books_status_idx on public.books (status);

-- Helper: keep updated_at fresh on writes.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
