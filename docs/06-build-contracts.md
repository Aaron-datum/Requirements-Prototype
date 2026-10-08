# Build contracts: shared APIs every feature uses

Phase 0 and the Civic derive layer are built. Feature phases (search, catalogue, BOM and cost, requirements, projects and home) build on these. Read the source; this is the map.

## Rules that are enforced by tests or lint
- `npm run lint` (oxlint plus `scripts/check-tokens.mjs`): no hex or rgb colours, no raw font families, no weights above 500, no shadows, no gradients in `src/`. Use tokens (`var(--accent)`, `var(--gap-3)`, `var(--text-small)` ...) from `design-system/colors_and_type.css`.
- `src/services/stubUsage.test.ts`: any file under `src/features/` that calls `useService('x')` must render a `<Stub id="...">` for the matching StubId (`SERVICE_STUB` in `src/services/context.tsx`).
- No component compares against a status string. Use `useVocab().resolve('<vocabularyId>', raw)` for label and tone, and `useConfig()` for thresholds, `matchRules` and limits. Unknown raw values render as raw text with a neutral tone (already handled by `resolveValue`).
- "Exact" is not a status or label anywhere. A 100% match is a `duplicate: 'geometric-duplicate' | 'duplicate-file'` on MatchQuality.
- Toasts are success-only (`toastSuccess`). Errors are inline (`InlineError`). Loading is `SkeletonRows`. Empty states use `EmptyState`.
- Every confirm, approve and decision action writes an audit entry through the `audit` service (`useService('audit').record({by, action, subject, note})`) and then toasts. The audit list is `<AuditList subject={...}/>`.
- Every meaningful state is deep-linkable: use route params and search params. `TableShell urlSync` keeps filters and sort in the URL.
- Dates and times come from `src/lib/clock.ts` (`now()`), randomness from `src/lib/rng.ts`. Never `Date.now()` or `Math.random()` in fixtures or rendering.

## Components (all in `src/components/`)
| Component | Use |
|---|---|
| `table/TableShell` | The one table. Columns are `ColumnDef<R>` (`table/types.ts`): `filter` picks the control by data type (`text-search`, `multi-tag`, `multi-search`, `level-seg`, `range-units`, `date-preset`), `pinned`, `showOnlyWhenFiltered`, `label_of` for vocabulary labels. Props: `pinnedRows` (Source Part), `renderExpanded` (row tabs), `rowTone` (standing highlight), `rowActions`, `groupOptions` (subfolders), `renderCard` (gallery), `urlSync`, `paginate`, `loading`, `error`, `checkedIds` (multi-select), `onModel` (read filtered rows or drive filters from outside). `FilterSidebar` and `useTableModel` are exported if you need the pieces. |
| `panels/SidePanel`, `BottomDrawer` | Right-hand detail panel (resizable, tabs) and the bottom drawer for chronological content only. |
| `quality/MatchQuality` | The one confidence / similarity / data-type component. `quality` is the `MatchQuality` type in `domain/types.ts`. |
| `fields/FieldRenderer`, `FieldGroups`, `FieldValueView` | Schema-driven PLM fields from `config.schema`. Pass a record keyed by `FieldDef.key`. |
| `audit/ApprovalButton`, `AuditList`, `AuditEntryRow` | Review required to Confirmed lifecycle and the audit trail. |
| `viewer/ViewerPlaceholder` | The placeholder CAD viewport with real toolbar state and overlay legend. |
| `ui/*` | `Button`, `IconButton`, `LinkButton`, `Badge`, `Seg`, `Tabs`, `Checkbox`, `SearchBox`, `TextInput`, `Modal`, `Skeleton`, `SkeletonRows`, `EmptyState`, `InlineError`. |
| `stub/Stub` | Wrap every simulated output: `<Stub id="matching-engine" note="...">`. |
| `shell/useBreadcrumbs` | Each screen publishes its trail: `useBreadcrumbs([{label:'Search', to:'/search/new'}, {label:'Files'}])`. |

## Services, config, stores
- `useService('engine')` etc. returns the stub from `src/services/stubs/<name>.ts`. Each stub file has an OWNER comment naming the phase that implements it. Implement only your own stub files. Stubs are pure and deterministic; use `delay()` from `services/latency.ts` for async ones.
- `useConfig()` gives `AppConfigFull` (schema, vocabularies, bands, thresholds, `matchRules`, `currentUser`, `planLabel`). Add new vocabularies in `src/config/appConfig.ts` for BOTH tenant profiles.
- Stores (`src/stores/`): `useLedger` (audit and recorded decisions, synced across tabs), `useProjectStore` (projects tree, recents, saved searches and views), `useAppStore` (theme, density, tenant, showStubs), `toastStore`. Feature-local stores are fine (zustand) inside your feature folder.
- Fixtures: the Civic dataset is typed in `src/fixtures/civic.ts` and joined in `src/fixtures/derive.ts` (do not edit those two; add `src/fixtures/derive-<area>.ts`). New fake data goes in `src/fixtures/extras/<area>/`. Never edit `data/` or `reference/`.

## Workflow contexts and decision actions (contract between Search, Catalogue and Create)
`src/lib/workflowContext.ts` and `src/config/workflows.ts`. A screen reached from a workflow carries `?ctx=<workflowId>:<subject>&ret=<returnTo>` (use `ctxQuery`, `withCtx`). `useWorkflowCtx()` returns the context or null. When non-null, render the context's decision actions (labels from the registry) on rows, in drawers and in Compare; when null, render none. Applying one calls `applyDecisionAction(ctx, action, partId, {audit, config})`, which records the decision in the ledger under `decisionKey(effect, subject)` (for BOM review: `select-surrogate:<bom_line_id>` = the chosen part id), writes the audit entry, and returns `returnTo`. The workflow tab reads `useLedger((l) => l.decisions[...])` to show the change. "Search on" opens `searchOnHref(fileId, ctx)` in a new tab (`target="_blank"`).
Search-side entry points other areas link to: `/search/define?file=<id>&modality=<modality>`, `/search/results?...`, `/search/compare?query=<id>&result=<id>`. Home's hero search goes to `/search/files?q=<text>&modality=part-to-part`.

## Quality bar per screen (docs/02 section 8)
Three themes, three densities; no hard-coded status strings, tones, PLM field names or thresholds; shared components only; every simulated element in `<Stub>`; skeleton, inline error, empty state; deep-linkable; keyboard reachable with visible focus; typecheck, lint, unit tests and the screen's Playwright flow pass; compare a 1440x900 and 1280x800 screenshot with the matching file in `docs/snapshots/` or `reference/`.
