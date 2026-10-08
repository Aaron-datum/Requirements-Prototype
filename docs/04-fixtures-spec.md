# Fixtures spec

All data is fake. Fixtures are static JSON (or small deterministic generators) loaded by the stub services. Nothing here is real part data. Generate with a seeded RNG so every run is identical.

Where a fixture already exists in `reference/` or `data/`, reuse its shape and content, and fix the known problems listed per section.

---

## 1. Fixture sets and where they come from

| Set | Source | Status |
|---|---|---|
| Create workflows (BOM, cost, requirements, tests, carryover) | `data/*.json` (Civic 1.5T, 3 trims, Si is the active BOM) | Exists. Use through a derive layer (section 6). |
| Search files and PLM fields | `reference/search-design-files/file_selection/fs-data.jsx` (30-ish automotive CAD files, filter schema) | Exists as JSX. Port to JSON. |
| Search results, assemblies, duplicates, revisions | `reference/search-design-files/part_vs_assembly/data.jsx` (seat assembly example, lineages Rev A, B, AA, AB) | Exists as JSX. Port to JSON. **Remove the "Exact Match" level**, see section 3. |
| Parts Catalogue (bolts) | `reference/catalogue/Bolt Finder Prototype.dc.html` | Extract inline arrays into JSON. |
| Dashboard | `docs/design-briefs/projects-dashboard-lofi-brief.md` | Spec only. Write new. |
| Recent searches, saved views, projects tree | none | Write new. |

## 2. Two schemas to prove configurability

Ship two `SchemaConfig`s plus two `StatusVocabulary` sets. Settings switches between them.

**Company A (default, Adient-like).** PLM fields as in the Adient results screenshot (`docs/snapshots/real_adient_results.jpg`) and the File Selection filter schema: program, model year, release status, program type, customer group, lifecycle state, region, product group, product line, calculated weight, released date. Source labels: Teamcenter, CAD Library. Reuse Status and conformance states as in the Adient TDM summary (`docs/design-briefs/adient-tdm-sor-summary.md`).

**Company B (deliberately different).** Same underlying records, but: fields renamed (`program` becomes "Vehicle line", `releaseStatus` becomes "Maturity"), two fields dropped, one added (a numeric "Supplier lead time" in weeks with a range filter), opaque status IDs resolved through the vocabulary (`id1055` becomes "Released"), different tone mapping, and the data-type vocabulary shortened. If any component needs a code change to render company B, the component is wrong.

Both configs live in `src/config/`. Unknown raw values must fall back to raw text plus neutral tone; include one record with an unknown status in each set to prove it.

## 3. Match quality vocabulary

- Similarity bands from config: High >= 85, Medium >= 70, Low < 70 (example values).
- **No "Exact" band.** The old `part_vs_assembly/data.jsx` has Exact Match at >= 95; do not port it.
- Duplicates are a separate classification on the row: `geometric-duplicate` (different file, 100% same geometry) and `duplicate-file`. Both carry similarity 100 and are surfaced as a chip, default placement next to the data-type chip (decisions D-03).
- Data type values (example vocabulary): Actual, Estimate, Surrogate, No match, Search failed.
- Confidence: numeric 0 to 100 or word (High, Moderate, Low) depending on the row; both forms must exist in fixtures so the component's two treatments are exercised.

## 4. Search fixtures

### Files (`fixtures/search/files.json`)

- 40 files: 28 parts, 12 assemblies. Formats mixed: CATPart, CATProduct, SLDPRT, STEP, JT, PRT. Sources: Teamcenter, CAD Library, Windchill (so the source filter has three values).
- At least 5 files in a revision lineage (Rev A, B, C, then AA, AB, AC).
- Each file has the PLM field set from company A, plus created, modified, last-synced, size.
- At least 3 files have no PLM record (empty PLM tab state).
- Assemblies carry a `tree` (3 to 5 levels, 6 to 40 nodes). One assembly is the "Complete Seat" with the 12 seat parts from `data.jsx`. Tree nodes are Active parts or Reference parts.
- Names follow part-number-first patterns so the part-number search (case, spacing and wildcard tolerant, Released by default) has something to exercise: include `7100490_0000_AB_ASM_RSB40_DEF.CATPart`, `K04-117-RS_BRKT_MOUNT.SLDPRT` and near-duplicates differing by case and separators.

### Search results (`fixtures/search/results.json` or generated)

For each of the four modalities, ship results for at least two source files (8 query cases minimum). Each result set:

- First row is the pinned **Source Part**, similarity 0%, labelled "Source Part".
- 8 to 14 candidate rows, similarity spread across all three bands.
- Must include, across the sets (not necessarily each): one geometric duplicate; one duplicate file; one row with confidence + similarity + data type; one row with data type only; one row with none of the three; one "No match" (no similarity percentage); one "Search failed" (no similarity percentage, retry affordance); one row whose source is a different PLM than the query.
- Part-to-assembly and assembly-to-assembly results carry child-part match lists (12 seat parts with match percentages, as in `data.jsx`).
- Part-in-assembly-to-part results carry `parentAssemblyId` and an assembly column.
- Measurement columns: the query defines up to `limits.maxMeasurements` measurements; each candidate has a value and a deviation percentage. **One candidate per set has `candidate: 'manual-required'` for one measurement** (renders "Manual measurement required" with a call to action).
- Review/approval: when results are opened from a workflow context, a subset of rows has `approval.status = 'Review required'`. Confirming sets `Confirmed` and writes an `AuditEntry` (who = the fixture current user, at = now).

