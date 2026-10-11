-- ============================================================================
-- PAIDEIA · Migration 0003 — Mind Map Engine
--
-- Creates `mind_maps`, the persistence table behind the Mind Map workspace.
-- A book may own many maps; a map belongs to exactly one book and one user.
--
-- SCOPE NOTE
--   Authentication is still deferred, so (exactly like summaries / notes /
--   quotes in 0002) this table is NOT yet populated by the running app. The
--   app persists mind maps to the device behind the same repository boundary
--   (src/lib/services/library/persistence.ts). This table exists so enabling
--   auth is the ONLY change required to move persistence to Supabase, and it
--   ships with full per-user Row Level Security from day one.
--
-- GRAPH STORAGE
--   `nodes` and `edges` are JSONB arrays holding the graph. `viewport` holds
--   the pan/zoom of the canvas. Only durable graph state is stored — never
--   transient UI state (selection, hover, in-progress drag, active tool).
--
-- Column-name mapping (app domain ⇄ persistence):
--   nodes    -> mind_maps.nodes     (JSONB array)
--   edges    -> mind_maps.edges     (JSONB array)
--   viewport -> mind_maps.viewport  (JSONB object: {x, y, zoom})
-- ============================================================================

create table if not exists public.mind_maps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references public.books (id) on delete cascade,
  title      text not null,
  nodes      jsonb not null default '[]'::jsonb,
  edges      jsonb not null default '[]'::jsonb,
  viewport   jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Integrity constraints (idempotent). A map can never be attached to a
-- nonexistent or unrelated book (the FK + RLS owns_book check enforce this),
-- and the graph columns are guaranteed to be well-formed containers so the
-- client never has to defend against a non-array payload coming back.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'mind_maps_title_present') then
    alter table public.mind_maps
      add constraint mind_maps_title_present
      check (length(btrim(title)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'mind_maps_nodes_is_array') then
    alter table public.mind_maps
      add constraint mind_maps_nodes_is_array
      check (jsonb_typeof(nodes) = 'array');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'mind_maps_edges_is_array') then
    alter table public.mind_maps
      add constraint mind_maps_edges_is_array
      check (jsonb_typeof(edges) = 'array');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'mind_maps_viewport_is_object') then
    alter table public.mind_maps
      add constraint mind_maps_viewport_is_object
      check (viewport is null or jsonb_typeof(viewport) = 'object');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security — per-user ownership, with the parent-book check so a
-- map can never be attached to another user's book.
-- ---------------------------------------------------------------------------
alter table public.mind_maps enable row level security;

drop policy if exists "mind_maps_select_own" on public.mind_maps;
create policy "mind_maps_select_own" on public.mind_maps
  for select using (auth.uid() = user_id);
drop policy if exists "mind_maps_insert_own" on public.mind_maps;
create policy "mind_maps_insert_own" on public.mind_maps
  for insert with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "mind_maps_update_own" on public.mind_maps;
create policy "mind_maps_update_own" on public.mind_maps
  for update using (auth.uid() = user_id and public.owns_book(book_id))
  with check (auth.uid() = user_id and public.owns_book(book_id));
drop policy if exists "mind_maps_delete_own" on public.mind_maps;
create policy "mind_maps_delete_own" on public.mind_maps
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Indexes for per-book and per-user lookups.
-- ---------------------------------------------------------------------------
create index if not exists mind_maps_book_idx on public.mind_maps (book_id);
create index if not exists mind_maps_user_updated_idx
  on public.mind_maps (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger.
-- ---------------------------------------------------------------------------
drop trigger if exists mind_maps_set_updated_at on public.mind_maps;
create trigger mind_maps_set_updated_at
  before update on public.mind_maps
  for each row execute function public.set_updated_at();
