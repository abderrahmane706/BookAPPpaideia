# PAIDEIA — A Reader's Library

A personal reading and knowledge-management workspace. PAIDEIA turns books into
structured knowledge through reading progress, summaries, notes, ratings, mind
maps, and book-focused AI — a "second brain for readers."

> **Status: Phase 1 — Foundation.** The technical and visual foundation is in
> place. Authentication, book CRUD, the rich editor, mind maps, the AI
> assistant, and reading insights are later phases (architecture boundaries
> prepared, features not yet built).

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** design-system tokens
- **Supabase** (PostgreSQL, Storage, future Auth) — RLS-owned schema
- Vercel-compatible architecture

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Phase 1 shell runs without any backend (demo data from an in-memory books
service). To connect Supabase later, copy `.env.example` to `.env.local` and set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Structure

```
src/
  app/                 # routes (dashboard shell now; route groups grow later)
  components/
    ui/                # design-system primitives
    layout/            # AppShell, navigation
    books/             # BookCard, BookCover, ...
    dashboard/         # dashboard-specific pieces
    illustrations/     # Greek-inspired SVG art
  lib/
    services/          # boundaries: books, ai, mindmap, insights
    supabase/          # client, server, middleware, storage
    types/             # domain types
    utils/             # helpers
    constants/         # categories, quotes, milestones
supabase/
  migrations/          # SQL migrations (RLS-owned foundation)
```

## Design system

Parchment surfaces, engraved blue linework, and all-serif academic typography
(Cormorant Garamond display + Source Serif body), with a single restrained
Greek, architecture-focused illustration as the signature accent.

All values live as centralized theme tokens in `src/app/globals.css` (colors,
surfaces, radii, spacing, shadows, container widths, section rhythm) — no
component hardcodes a raw color or size. Text tokens are tuned to WCAG 4.5:1.

### Illustration system (provisional framing)

Reusable container components reserve the place for page-specific engravings;
the final visual pass swaps in finished artwork without restructuring:

- `IllustrationFrame` — recessed, engraved well for artwork (optional arch-top motif)
- `HeroIllustration` — dashboard hero slot (provisional placeholder only)
- `DecorativeEngraving` — ornamental section divider
- `PageMotif` — top-of-page engraved band

### Dashboard composition

The dashboard is a scalable shell ready for 0 → 10+ books:

1. Hero / welcome (greeting + quote + illustration frame)
2. Continue reading (focal in-progress title + shelf)
3. Reading statistics
4. Library
5. Finished-works shelf
6. Reading insights (reserved placeholder)

## Migrations

Migrations are plain SQL under `supabase/migrations/`. They are applied to a
Supabase project (via the dashboard or `supabase` CLI) once one is provisioned.
