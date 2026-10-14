# PAIDEIA — Sprint Report

**Scope:** classical-Greek interface refinement, "The Threshold" entrance, the
Agora daily recall & review workspace, and the PAIDEIA AI book-only assistant.
**Branch:** `main` · **Base commit:** `651cb92` (mind-map engine + classical
design foundation) · Build: Next.js 16.3.3 (App Router / Turbopack), TypeScript
strict, Tailwind v4.

Verification: `npx tsc --noEmit` clean · `npx eslint .` clean · `npm run build`
clean · 17/17 end-to-end checks passing.

---

## 1. Audit findings

- **Framework.** Next.js 16.3.3 App Router; `next lint` is removed in this
  version, so linting runs through `npx eslint .`. Several App Router APIs differ
  from older training data (async `searchParams`, `Response.json`, route-segment
  config) — read `node_modules/next/dist/docs/` before writing routes.
- **Local-first data.** There is no auth session yet, so the database schema
  (`auth.users` + `auth.uid()` RLS) cannot be read/written without either
  weakening RLS or shipping a service-role key — both out of bounds. Persistence
  therefore lives behind `src/lib/services/library/persistence.ts` under the
  versioned key `paideia.library.v1`; the repository boundary is the only thing
  that knows where data lives.
- **Existing foundations reused.** `SoundManager` (already centralised, assets
  fall back to a Web Audio synth, off by default), the theme store
  (`paideia-theme`), the toast/notify feedback layer, `Modal`/`ConfirmDialog`,
  `Button`, `Field`/`Input`/`Textarea`/`Select`, `EmptyState`, `Progress`,
  `GreekOrnament`/`GreekRule`, and the `TextReveal` reveal primitive.
- **Gaps found and closed.** No entrance concept; no spaced-recall scheduling;
  no AI server boundary; no safe Markdown renderer; `NAV_ITEMS` was defined but
  unused, and the sidebar active-link test matched any prefix (so "Agora" lit up
  on "/agora/assistant").
- **Robustness bug found during E2E.** `normaliseSnapshot` restored collections
  but did not defensively backfill fields that components assume, so a partially
  written/older/imported snapshot missing `book.category` or `note.tags` crashed
  the dashboard and the book workspace with a runtime error page. Fixed (see §14).

## 2. Files

**New — Threshold / preferences**
- `src/lib/types/experience.ts`, `src/lib/services/preferences/{store,entrance,hooks,index}.ts`
- `src/lib/hooks/usePrefersReducedMotion.ts`
- `src/components/threshold/{ThresholdGate,ThresholdExperience,index}.tsx`

**New — Agora / review**
- `src/lib/types/review.ts`, `src/lib/services/review/{scheduler,index,hooks}.ts`
- `src/components/agora/{AgoraView,ReviewSession,ReviewQueueList,AddReviewForm,QueueForReviewButton,index}.tsx`
- `src/app/agora/page.tsx`
- `supabase/migrations/0004_reviews.sql` (reviews table, RLS, indexes)

**New — AI assistant**
- `src/services/ai/{types,prompt,provider,service,index,rate-limit}.ts`
- `src/services/ai/context.ts` (client context builder)
- `src/app/api/ai/chat/route.ts` (the only AI server entry point)
- `src/lib/services/assistant/{store,hooks,index}.ts`
- `src/components/assistant/{Markdown,AssistantPanel,AssistantView,BookAssistantPanel,index}.tsx`
- `src/app/agora/assistant/page.tsx`

**New — shared UI**
- `src/components/ui/{ClassicalDivider,EngravedRule,GreekMeanderRule,OrnamentalCorner,TextReveal}.tsx`

**Prior phase (same branch) — search / profile / insights**
- `src/lib/types/{profile,search}.ts`, `src/lib/services/{profile,search,backup,insights}/`,
  `src/components/{search,profile,insights}/`, `src/app/{profile,insights}/`,
  `src/lib/utils/zip.ts`

**Modified**
- `src/app/layout.tsx` (wraps every route in `ThresholdGate`), `src/app/globals.css`
  (controls, dividers, threshold motion), `src/components/ui/Button.tsx`,
  `src/components/ui/index.ts`, `src/components/ui/QuoteBlock.tsx`
- `src/components/layout/{nav.ts,Sidebar.tsx,Header.tsx}` (Assistant entry +
  longest-prefix active logic)
- `src/components/workspace/{BookWorkspace,NotesPanel,QuotesPanel,ReviewPanel}.tsx`
  (the "08 Ask" section and per-item "queue for review" controls)
