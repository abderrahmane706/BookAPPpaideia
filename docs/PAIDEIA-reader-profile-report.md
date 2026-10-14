# PAIDEIA — Reader Profile & Insights Phase Report

Scope: functional global search, refined classical typography with a restrained
word-reveal, an editable local Reader Profile, data-driven Reading Insights, and
a reliable personal-data export/backup. This phase was executed, verified and
measured — not planned.

Base revision: `651cb92` (Mind Map Engine v1 + Classical Design Renaissance).
Work is uncommitted in the working tree at the time of writing.

---

## 1. Summary of work

| Area | Status | Evidence |
| --- | --- | --- |
| Global search | Shipped | §3, §15; `docs/screenshots/phase45-search-light.png` |
| Classical typography | Shipped (token-level) | §4 |
| Word-reveal animation | Shipped | §5; reduced-motion check |
| Reader Profile (editable, local) | Shipped | §6; `docs/screenshots/phase45-profile-light.png` |
| Reading Insights (data-driven) | Shipped | §7; `docs/screenshots/phase45-insights-{light,dark}.png` |
| Export / backup (.zip + CSV) | Shipped | §8 |
| Navigation integration | Shipped | §9 |
| Build / typecheck / lint | Clean | §13 |
| Automated acceptance | 47/47 pass, 0 console errors | §15 |

All six feature areas were implemented and exercised end-to-end in a real
browser (Chrome via CDP) against real persisted data — no mocks, no seed data in
the product, no fabricated metrics.

## 2. Files added / changed

New:

- `src/lib/types/search.ts`
- `src/lib/services/search/index.ts`
- `src/components/search/{SearchOverlay.tsx,SearchField.tsx,index.ts}`
- `src/components/ui/TextReveal.tsx`
- `src/lib/types/profile.ts`
- `src/lib/services/profile/{store.ts,avatar.ts,avatarStore.ts,hooks.ts,index.ts}`
- `src/components/profile/{ProfileView.tsx,ProfileAvatarLink.tsx,DataExport.tsx,index.ts}`
- `src/lib/services/insights/hooks.ts`
- `src/lib/services/backup/index.ts`
- `src/lib/utils/zip.ts`
- `src/components/insights/{InsightsView.tsx,index.ts}`
- `src/app/{profile/page.tsx,insights/page.tsx}`

Changed:

- `src/app/globals.css` — typography refinements (`.measure*`, `text-wrap`),
  `.text-reveal__word` styles and reduced-motion collapse.
- `src/components/layout/{Header.tsx,Sidebar.tsx,nav.ts}` — search field,
  profile link, Insights/Profile routes.
- `src/components/chapters/ChapterContent.tsx` — chapter titles reveal.
- `src/components/dashboard/Dashboard.tsx` + `src/components/ui/QuoteBlock.tsx`
  — welcome‑quotation reveal.
- `src/lib/services/insights/index.ts` — placeholder replaced with the real
  analytics engine.

## 3. Global search

- Runs entirely over the in-memory library snapshot; **no network fetch per
  keystroke** (`searchLibrary(snapshot, query, { maxPerGroup, groups })`).
- Input debounced **300 ms**; queries are trimmed and empty queries skipped.
- Groups in stable order: books, summaries, notes, quotations, mind maps
  (`SEARCH_GROUP_IDS`), each with per-group result caps and a total count.
- Weighted field scoring with a recency tiebreak; nullable fields handled safely.
- Keyboard: **Ctrl/Cmd+K** opens; **↑/↓** move; **Enter** opens; **Esc** closes.
  The shortcut only opens the overlay and never intercepts keys elsewhere, so an
  editor or unrelated input is never hijacked.
- Deep links: book → `/library/{id}`; summary → `/library/{id}#summary`;
  note → `/library/{id}#notes`; quotation → `/library/{id}#quotes`;
  mind map → `/library/{id}/mind-map?map={mapId}`.
- Matches are highlighted with `<mark>`; results carry type metadata.
- Implementation note: the overlay is remounted via a `key={instance}` counter
  so it starts from a clean state on each open, avoiding React’s
  `set-state-in-effect` anti-pattern.