### Measurements

Types are data: Area, Perimeter, Height, Diameter, Length (add Volume to prove it is not a fixed list). Each type has a unit. `listPickableGeometry(fileId)` returns 6 to 12 named faces, edges and bodies per file for the simulated picker.

### Compare

For any (query, result) pair: `computeOverlap` returns deterministic numbers from a hash of the two ids (query-only, overlap, result-only percentages summing to 100, max deviation in mm, bbox delta, volume match). Constraint inference rule is a placeholder: planar faces give coplanar, cylindrical give coaxial; the user may override. DOF counter starts at 6 and drops by 1 to 3 per constraint, never below 0; under-constrained shows a warning (decisions D-06).

### Saved items

Recent searches (6), saved searches (4), saved views (3), My Projects tree (3 projects with counts for Saved searches, Outputs, Configurations). In memory only; Save adds to these lists.

## 5. Catalogue fixtures (`fixtures/catalogue/*.json`)

Extract from `Bolt Finder Prototype.dc.html`:

- Category tree: top-level categories, Fasteners expanded to Bolts, Screws, Nuts, Washers (counts consistent with the table rows you ship).
- 60 to 120 bolt rows with the field set used in the concept (size, length, grade, head type, material, finish, standard, supplier, reuse status, in-use programs).
- Facet counts computed from rows, not typed.
- Two selected-part pairs with intended field matches and mismatches so the compare highlighting has all states: `HX-M16-120-A2` vs `SH-M16-110-88` is the worked pair.
- Reuse Status vocabulary comes from config (not literals).
- "Use This Part" is a placeholder decision action; label and effect come from the workflow context.

## 6. Derive layer over the Civic dataset

`data/` is relational JSON. The UI needs view models. Build `src/fixtures/derive.ts`:

| Derived | From | Rule |
|---|---|---|
| Si BOM table | `bom_lines` where `program_id = PGM-CIV-SI`, joined to `parts`, `suppliers` | 56 lines. Group by `subassembly`. |
| KPI bar (cost, risk, reuse) | Si lines | Cost = sum(unit_price_usd x quantity). Reuse % = lines with certainty Actual or Surrogate over total. Risk = count of Estimated + No match + requirements with severity Critical or High. Show the formula in a tooltip. |
| Match certainty bar | Si lines | Counts by certainty. Labels from the vocabulary config. |
| Surrogate detail | `surrogate_breakdown`, `other_candidates` | Five bars: geometry, manufacture complexity, material, supplier location, order of magnitude. |
| Requirement table | `requirements` joined to `parts` (Si), `requirement_test_links`, `tests` | Rows per requirement with proposed tests and confidence; floor from config. |
| Carryover chain | `carryover_events` by `req_id` | Ordered by date. |
| Dangerous cases | `dangerous_case = true` | REC-20001, REC-20007, REC-20016. |
| Still-open list | requirements with a linked test run `Scheduled` or `In progress` on Si | REC-20001, 20006, 20007, 20008, 20013, 20016. |
| Impact graph | requirements, parts, tests, `requirement_test_links`, carryover | Nodes typed REQ, DOC, PRT, TST, PLN. Edges `depends-on` and `donates-evidence`. |
| Cost estimate | `cost_estimates` | 5 parts. Show routing score, suggested model, next best, why-this-model tags, breakdown. |

Known counts the tests must assert: 78 parts, 14 suppliers, 166 BOM lines (LX 55 at $3,384.40, Sport 55 at $3,609.05, Si 56 at $4,071.36), 16 requirements, 15 tests, 25 test runs, 16 requirement-test links, 10 carryover chains, 5 cost estimates.

### Gaps in the dataset the derive layer must fill

| Gap | Fill with |
|---|---|
| No "Search failed" record | Presentation-only: a per-session simulated failure on one line with a retry affordance. |
| No intake package (files, counts, routes) | Static JSON for RFQ-26-0512 mirroring the v2 intake screen: package contents, detected types, found counts, routes. Counts: reconcile the 244 / 98 / 571 requirement counts by showing extracted vs in-scope, and note the reduction in the UI help text (decisions D-09). |
| No assembly tree for Si | Generate from `subassembly` groupings in `bom_lines`. |
| No audit entries | Start empty. Written at runtime. |
| Regions, currency, units differ from the v2 prototype | Choose canonical forms: USD, metric, region codes from the dataset. Format via config. |
| Source labels differ | Use the dataset's; map through config. |

### Turbocharger Module data in the v2 prototype

Do not carry over. Keep the screens' layout; replace values with the Civic dataset. Where a v2 screen needs a field the dataset lacks (for example the 03d routing "why" tags beyond the five parts), derive or extend `cost_estimates.json` in `src/fixtures/extras/` rather than editing `data/`.

## 7. Determinism and reset

- One seeded RNG (`mulberry32`) exported from `src/fixtures/rng.ts`; every generator takes a seed string.
- `persistence.reset()` restores all in-memory state. Dev toolbar has Reset.
- No `Date.now()` in rendering paths except the audit entry timestamp; tests inject a clock.

## 8. Fixture validation

Add a Vitest suite that loads every fixture and asserts: ids unique, foreign keys resolve, every vocabulary raw value has a vocabulary entry (except the intended unknown-status record), similarity within 0 to 100, duplicates have similarity 100 and a classification, no row has the word "Exact" in any label, and the Civic counts match section 6.
