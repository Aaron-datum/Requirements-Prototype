# Search feature: assumptions (for the integrator to merge into docs/05-decisions-log.md)

| ID | Question | Default built | Files |
|---|---|---|---|
| S-01 | What is the decision-action value written to the ledger? | The library file name of the chosen row (for example `FrameBack_Outer_v8.CATPart`), so the audit entry and the workflow tab read well. Fixtures are CAD files, not Civic parts; the workflow can map the name back with `findFileByName`. | `Results.tsx`, `Compare.tsx` |
| S-02 | Breadcrumb after an upload from New Search. | Always `Search / Files / Define / Results / Compare`, as the requirements doc specifies for Search. `Home / New Search` is used only on the New Search screen. | all search screens |
| S-03 | Where does the modality come from in Define? | From New Search the card fixes it (`src=new`). Otherwise it is implied by the node chosen in the tree: root or sub-assembly gives assembly to assembly, leaf part gives part in assembly to part. Part files keep the `modality` URL parameter. Reference parts are shown but not selectable. | `Define.tsx` |
| S-04 | File Details drawer tabs. | `Details` (thumbnail, type and size, File section) and `PLM` (every schema field grouped by `config.schema` group, Open in PLM disabled). Group sections change with the schema. | `Files.tsx` |
| S-05 | "Released first" without a status string. | The caller treats the first vocabulary entry of `releaseStatus` (and every entry sharing its label, such as `id1055`) as preferred. Ranking: part-number prefix, then name, then description; within a rank preferred status, then newest. | `searchIndex.ts`, `Files.tsx` |
| S-06 | Confidence filter levels. | Numeric scores map to High / Moderate / Low at 85 / 65 (example thresholds in `modalities.ts`, not in a component). Word confidence is used as is. | `modalities.ts` |
| S-07 | "Matched" child part in Contained Parts. | A child is matched when its percentage is not in the lowest similarity band (config). The tab label and caption count the same list (the tree's active leaf parts), which reconciles the header count with the caption. | `ResultDetail.tsx` |
| S-08 | Review required rows. | Fixture rows with an unsure data type (Surrogate, Estimate) carry `approval` pending. The screen shows approval only when a workflow context is present, and confirmations are local to the page plus an audit entry. | `results.ts`, `Results.tsx` |
| S-09 | Result sets and special cases. | Eight featured query cases (4 modalities x 2 files) carry every special case in docs/04 section 4; any other query gets a seeded rotation of them. Duplicate classification derives from `geometryHash` (same name = duplicate file, different name = geometric duplicate). | `fixtures/extras/search/results.ts` |
| S-10 | Measurement values and tolerances. | Values are deterministic from (file, type, geometry); tolerance per type is data in `measurementTypes.json`. One candidate per featured set gets `manual-required` for the first measurement. Rows with No match or Search failed have no measurement values (rendered as a dash). | `derive-search.ts`, `results.ts` |
| S-11 | Compare under-constrained. | Warn, do not block (D-06). Constraint type is inferred from the two picked surfaces and shown as a suggestion the user can change. DOF removed per constraint: Coplanar 3, Coaxial 2, Concentric 2, Parallel planes 1, never below 0. "Aligned by N" counts the list. | `Compare.tsx`, `services/stubs/compare.ts` |
| S-12 | Find Duplicates / Find Revisions nav items. | Open Files with a `mode` banner that pre-filters to files that share geometry, or belong to a lineage. | `Files.tsx` |
| S-13 | Upload simulation. | Picks the fixture with the same name (case, spacing, separator tolerant). Wrong kind for the modality is refused inline; an unknown name continues with a sample of the right kind and says so. | `UploadModal.tsx` |

## Shared files changed
- `src/components/table/TableShell.tsx`: `header` and `toolbar` also accept a function of the table model (additive).
- `src/components/viewer/Viewer.tsx`: `height` also accepts a CSS string such as `100%` (additive).

## Known, not mine
- The left nav highlights all four Search items on `/search/files` because `NavLink` ignores the query string (shell, Phase 0).