## 4. Classical typography refinement

Applied at the token level in `globals.css` (a refinement, not a rebuild):

- Headings: `text-wrap: balance`; body copy: `text-wrap: pretty`.
- New measure utilities `.measure` (68ch) and `.measure-narrow` (52ch).
- `.heading-section` tuned to `line-height: 1.16`, `letter-spacing: -0.004em`.

Existing display/editorial/ornament/body/utility font stack is unchanged
(GFS Didot, Cormorant Garamond, mesures, Source Serif 4, Public Sans).

## 5. Word-reveal animation (`TextReveal`)

- Splits text into word spans that fade in with a slight vertical rise and a
  short stagger — ink on parchment, **not** a typewriter effect.
- Reveals **once** on viewport entry via `IntersectionObserver`; no replay.
- Accessibility & robustness: the full text is exposed once via an `sr-only`
  copy while animated words are `aria-hidden`; words are `inline-block` so they
  never break mid‑word and normal wrapping/selection is preserved; server and
  first client render are identical (no hydration mismatch).
- `prefers-reduced-motion: reduce` collapses to a plain, fully-opaque state.
- Applied selectively: dashboard welcome quotation, chapter titles, Reader
  Profile and Reading Insights headings. Not applied globally.

## 6. Reader Profile (editable, local-only)

- Fields: display name (≤80), reading statement (≤600), annual goal (1–1000 or
  unset), preferred categories (subset of curated categories), optional language.
  Partial completion is allowed.
- Portrait: MIME allowlist (PNG/JPEG/WebP/AVIF) and ≤2 MB, validated by type and
  byte length — **filenames are never trusted**. Square centre-crop → 512 px →
  WebP q0.85, stored as a blob in **IndexedDB** (never base64 in localStorage).
  Preview / replace / remove are supported; graceful `null` fallback when
  IndexedDB is unavailable.
- A sparse-edit model means the rendered value is the persisted profile merged
  with the current patch; there is an explicit **Saved / Unsaved changes /
  Discard** state and a success notification.
- The UI states plainly that the profile is stored on this device only: it is
  never published, and there is no cross-device sync in this build.

## 7. Reading Insights (data-driven)

`computeInsights(snapshot, { annualGoal, now })` derives everything from
persisted records. No estimates, no sampling, no psychological claims.

- Overview: totals, per-status counts, completion rate, average rating.
- Activity: sessions, total minutes, total pages, per-session averages, last
  session date, and **current / longest day streaks**.
- Annual goal: books finished **this calendar year** only (`completedAt`), so old
  completions are never counted toward the current year; percentage capped for
  display while the true value is shown.
- 12‑month timeline (sessions/minutes/books finished) rendered with CSS bars —
  no charting library.
- Composition: category distribution, content counts (summaries, notes,
  quotations, mind maps), reading states.
- Empty / insufficient states are explicit: a library-less visit shows an
  add-a-book empty state; record-less activity shows a “no sessions yet” note.

## 8. Export / backup

- `buildBackup()` assembles, fully in the browser, a `paideia-backup-YYYY-MM-DD.zip`
  containing: `library.json` (lossless: books, summaries, notes, quotations,
  sessions, mind maps), `library.csv` (books), `profile.json`,
  `books/*.md` (one Markdown file per book), `insights.json`, and `manifest.json`.
- The portrait blob is included as `assets/avatar.*` when present.
- `manifest.json` records schema version, timestamp, per-dataset records, an
  explicit **omitted** list, and **limitations** (device-local only; no cloud
  copy exists; portrait included only when present).
- The ZIP writer (`src/lib/utils/zip.ts`) is dependency-free (STORE method) and
  was verified with the system `unzip` tool (`unzip -t` → *No errors detected*).
- A CSV-only quick export is also offered on the profile page.

## 9. Navigation integration

- Sidebar routes: Dashboard `/`, Library `/library`, Insights `/insights`,
  Profile `/profile`, plus the dashboard chapter links (Continue Reading,
  Reflection). The previously disabled “Mind Map” placeholder was removed.
- `NAV_ITEMS` updated to match.
- The header avatar is now a live link to `/profile` that shows the reader’s
  monogram (or uploaded portrait) once device data has hydrated, and renders a
  neutral state before hydration to avoid mismatches.

