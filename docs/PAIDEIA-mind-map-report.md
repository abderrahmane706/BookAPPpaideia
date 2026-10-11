# PAIDEIA — Classical Design Renaissance + Mind Map Engine v1

Status: **complete and verified**. Typecheck, lint and production build are clean;
62 headless mind-map checks and the 54-check reading-core regression matrix pass with
zero console errors.

- Stack: Next.js 16.3.3, React 19.2.8, TypeScript, Tailwind v4, `@xyflow/react`.
- New map route: `/library/[id]/mind-map?map=<id>`.
- New dependency: **`@xyflow/react` only** (no other packages added).

---

## 1. Workstream A — Classical Design Renaissance

### Typography system (A2)
- Display / editorial face wired through `next/font` in `src/app/layout.tsx`
  (`GFS Didot` → `Cormorant Garamond` fallback, exposed as `--font-editorial`).
- Body = Source Serif 4, UI = Public Sans, centralised in `src/app/globals.css` tokens.
- Titles and section headers use `.font-editorial` with `clamp()` sizing.
- Verified: computed heading font stack resolves to GFS Didot in light **and** night themes.

### Surface & detail language (A1)
- Stone/limestone token family (`--stone*`), parchment layering, engraved separators,
  architectural relief frames, corner brackets, stone chapter plates — all additive CSS
  utilities in `globals.css` (`.stone-surface`, `.carved-separator*`, `.relief-frame`,
  `.corner-brackets`, `.stone-plate`).
- Restraint respected: no fantasy/mythology, no heavy 3D, no glassmorphism, no neon,
  no extra animation libraries. A reduced-motion block disables non-essential motion.

### Application (A3)
- Editorial typography applied to `SectionHeader`, `EmptyState`, `BookCard` and the
  workspace shell; existing chapter content and artwork left untouched.
- Mind-map chrome (toolbar, palette, inspector, nodes) inherits the same token system
  and is night-aware through `--mmc-*` / `--mm-canvas*` / `--mm-panel*` variables.

---

## 2. Workstream B — Mind Map Engine v1

### Data & persistence
- Types in `src/lib/types/mindmap.ts` (strict graph, node kinds, style tokens, label maps).
- Services in `src/lib/services/mindmap/`: `defaults`, `templates`, `validation`,
  `serialization`, `export`, `layout`, plus a barrel `index.ts` exposing `mindMapService`
  and hooks (`useMindMapSnapshot`, `useMindMap`, `useMindMaps`).
- Local-first store extended (`library/persistence.ts`, `library/store.ts`) with per-book
  `mindMaps` CRUD and cascade delete; snapshot migration is additive and back-fills
  `mindMaps: []` for existing libraries.
- Additive SQL migration `supabase/migrations/0003_mind_maps.sql`
  (`id, book_id, title, nodes jsonb, edges jsonb, viewport jsonb, timestamps`) with RLS,
  ready for the cloud phase (see Blockers).
- Autosave is debounced (graph 600 ms, title 500 ms, viewport 700 ms), flushes on unmount
  and on Ctrl/Cmd+S, and persists **only** durable fields — transient React Flow fields
  (`selected`, `dragging`, `measured`) are stripped by `persistableNode`/`persistableEdge`.

### Editor
- Isolated client canvas `MindMapFlow` (controlled `<ReactFlow>`, single provider) wrapped
  by `MindMapEditor`, which owns graph state, undo/redo history, selection, import/export
  and shortcuts.
- Node kinds: central, concept, supporting, question, quote, example, conclusion, note.
- Node controls: shape, fill, text colour, border colour/style, font, size, bold/italic/
  underline, alignment, icon glyph, resize (React Flow `NodeResizer`).
- Inline editing on nodes, "+" add-child with auto-connect, toolbar/palette add, drag to
  connect (handles connectable), edge label/type/colour/direction editing, duplicate,
  delete, auto-arrange, fit/zoom, multiple maps per book with a switcher.
- Keyboard: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z (and Ctrl+Y) redo, Ctrl/Cmd+A select-all
  (only while the canvas holds focus), Ctrl/Cmd+S flush, Escape clears selection/panels.
- Responsive: full-height canvas, desktop side panels, mobile "Add a node" / "Appearance"
  drawers, night-aware.

### Export / import
- Export JSON (typed envelope `{ format, version, exportedAt, map }`), SVG and PNG
  (client-side, no extra libraries).
- Import is validated (`parseMindMapJson`): malformed or wrong-shape files are rejected with
  a notification and never touch the map; valid files require a destructive confirmation
  before replacing content, and the replacement is undoable.

### Per-book integration
- Route `src/app/library/[id]/mind-map/page.tsx` (server component; awaits params/searchParams)
  renders `MindMapScreen` (active-map resolution, create/duplicate/delete, empty state).
- `BookWorkspace` gains a **Mind Map** section (index 06) listing the book's maps with a
  "New mind map" action.
- New maps start as a single editable central node titled "Main Idea".

---

## 3. Verification

