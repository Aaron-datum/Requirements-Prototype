# Implementation plan: Datum FE prototype

Audience: Claude Code (and any developer) building the front-end prototype. Read `CLAUDE.md` first, then `01-design-requirements.md`, then this file.

Goal: a clickable, front-end-only prototype of the whole product. Search (Files, Define, Results, Compare, New Search, Parts Catalogue), Create (BOM creation, cost, requirements, traceability, test plan), and the Projects dashboard. Everything runs on fake data. Everything undesigned is simulated behind a typed service interface and marked on screen so nobody mistakes it for the real thing.

---

## 1. Principles that decide every trade-off

1. **Decided means build exactly.** Example means build the shape, not the value. Prototype simplification means build the stub, name it, and mark it. The tags in `01-design-requirements.md` are the source of truth for which is which.
2. **Configurable beats literal.** Status labels, tones, PLM field names, similarity bands, Reuse Status, Conformance State and the data-type vocabulary come from config (`AppConfig`, see `03-domain-and-service-interfaces.ts`). No component compares against a hard-coded status string. Unknown raw values render as the raw text with a neutral tone.
3. **One component per idea.** One confidence/provenance component, one table shell, one side panel, one bottom drawer, one schema-driven field renderer, one audit-entry component. Earlier prototypes failed by restyling the same idea per screen.
4. **Three quality dimensions stay independent.** Confidence, similarity, data type. "Exact" is not a status. A 100% match is a geometric duplicate (different file, same geometry) or a duplicate file. Where that surfaces in a row is undecided (see decisions log D-03); default is a small chip next to the data-type chip.
5. **Color is never the only signal.** Every status has text or an icon. Every overlay color has a legend.
6. **Fixtures first, services second, screens third.** Screens consume `Services` from a React context. Swapping stub for real service must not change a screen.
7. **Design system rules are not negotiable.** See section 3.

## 2. Stack defaults

Pick these unless the repo you are given already decides otherwise.

| Concern | Default | Why |
|---|---|---|
| Build | Vite + React 18 + TypeScript (strict) | Fast, standard, prototype-friendly |
| Routing | React Router v6, URL carries every state worth deep-linking (modality, file ids, filters, active tab) | Search on in a new tab must reproduce a state from a URL |
| State | Zustand for UI state (selection, filters, drawers, density, theme); services own data | No prop drilling, easy to reset |
| Data | Static JSON fixtures loaded through the stub services, in memory only | No persistence by design |
| Styling | The design system's `colors_and_type.css` tokens plus CSS modules. No Tailwind color utilities. | Semantic tokens only |
| Icons | Lucide | Design system rule |
| Fonts | DM Sans, DM Mono | Design system rule |
| Tests | Vitest + React Testing Library for components, Playwright for the acceptance flows in section 7 | Acceptance flows double as demo scripts |
| Lint | `design-system/_adherence.oxlintrc.json` rules where they apply, plus a custom check that no hex colors or raw px colors appear in components | Keeps tokens honest |

Do not add a state-machine library, a component kit, or a charting library until a screen needs it. SVG by hand is enough for the impact map and swim lanes (see the v2 prototype for the layout).

## 3. Design system contract (summarised; the README in `design-system/` is authoritative)

- Fonts: DM Sans for UI, DM Mono for numbers, IDs, units, part numbers. Weight cap 500.
- Radius 5px. No shadows. No gradients. Spacing steps 4/8/12/16, then 24/32/40/56/80.
- Semantic tokens only. Three themes via `data-theme`: White (default), Tan, Dark. Every screen must render in all three; add a theme switcher in the dev toolbar and in Settings.
- Chrome: 48px top bar, 36px breadcrumb strip. Sidebars 320px default, resizable 240 to 480, collapsed 56.
- Densities: Compact, Default, Comfy (row heights 15 / 10 / 8 padding units in the design system). Density is a global setting that every table obeys.
- Loading is skeleton, never a spinner on a page. Errors are inline. Toasts are for success only.
- CAD viewer: HOOPS in the real product. In the prototype the viewport is a placeholder (section 6, stub `cad-viewer`). Overlay colors: shared green, query-only red, result-only blue (labelled A red, B blue in compare).

## 4. App architecture