## 10. Accessibility

- Search overlay: `role="dialog"`, `aria-modal`, labelled input (`role=combobox`,
  `aria-expanded`, `aria-controls`), Escape close, focus moved into the field.
- TextReveal: single `sr-only` copy of the text; animated fragments hidden from
  assistive tech.
- Profile status uses `aria-live="polite"`; avatar validation errors use
  `role="alert"`; goal progress uses `role="progressbar"`; the timeline exposes a
  text alternative via `role="img"` + `aria-label`.
- Reduced-motion honoured by the reveal and the progress animations.

## 11. Persistence & limitations (honest)

- The profile text lives under `paideia.profile.v1`; the avatar blob lives in the
  IndexedDB `paideia-assets` database. Both are **device-local**.
- The library (including mind maps) remains in `paideia.library.v1`
  (see `src/lib/services/library/persistence.ts`).
- **Cloud persistence remains deferred.** Auth is not implemented, and the
  project deliberately does not weaken RLS or ship a service-role key to the
  client, so no Supabase-backed profile/library storage is wired up. Nothing in
  the UI claims cloud sync.
- React Flow handle-drag still cannot be automated in headless Chrome (CDP does
  not synthesize pointer events), so mind-map connections are asserted via
  `connectable` handle classes rather than a synthetic drag.

## 11a. Responsive verification

The following matrix was asserted with a real browser; `delta` is
`scrollWidth − clientWidth`, so `delta = 0` means no horizontal overflow.

| Viewport | /profile light | /insights light | /profile dark | /insights dark |
| --- | --- | --- | --- | --- |
| 1440×900 | 0 | 0 | 0 | 0 |
| 1200×800 | 0 | 0 | 0 | 0 |
| 1024×768 | 0 | 0 | 0 | 0 |
| 768×1024 | 0 | 0 | 0 | 0 |
| 430×932 | 0 | 0 | 0 | 0 |
| 390×844 | 0 | 0 | 0 | 0 |
| 375×812 | 0 | 0 | 0 | 0 |

## 12. Toolchain commands

```bash
npx tsc --noEmit     # clean
npm run lint         # clean (eslint)
npm run build        # clean — routes: /, /library, /library/[id],
                     #          /library/[id]/mind-map, /insights, /profile, /_not-found
node /tmp/opencode/phase45-qa.mjs   # 47/47 pass, 0 console errors
unzip -t docs/.../paideia-backup-*.zip   # No errors detected
```

## 13. Verification results

- TypeScript: **clean**.
- ESLint: **clean**.
- `next build`: **success**, all routes compiled.
- Browser acceptance (`phase45-qa.mjs`): **47/47 pass**, **0 console errors** —
  covering insights rendering, annual-goal panel, activity/streak/timeline,
  profile hydration + edit + persistence, search open/find/deep-link, backup zip
  download + manifest UI, the full responsive matrix, and reduced-motion reveal.
- Backup container: valid ZIP; 7 entries; `unzip -t` reports no errors.

## 14. Screenshots

- `docs/screenshots/phase45-profile-light.png` — Reader Profile (hydrated).
- `docs/screenshots/phase45-insights-light.png` — Reading Insights, light.
- `docs/screenshots/phase45-insights-dark.png` — Reading Insights, dark.
- `docs/screenshots/phase45-search-light.png` — global search overlay with
  grouped, highlighted results.

## 15. Known limitations & outstanding issues

- **Cloud persistence / auth:** deferred; profile, library and insights are
  device-local and are presented as such. No RLS was weakened and no service-role
  key is shipped to the client.
- **`npm audit`:** 9 pre-existing advisories (8 high, 1 critical) in the current
  dependency tree. Not addressed in this phase (requires dependency upgrades
  that are out of scope for the feature work and were flagged, not silently
  “fixed”).
- **Mind-map drag automation:** cannot be reproduced headlessly; verified
  structurally instead.
- **Derived metrics depend on data quality:** streaks and timelines reflect only
  recorded sessions; books completed before this year never count toward the
  current annual goal by design.
