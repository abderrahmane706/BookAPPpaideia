-- ============================================================================
-- PAIDEIA · Migration 0004 — Agora (daily recall & review)
--
-- Creates `reviews`, the persistence table behind the Agora workspace. A review
-- is a *pointer* to one of the reader's own records (a note, a quotation, a
-- reflection field, a summary) plus a snapshot of the prompt/answer text taken
-- at queue time, and the small scheduling state that decides when it is due.
--
-- SCOPE NOTE
--   Authentication is still deferred, so (exactly like 0002 / 0003) this table
--   is NOT yet populated by the running app. The app persists reviews to the
--   device behind the same repository boundary
--   (src/lib/services/library/persistence.ts). This table exists so enabling
--   auth is the ONLY change required to move persistence to Supabase, and it
--   ships with full per-user Row Level Security from day one.
--
-- SCHEDULING
--   `interval_days`, `repetitions` and `next_review_at` are the durable
--   scheduling state produced by the deterministic model in
--   src/lib/services/review/scheduler.ts. `review_state` is the reader-visible
--   lifecycle: 'new' | 'learning' | 'review' | 'suspended'. This model is a
--   simple, transparent interval model — NOT a validated retention predictor.
--
-- Column-name mapping (app domain ⇄ persistence):
--   sourceType     -> reviews.source_type
--   sourceId       -> reviews.source_id        (nullable; set null on delete)
--   prompt / answer-> reviews.prompt_text / reviews.answer_text
--   lastReviewedAt -> reviews.last_reviewed_at
--   nextReviewAt   -> reviews.next_review_at
--   intervalDays   -> reviews.interval_days
-- ============================================================================

create table if not exists public.reviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  book_id          uuid not null references public.books (id) on delete cascade,
  source_type      text not null,
  source_id        uuid,
  prompt_text      text not null,
  answer_text      text not null,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz not null default now(),
  interval_days    integer not null default 0,
  repetitions      integer not null default 0,
  review_state     text not null default 'new',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint reviews_source_type_valid check (
    source_type in (
      'note', 'quote', 'key_takeaway', 'most_important_idea',
      'personal_application', 'personal_review', 'summary'
    )
  ),
  constraint reviews_review_state_valid check (
    review_state in ('new', 'learning', 'review', 'suspended')
  ),
  constraint reviews_prompt_present check (length(btrim(prompt_text)) > 0),
  constraint reviews_answer_present check (length(btrim(answer_text)) > 0),
  constraint reviews_interval_nonnegative check (interval_days >= 0),
  constraint reviews_repetitions_nonnegative check (repetitions >= 0)
);

-- ---------------------------------------------------------------------------
-- Row Level Security — per-user ownership, with the parent-book check so a
-- review can never be attached to another user's book.
-- ---------------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists "reviews_select_own" on public.reviews;
create policy "reviews_select_own" on public.reviews
  for select using (auth.uid() = user_id);
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id and public.owns_book(book_id))
  with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Indexes: the due queue is the hot path (per-user, soonest first), plus a
-- per-book lookup and a dedupe guard on (source_type, source_id).
-- ---------------------------------------------------------------------------
create index if not exists reviews_user_due_idx
  on public.reviews (user_id, next_review_at);
create index if not exists reviews_book_idx on public.reviews (book_id);
create unique index if not exists reviews_source_uniq
  on public.reviews (user_id, source_type, source_id)
  where source_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at trigger.
-- ---------------------------------------------------------------------------
drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
