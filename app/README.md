# Datum requirements workflow — coded prototype

A working React + Vite implementation of the RFQ-to-test-plan prototype, built from `../datum-requirements-workflow-handoff`
(design docs, the `RFQ to Test Plan v2` mockup, and the Civic 1.5T example dataset). It is wired to the **live dataset** —
`src/data/index.js` imports the JSON files from `../datum-requirements-workflow-handoff/data` directly, so regenerating the
data regenerates the app. The Si program (`PGM-CIV-SI`, RFQ-26-0512) is the active RFQ; LX and Sport are the evidence sources.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/ (hash routing, works from any path)
```

## Screens (hash routes)

| Route | Screen |
|---|---|
| `#/dashboard` | **Project overview / Output overview** — action boxes, status bar, data-viz slot (zoom × metric × form), filterable overflow table (closes gap 2a) |
| `#/intake` → `#/tree` | RFQ intake, assembly tree → Create BOM |
| `#/bom` | BOM review: shared table shell (Filters / Columns / Manage, subfolders), row panel with Summary / Similarity / Costing / PLM, Accept as surrogate |
| `#/bom/compare/:lineId`, `#/bom/cost/:partId` | Compare parts; Cost estimate (model routing, input maturity, trace, sourcing, alternatives, Open Features) |
| `#/composition` | New / Carryover / Uncertain — moves as surrogates are confirmed |
| `#/mapping` | Requirement → test mapping with Accept / Reject / Undo, bulk accept by threshold |
| `#/carryover` | Carryover review; Undetermined → ranked candidates, manual search, Upload Proof (tagged *asserted*) |
| `#/trace`, `#/impact/:reqId`, `#/test/:testId` | Requirement trace (+ carryover-chain drawer), Impact map, Test detail |
| `#/approve` | Approve and create plan; Export TDM (CSV) |

## Standing decisions implemented

- Shell is `ui-design-current` (tokens in `src/styles/tokens.css`, taken from the current design-system export — the newer scale: 15px body, 13px floor, IBM Plex Mono for data, 36px buttons, 40px rows, status tokens with borders; the copy under `datum-requirements-workflow-handoff/prototype/_ds` is an older version; White / Tan / Dark in the user menu). No second nav sidebar.
- One `TableShell` serves BOM and requirement trace. Adding a column adds its filter even when hidden; removing a column drops its filter unless it is actively applied; visibility toggles never touch filters.
- Right-hand panel is the detail view everywhere; the bottom drawer is only for the chronological carryover chain.
- Every decision goes through one confirmed-action path (`decide` in `src/store.jsx`): state change + toast + user/timestamp audit record + Undo (gap 2g).

## Open items from the consolidated brief — choices made here

| Gap | Choice |
|---|---|
| 2b taxonomy | Subfolders by Subsystem (matches BOM) by default; Category / Sub-category are derived columns; grouping switchable in Manage. |
| 2c dangerous case | Row highlight is computed from `Text=Unchanged ∧ Driven-by=Changed`, independent of selection. |
| 2d driven-by score | Always shown; missing score renders `n/a` with a tooltip. |
| 2e owner | Shown on Mapping, Carryover, Trace, Dashboard and Approve; reassignable in the trace panel. |
| 2f severity | The dataset's placeholder Critical/High/Medium/Low scale, shown everywhere owner is. |
| Due dates | Inherited from the RFQ scope (`2026-10-09`), not per action. |
| Duplicates | Stay as Similarity-tab provenance text rather than a new Certainty tier. |

## Known limits

- State is client-side only (decisions persist in `localStorage`; "Reset demo state" is in the user menu). No backend.
- The CAD viewer, PLM links, and feature recognition are placeholders. Cost estimates exist for 5 lines in the dataset; other lines get a clearly labelled derived estimate.
- Candidate-evidence ranking for Undetermined rows uses the dataset's links plus a title-overlap heuristic capped below 50%.
- "Search failed" certainty has no data and is not demoed (see `data/README.md`).