- `src/components/{dashboard/Dashboard,chapters/ChapterContent}.tsx`
- `src/lib/services/library/{store,hooks,index,persistence}.ts` (reviews CRUD,
  cascade/detach, defensive normalisation)
- `src/lib/services/sound/SoundManager.ts` (threshold cue), `src/lib/services/insights/index.ts`
- `.env.example` (documents the four `PAIDEIA_AI_*` variables)

## 3. Buttons & dividers

- `Button` now supports **primary / secondary / quiet / destructive** and sizes,
  built on `.btn-press`: ~`0.98` press scale, a 1px vertical displacement, and a
  **120–200 ms** transition — tactile, never bouncy. There is **no sound on
  hover**; sounds are reserved for real commits (save/create/delete/toggle) and
  for the entrance.
- New decorative primitives, used with varying density by context — never as
  filler: `ClassicalDivider`, `GreekMeanderRule` (with a `density` prop),
  `EngravedRule`, `OrnamentalCorner`. `TextReveal` drives the entrance headline.
- No new fonts were introduced; the existing display/body/utility stack is used.

## 4. Entrance ("The Threshold") & repeat policy

- Immersive full-screen entrance rendered **once**, in the root layout, above
  every route — so client-side navigation never remounts it and never replays it.
  The real application shell is always rendered underneath; the entrance veils it
  and then reveals it (no fake loading screen).
- Policy is a device-local preference (`paideia.preferences.v1`): **session**
  (default, once per browser session), **daily** (once per day), **off**. The
  decision is made by the external `threshold` controller after preferences
  hydrate, so there is **no hydration mismatch** and no `setState`-in-effect.
- "Enter the library" plays the threshold cue (when sound is on), runs a
  **~450–750 ms** light/parchment reveal, then returns focus to the revealed
  shell. There is always a **Skip** affordance; `prefers-reduced-motion` skips
  the animation entirely.
- The entrance can be **replayed or disabled** from Profile → Preferences.

## 5. Light & sound

- Theme is the reader's existing choice (light "day" / night); the entrance uses
  the same parchment/engraving palette in both. Sound remains centralised in
  `SoundManager`, off by default, with the toggle unchanged. No new sounds beyond
  the threshold cue were added.

## 6. Agora schema & persistence

- `ReviewItem` (`src/lib/types/review.ts`) points at the reader's own material
  (`sourceType`: `note` / `quote` / `reflection` / `summary`-style items) and
  carries the scheduling state: `intervalDays`, `repetitions`, `reviewState`
  (`new` / `learning` / `review`), `lastReviewedAt`, `nextReviewAt`.
- Persisted inside the library snapshot (`reviews` array) and mirrored in the
  `reviews` table + RLS in `0004_reviews.sql` for the eventual Supabase backend.
- Deleting the source cascades to the review; moving/detaching updates the
  pointer. Backup (v3) includes reviews.

## 7. Scheduling logic

Deterministic, in `src/lib/services/review/scheduler.ts`:

- **again** → interval `0`, repetitions `0`, due again the same day, `learning`.
- first successful review (`repetitions 0`): easy → 3 days, otherwise → 1 day.
- later reviews: difficult ×1.2, good ×2.0, easy ×2.6; minimum 1 day, capped at
  `REVIEW_INTERVAL_MAX_DAYS = 365`. `reviewState` becomes `review` at ≥2
  repetitions.
- new items are due immediately (`nextReviewAt = createdAt`); suspended items are
  never due.
- "Prompt of the day" and the reflection prompts are chosen deterministically
  from the date, so the queue is stable within a day.

## 8. AI provider & security architecture

- Provider-independent server abstraction under `src/services/ai/`. The default
  adapter speaks the OpenAI-compatible `/chat/completions` API (non-streaming).
- Credentials are **server-only** env vars: `PAIDEIA_AI_API_KEY`,
  `PAIDEIA_AI_BASE_URL`, `PAIDEIA_AI_MODEL`. Missing config returns a clear
  `unconfigured` state — never a fake answer.
- `getProviderConfig()` reads `process.env` at call time. `remoteInferenceAllowed()`
  permits remote inference in development; **in production it is disabled unless
  `PAIDEIA_AI_ALLOW_REMOTE=true`** is explicitly set, because no authentication /
  quota boundary exists yet. This is documented rather than quietly bypassed.