```
src/
  app/            routes, shell (top bar, left nav, breadcrumb), providers
  config/         appConfig.ts (schema, vocabularies, bands, labels), themes
  domain/         types.ts  <- copy of docs/03-domain-and-service-interfaces.ts
  services/
    index.ts      createServices(): Services
    stubs/        one file per StubId, deterministic, seeded from fixtures
  fixtures/       json + generators (see docs/04-fixtures-spec.md)
  components/
    shell/        TopBar, LeftNav, BreadcrumbStrip, FeedbackModal
    table/        TableShell (Filters / Columns / Manage), ColumnPicker, FilterSidebar, DensityControl
    panels/       SidePanel (resizable), BottomDrawer
    quality/      MatchQuality (confidence, similarity bar, data-type chip, duplicate chip, "why" popover)
    fields/       FieldRenderer (schema driven), FieldGroup
    audit/        AuditEntryRow, ApprovalButton
    viewer/       ViewerPlaceholder (+ toolbar), ConstraintList
    stub/         <Stub id>, StubLegend, useShowStubs
  features/
    home/         Launchpad, NewSearch
    search/       Files, Define, Results, Compare
    catalogue/    Landing, DrillDown, TableAndFilters, Compare (two forms)
    create/       Intake, AssemblyTree, BomReview, CompareParts, CostEstimate, Composition,
                  TestMapping, CarryoverReview, ImpactMap, RequirementTrace, EventLanes, TestDetail, ApprovePlan
    projects/     ProjectsDashboard (low-fi), OutputOverview
  dev/            DevToolbar (theme, density, showStubs, reset state, fixture picker)
```

### The `<Stub>` marker

Every place a screen shows simulated output wraps it:

```tsx
<Stub id="matching-engine" note="Pre-baked scores">{...}</Stub>
```

- Default: renders children untouched, with `data-stub="matching-engine"` on a wrapper (display: contents).
- With `?showStubs=1` or the dev toolbar toggle: draws a dashed outline and a small corner tag with the StubId. A legend page at `/dev/stubs` lists every StubId, its owner role, what the prototype does instead, and the screens that use it (generated from the registry, which is generated from the register table in `01-design-requirements.md`).
- A Vitest test fails the build if a screen imports a stub service without rendering a `<Stub>` for it.

### Service wiring

`createServices()` returns the `Services` object. Stubs are pure and seeded, so the same click always yields the same result. A dev-only `latency` option adds artificial delay to prove skeleton states.

### Routing

| Route | Screen |
|---|---|
| `/` | Home / Launchpad |
| `/search/new` | New Search (four modality cards plus recent searches) |
| `/search/files?modality=...` | Files |
| `/search/define?file=...&modality=...&part=...` | Define |
| `/search/results?q=...` | Results (query serialised in the URL so Search on in a new tab works) |
| `/search/compare?query=...&result=...` | Compare |
| `/catalogue` , `/catalogue/:nodeId` , `/catalogue/compare?a=...&b=...&form=dual\|table` | Parts Catalogue |
| `/create/bom` + `/create/bom/:step` | BOM creation pipeline (steps 01 to 04, 03b, 03c, 03d) |
| `/create/requirements/:step` | Steps 05, 06, 06b, 06c, Test detail, 07 |
| `/projects` , `/projects/:id` , `/projects/:id/outputs/:outputId` | Dashboard and Output overview |
| `/settings` | Theme, density, schema picker (company A / company B) |
| `/dev/stubs` | Stub legend |

## 5. Build order, with acceptance criteria

Each phase ends in a demo-able state and a Playwright flow. Do not start a phase before the previous one passes. After each phase commit with a clear message.

### Phase 0: Foundations (no feature screens)

Build: Vite scaffold, tokens and fonts from the design system, three themes, density control, app shell (top bar, left nav, breadcrumb strip, feedback modal), `AppConfig`, `Services` context with empty stubs, `<Stub>` and `/dev/stubs`, dev toolbar, TableShell, SidePanel, BottomDrawer, MatchQuality, FieldRenderer, AuditEntryRow.

Accept when: a kitchen-sink route (`/dev/kitchen-sink`) renders every shared component in all three themes and all three densities with fixture data; no raw hex values in `src/`; typecheck and lint pass; the schema-driven field renderer renders the same record under two different `SchemaConfig`s (company A: PLM fields as in the Adient example; company B: renamed fields and different status tones) with no code change.

### Phase 1: Fixtures and services

Build everything in `docs/04-fixtures-spec.md`: search fixtures, catalogue fixtures, dashboard fixtures, the derive layer over `/data`, and the stub services over them.

Accept when: unit tests prove determinism (same query yields the same rows), that every special case in the fixtures spec exists (geometric duplicate, duplicate file, "Manual measurement required", No match, Search failed, one result with all three quality dimensions, one with none), and that the Civic dataset passes `data/validate.py` and the counts in the fixtures spec.

### Phase 2: New Search, Files, Define

Build: New Search with four modality cards and recents; Files with filter sidebar (schema-driven controls), column picker, density, saved views stub, File Details drawer with Part/File Details and PLM tabs, Open in PLM disabled; Define with file pane, tab strip (Assembly, Measurements, PLM), part tree with Active/Reference parts, viewer placeholder, measurement capture, the four modality variants.