| Suite | Scope | Result |
| --- | --- | --- |
| `qa-matrix` (reading core) | routes, editor, nav, theme, a11y, responsive, export, cascade | **54/54**, 0 console errors |
| `mm-qa` | empty state → create → edit → undo/redo → autosave → export/import → delete | **24/24**, 0 console errors |
| `mm-qa2` | edges/labels, workspace section, **dark mode**, mobile drawers, SVG/PNG, selection, add-child, handles | **20/20**, 0 console errors |
| `mm-accept` | multi-map, map switch, arrange, Ctrl+S / Ctrl+Z / Ctrl+Shift+Z / Ctrl+A / Escape, inspector edits (title/style/width/edge), delete cascade, bad import | **18/18**, 0 console errors |

Typecheck `npx tsc --noEmit` clean · `npm run lint` clean · `npm run build` succeeds
(route `/library/[id]/mind-map` emitted).

### 30 representative acceptance criteria

| # | Acceptance criterion | Backing check | Result |
| --- | --- | --- | --- |
| 1 | Editor loads for `?map=<id>` | qa-1/4, accept-editor | Pass |
| 2 | Empty state + create affordance for a book with no maps | qa-1/2 | Pass |
| 3 | Create from "Main Idea" template (1 central node) | qa-3/5/6 | Pass |
| 4 | Toolbar add node increments graph | qa-7 | Pass |
| 5 | Undo / redo buttons | qa-8/9 | Pass |
| 6 | Ctrl/Cmd+Z undo shortcut | qa-13 | Pass |
| 7 | Ctrl/Cmd+Shift+Z redo shortcut | accept-P | Pass |
| 8 | Ctrl/Cmd+S flushes pending save | accept-D | Pass |
| 9 | Ctrl/Cmd+A selects all (canvas-focused) | accept-E | Pass |
| 10 | Escape clears selection & panels | accept-F | Pass |
| 11 | Title autosaves | qa-10 | Pass |
| 12 | Node/edge graph autosaves | qa-11, accept-D | Pass |
| 13 | Transient fields are never persisted | qa-12 | Pass |
| 14 | Save indicator reflects state | accept-O | Pass |
| 15 | Add child from node `+` creates a connected node | qa2-addchild | Pass |
| 16 | Handles are connectable (edge drag) | qa2-handles | Pass |
| 17 | Edges render with labels | qa2-edges | Pass |
| 18 | Node selection on click opens inspector | qa2-sel, accept-G0 | Pass |
| 19 | Node title edit persists | accept-G | Pass |
| 20 | Node style edit persists | accept-H | Pass |
| 21 | Node size persists | accept-I | Pass |
| 22 | Edge label edit persists | accept-J | Pass |
| 23 | Edge type/shape edit persists | accept-K | Pass |
| 24 | Delete node removes attached edges | accept-K2 | Pass |
| 25 | Auto-arrange repositions nodes | accept-C | Pass |
| 26 | Multiple maps per book + switcher | accept-A/A2/B | Pass |
| 27 | Workspace lists maps + "New mind map" | qa2-workspace | Pass |
| 28 | Night theme renders correctly | qa2-dark, qa-matrix contrast | Pass |
| 29 | Mobile canvas + drawers | qa2-mobile | Pass |
| 30 | JSON/SVG/PNG export + validated import | qa-15..19, qa2-export, accept-N | Pass |

### Screenshots
- `docs/screenshots/mindmap-desktop-light.png`
- `docs/screenshots/mindmap-desktop-dark.png`
- `docs/screenshots/mindmap-mobile-light.png`

---

## 4. Blockers & notes

- **Cloud persistence (auth deferred).** The app is local-first; the Supabase mind-map table
  and RLS are migrated but unused because no auth session/keys are configured. Wiring cloud
  sync requires either an authenticated server context or weakening RLS — intentionally not
  done. Mind maps persist reliably in the local store today.
- **Headless edge-drag limitation.** CDP `Input.dispatchMouseEvent` in headless Chrome does
  not synthesise pointer events here, so handle-drag cannot be automated end-to-end; the
  accepted check asserts React Flow marks the source/target handles `connectable`
  (`connectablestart`/`connectableend`). The `onConnect` handler is wired and edge creation
  is exercised through templates, add-child and import.
- **`npm audit`.** 9 pre-existing advisories (8 high, 1 critical) remain; no new dependency
  beyond `@xyflow/react`.

## 5. Files of interest

- `src/app/library/[id]/mind-map/page.tsx` — route (server, awaits params/searchParams).
- `src/components/mind-map/` — `MindMapScreen`, `MindMapEditor`, `MindMapFlow`,
  `MindMapNodeCard`, `MindMapToolbar`, `MindMapNodePalette`, `MindMapInspector`,
  `MindMapExportDialog`, `MindMapTemplatePicker`, `MindMapPanel`, `MindMapSaveIndicator`,
  `mindMapVisuals`, `mindMapContext`, `index`.
- `src/lib/services/mindmap/` — `defaults`, `templates`, `validation`, `serialization`,
  `export`, `layout`, `hooks`, `index`.
- `src/lib/types/mindmap.ts` — graph types and label maps.
- `src/lib/services/library/{store,persistence}.ts` — mind-map CRUD + cascade.
- `src/app/globals.css`, `src/app/layout.tsx` — design tokens and typography.
- `supabase/migrations/0003_mind_maps.sql` — additive cloud schema.