- The single entry point `/api/ai/chat` validates and bounds input
  (`ASSISTANT_MAX_MESSAGES=24`, `ASSISTANT_MAX_MESSAGE_CHARS=4000`,
  `ASSISTANT_MAX_CONTEXT_BOOKS=40`, `ASSISTANT_MAX_CONTEXT_CHARS=24000`), applies
  a fixed-window rate limit (20 requests / 60 s per IP), and returns generic
  errors that never echo the upstream body. Statuses: 200 ok, 400 invalid,
  429 rate-limited, 503 unconfigured/blocked, 502 provider error.
- Because the library is local-first, the **client** assembles the bounded
  context; the server treats every field (notes, quotes, summaries) as
  **untrusted data**, not instructions.

## 9. Supported capabilities

- One shared conversation model serves both the **full workspace**
  (`/agora/assistant`) and the **compact panel inside a book** (BookWorkspace →
  "08 Ask"). Scopes: your whole library, or a single book.
- The assistant answers about **your own saved material** — books, summaries,
  notes, quotations, and reflections — and politely redirects off-topic prompts
  back to your reading. It does not present unimplemented capabilities as
  functional.

## 10. Grounding & citations

- Every answer is grounded in the bounded context of the reader's own material;
  the prompt forbids inventing quotations. Replies include inline `[n]`
  citations that link to the corresponding **Sources** list, and each source
  deep-links to where it lives (`/library/<bookId>#<section>`), so a claim can
  always be traced back to the note, quote, or summary it came from.

## 11. Conversation persistence & failure handling

- The thread is a device-local store (`paideia.assistant.v1`) exposed through
  `useSyncExternalStore`, so it survives navigation and a reload. Pending and
  empty bubbles are never persisted.
- On failure the reader's question is **kept** and an error bubble is shown with a
  **Try again** action; the failed assistant bubble is dropped on retry and the
  turn is re-sent. Network failure shows a specific, non-alarming message.
- Markdown is rendered to React nodes only — never `dangerouslySetInnerHTML` —
  with URL sanitisation (`https?://` or a leading `/`).

## 12. Light/night & responsive

- All new surfaces use the shared theme tokens and render correctly in both
  themes. The assistant workspace and the compact in-book panel both reflow to
  single-column at mobile widths; the review session and entrance are fully
  responsive.

## 13. Lint / typecheck / build

- `npx tsc --noEmit` → exit 0.
- `npx eslint .` → exit 0.
- `npm run build` → success; routes include the dynamic
  `ƒ /agora/assistant` and `ƒ /api/ai/chat`.

## 14. End-to-end tests

Harness: `/tmp/opencode/sprint-cdp.mjs` drives a headless Chrome over CDP against
a production `next start` instance (port 3100) with a fake OpenAI-compatible
provider (`sprint-provider.mjs`, port 3210) and a seeded library snapshot.
**17/17 checks pass**, covering:

1. the entrance appears once per new session and is clickable;
2. it dismisses to reveal the real shell;
3. a same-session reload does **not** replay it;
4. the Agora editorial workspace renders with a due queue and progress;
5. "Begin review" opens a session with the prompt first;
6. the answer reveals on demand;
7. the assistant opens with a scoped empty state;
8. a real turn returns a grounded, non-empty reply;
9. inline citations link to sources;
10. the Sources panel lists the reader's own material;
11. the book workspace embeds the compact assistant;
12. a malformed request is rejected with 400;
13. a configured provider answers 200 through the server route.

Regression fixed during this work: `normaliseSnapshot` now backfills
`book.category` and `note.tags`, so a partial/legacy snapshot can no longer take
down the dashboard or a book page.

## 15. Limitations

- **Live remote inference in production is intentionally disabled** until an
  access boundary (auth + quota) exists; the abstraction, UI, and clear
  configuration state are in place.
- The library is **device-local**, not cloud sync — and is never presented as
  such. The Supabase migration is written but not wired while auth is deferred.
- The assistant is non-streaming and rate-limited per IP by an in-memory window
  (per-instance, not a distributed limiter).
- `npm audit` reports 9 pre-existing advisories, out of scope for this sprint.

## 16. Screenshots

All under `docs/screenshots/` (light + night + mobile):

- `sprint-threshold-light.png` — The Threshold entrance.
- `sprint-agora-queue.png`, `sprint-agora-session-prompt.png`,
  `sprint-agora-session-revealed.png` — the Agora queue and a review turn.
- `sprint-assistant-desktop-light.png`, `sprint-assistant-desktop-night.png` —
  the AI workspace in both themes.
- `sprint-assistant-mobile-light.png` — the assistant at mobile width.
- `sprint-assistant-book-compact.png` — the compact in-book assistant.