Accept when: Flow A (Files then Define then Results) and Flow B (Home search by part number, case/spacing/wildcard tolerant, Released by default) both reach Define; filters narrow the list and chips show applied filters; switching schema in Settings changes sidebar groups and detail tabs with no reload; measurement capture works through the simulated picker, capped by `limits.maxMeasurements`.

### Phase 3: Results and Compare

Build: Results table (pinned Source Part row at 0%, quality column group, measurement columns, expand row to Measurements and PLM Data tabs, row actions Compare, PLM link disabled, Search on in a new tab, workflow-context decision actions), filter sidebar with similarity range, confidence level and data type; Compare screen with side-by-side panes, Comparison and Measurements tabs, PLM tab, linked-camera toggle (visual state only), alignment constraints list with DOF counter, overlay legend (shared, A, B), under-constrained warning.

Accept when: opening Results from a workflow context shows that workflow's decision-action labels and returns to it; the same Results opened from Files shows none; "Manual measurement required" cells render with a clear call to action; a geometric duplicate row and a duplicate-file row both render without any "Exact" wording; Search on opens a new tab at a URL that reproduces the state.

### Phase 4: Parts Catalogue

Build (from `reference/catalogue/`): landing with category cards and tree, drill-down (Fasteners then Bolts as the worked example), table plus filters with filters narrowing the tree, part detail drawer, Compare in both forms (dual pane with field-match highlighting, aligned table), Use This Part as a placeholder decision action.

Accept when: the Bolt Finder concept behaviours work from fixtures (not hard-coded in components); compare works in both forms from the same two selected parts.

### Phase 5: BOM creation and cost

Build steps 01 intake, 02 assembly tree, 03 BOM review, 03b Compare parts, 03d Cost estimate, 04 Program composition, from the v2 prototype screens, now reading the Civic dataset (Si is the active BOM) through the derive layer. Run Surrogate Search is simulated by the `matching-engine` stub with a visible progress state. Detail drawer shows similarity with the five-metric breakdown. Cost estimate shows routing, why-this-model tags, line breakdown with confidence and trace panel.

Accept when: Si BOM shows 56 lines, with certainty spread (Actual / Surrogate / Estimated / No match) rendered through the vocabulary config; the KPI bar (cost, risk, reuse) is derived, not typed; Select as surrogate from Results returns to BOM review with the line updated and an audit entry.

### Phase 6: Requirements and traceability

Build steps 05, 06, 06b, 06c, 03c, Test detail, 07. Requirement to test mapping with Accept/Reject and a configurable confidence floor. Carryover review with flagged list and ranked candidate evidence. Impact map (SVG) with hop depth and direction controls. Requirement trace table with detail drawer and carryover chain strip. Event lanes. Approve and create plan with acknowledgement gate.

Accept when: the three dangerous-case requirements (REC-20001, REC-20007, REC-20016) are highlighted by a standing treatment that does not depend on selection (default, see D-08) and carry text; confirming any "Review required" item changes it to "Confirmed" and writes an audit entry with time and actor; Approve stays disabled until acknowledgement; Open in PLM and Export stay inert and say why.

### Phase 7: Projects dashboard (low-fi) and polish

Build the five-band Projects dashboard as specified in `design-briefs/projects-dashboard-lofi-brief.md` at low fidelity, Output overview, and Home recents. Then: empty states, skeletons for every async path, error state per screen (inline), keyboard navigation of tables, responsive behaviour down to 1280px width, all themes and densities, accessibility pass (focus rings, labels, color-not-sole-indicator).

Accept when: every screen passes the checklist in section 8; the whole product can be walked end to end in the order in `docs/demo-script` (create it from the acceptance flows).

## 6. Stub registry (what is simulated and how)

Each row is one `StubId` from `03-domain-and-service-interfaces.ts`. "Do instead" is what the stub does. Do not try to make these smarter than the row says.

| StubId | Do instead | Used on |
|---|---|---|
| `matching-engine` | Deterministic scores from fixtures. Same inputs, same ranking. Surrogate search sorts candidates by a hash-seeded score with the five-metric breakdown from the dataset where it exists. | Results, Compare, BOM review, Catalogue, 03b |
| `cad-viewer` | Placeholder viewport with the real toolbar state (view modes, linked cameras toggle, overlay legend). Face and edge picking is a list of named geometry the user chooses from. | Define, Compare, 03b, Catalogue compare |
| `mapping-agent` | None. Components read canonical JSON directly. The Settings schema picker swaps `SchemaConfig` to prove configurability. | All PLM or status data |
| `plm-connectors` | Toggles, last-sync strings, disabled Open in PLM links with tooltip "Not connected in prototype". | Intake, Files, drawers |
| `doc-extraction` | Static package list with detected types, counts and routes. | Intake, Composition |
| `cad-parser` | Fixed assembly tree and counts from fixtures. | Intake, Assembly tree, Files |
| `cost-model` | Three models for the worked part. Lines from `cost_estimates.json`. | 03, 03d |
| `test-matcher` | Static mappings from `requirement_test_links.json`. 50% floor from config. | 05, 06, 03c |
| `diff-engine` | Lookup from requirement statuses in the dataset. | 05, 06c |
| `evidence-engine` | Ranked candidates from carryover events. | 06 |
| `evidence-store` | Eight hard-coded records. Uploads create an in-memory record flagged "asserted, not computed". | 06, Test detail |
| `impact-graph` | Adjacency built from dataset links. 1 or 2 hops, direction filter. | 06b, 03c, 06c |
| `autonomy-gate` | Rule table: Actual carries forward, Surrogate proposes, everything else asks a human. Config object, not code. | 05, 06 |
| `audit-trail` | In-memory list; every confirm, approve and decision action writes one. Visible in UI. | Results approvals, 05, 06, 06b, 07 |
| `plan-service` | Hard-coded plan ID. Export and Open in PLM inert. | 07 |
| `persistence` | In-memory. Save buttons add to the visible Project tree and show a success toast. Reset in the dev toolbar. | My Projects, Save Search, Save View |
| `dashboard-services` | Fixtures for activity, aggregation and connection health. | Projects dashboard |
| `search-index` | Client-side filter with part-number-first matching. | Files, Home search, Catalogue |
| `dfmea-retrieval` | Not built. Show the direction page only if time allows. | DFMEA |

## 7. Acceptance flows (turn each into a Playwright test and a demo step)

1. **Flow A, Files first.** Home, New Search, Part to Part, Files, filter by Reuse Status, open File Details, Search from the row, Define, capture an area measurement, Results, expand the first non-source row, Compare, switch to Measurements tab.
2. **Flow B, Search by number.** Home search box, type a part number in a different case with a space, Released first, Define, Results.
3. **Assembly modalities.** Run each of the other three modalities once; the part-in-assembly variant shows the parent assembly column.
4. **Decision action round trip.** From BOM review open a line, Search on (new tab), choose Select as surrogate, return to BOM review with the line changed and an audit entry present.
5. **Catalogue.** Fasteners, Bolts, filter M16, select two, Compare in dual and table forms.
6. **RFQ to approved plan.** Intake, assembly tree, Create BOM, Run Surrogate Search, open a line, Compare parts, cost estimate, composition, test mapping (accept 3, reject 1), carryover review (confirm one flagged item, check the audit entry), impact map, trace, approve with acknowledgement.
7. **Configurability.** Switch the schema in Settings from company A to company B; filter sidebar, columns, detail tabs and status tones change; no code change.
8. **Themes and densities.** Cycle all themes and densities on Results and BOM review; no unreadable text, no layout breaks.

## 8. Definition of done (per screen)

- Renders in White, Tan, Dark; Compact, Default, Comfy.
- No hard-coded status strings, tones, PLM field names or thresholds in the component.
- Uses the shared components listed in section 4, not local copies.
- Every simulated element is wrapped in `<Stub>`.
- Skeleton for loading, inline error, empty state, success-only toast.
- Color is never the only signal.
- Deep-linkable URL for every meaningful state.
- Keyboard reachable; visible focus.
- Typecheck, lint and tests pass; screenshot taken at 1440x900 and 1280x800 and compared to the matching snapshot in `docs/snapshots/` or the design reference in `reference/`.

## 9. Do not implement as-is

- The v2 prototype's inline constants (Turbocharger Module data). Replace with the dataset through the derive layer.
- The v2 prototype's top-nav-only shell. Use the shell in section 4.
- "Exact" as a similarity band or status anywhere.
- The five competing confidence treatments from earlier prototypes. Use `MatchQuality`.
- Any HOOPS integration, real CAD parsing, real matching, real PLM calls. These are stubs.
- Toast-only audit. Toasts are feedback; the audit entry is the record.
- Locked or upsell workflows and the "Found It" button. Removed.
- The beta's two-tab top nav. A beta limitation.
- Per-screen restyles of tables, drawers or badges.
- The unconfirmed DFMEA screens. Direction only.

## 10. When something is ambiguous

1. Check the tag in `01-design-requirements.md`. Decided wins.
2. Check `05-decisions-log.md`. It has the default assumption for every open question; use it and note it in the PR.
3. If neither answers it, choose the option that keeps behaviour configurable, add a row to the decisions log with your assumption, and continue. Do not block.
