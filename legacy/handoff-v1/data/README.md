# Example dataset — Civic-class 1.5T engine assembly, 3 trims

A realistic, internally-consistent example dataset for the RFQ-to-test-plan prototype, built to seed a small relational database. Modeled on a Honda-Civic-style turbocharged 1.5L inline-4 engine family, loosely grounded in real automotive architecture (not literal OEM part data). Three trims share most of the engine and differ specifically in the turbocharger system, demonstrating every certainty tier, both surrogate types (duplicate vs. surrogate), and the requirement/test carryover chain end to end.

## The three programs

| Program | Status | Role |
|---|---|---|
| **Civic LX 1.5T** (`PGM-CIV-LX`) | In production (MY2025) | Baseline trim — small single-scroll turbo. Fully resolved BOM; primary surrogate source. |
| **Civic Sport 1.5T** (`PGM-CIV-SPT`) | In production (MY2025) | Mid trim — larger single-scroll turbo, electronic wastegate. Fully resolved BOM; secondary surrogate source. |
| **Civic Si 1.5T** (`PGM-CIV-SI`) | **Quoting** (MY2026, RFQ-26-0512) | Performance trim — twin-scroll turbo, forged pistons, larger injectors, air-to-water intercooler. **This is the active BOM** running surrogate search against LX and Sport. |

This mirrors the app's real workflow: a new RFQ searches for matches among parts already in production on other programs, rather than three unrelated model years.

## What's deliberately varied, and why

- **~41 parts are literal duplicates across all three trims** (block, head, cooling, most electrical/accessory) — same `part_id` reused verbatim. These show up with `certainty: "Actual"` and `provenance: "Carryover — geometric duplicate"` on Si's BOM, exactly like the already-built "duplicate" case in the live prototype (`Provenance: Carryover — geometric duplicate` on the turbine wheel row).
- **6 parts are shared between LX and Sport only**, with a distinct Si replacement that has a clear, plausible surrogate (same supplier/platform, incremental spec change) — e.g. the forged piston, the bigger injector, the bigger MAP sensor.
- **8 part families vary across all three trims** (turbine wheel, compressor wheel, CHRA, turbine housing, compressor housing, wastegate actuator, intercooler, charge pipes) — these are the heart of the turbo system and carry a full `surrogate_breakdown` (Geometry / Manufacture complexity / Material / Supplier-location / Order of magnitude), matching the live `SIMILAR-TO` card exactly.
- **One part has no surrogate at all**: `ELEC-925-C`, a turbine-inlet EGT sensor that's genuinely new to this engine family (`certainty: "No match"`) — there's nothing to compare it to, which is a different situation than a merely-low-confidence surrogate.
- **One case is a weak/low-confidence surrogate** (`INT-510-C`, the air-to-water intercooler vs. the air-to-air original) at 55%, below the surrogate-confidence threshold used elsewhere in the dataset, routed to `certainty: "Estimated"` — this exercises the "estimated, not a real surrogate match" tier.
- **Note on the "Search failed" tier**: this dataset does not populate it, since it represents a transient system/process failure (search didn't complete) rather than a sourcing conclusion like the other four tiers. If the UI needs to demo that state, it's a presentation-layer concern (show a retry affordance) rather than a data record — flagging this as an open question rather than guessing at a fake failure record.
- **3 requirements are deliberately "dangerous cases"** (`REC-20001`, `REC-20007`, `REC-20016`): the requirement's own clause text reads `Unchanged`, but the thing it traces to (`driven_by_status`) is `Changed` — the exact pattern called out in `requirement-trace-table-cleanup.md` and `prototype-v2-consolidated-design-brief.md` (2c) as needing a highlight that doesn't depend on row selection.
- **Carryover review "still open" items**: `REC-20001`, `REC-20006`, `REC-20007`, `REC-20008`, `REC-20013`, `REC-20016` on Si have test runs that are `Scheduled` or `In progress` rather than `Carried`/`Pass` — a realistic flagged list with a spread of severities and owners.
- **Severity and owner are present on every requirement**, closing gaps 2e/2f from the consolidated design brief — this dataset doesn't need to wait on that decision to be useful; it ships a `severity` (Critical/High/Medium/Low) and `owner` field now, with a lightweight placeholder DFMEA-style scale.

## Files and schema

Each file is a flat JSON array of records, suitable for a direct bulk-insert into one table per file. Suggested primary/foreign keys below.

### `programs.json`
`program_id` (PK), `name`, `model_year`, `status` (`in_production`|`quoting`), `rfq_id`, `description`, `owner`.

### `suppliers.json`
`supplier_id` (PK), `name`, `region`, `category`.

### `parts.json`
`part_id` (PK), `name`, `subsystem`, `material`, `manufacture_method`, `complexity` (Low/Med/High), `weight_kg`, `base_price_usd`, `lead_time_wk`, `supplier_id` (FK → suppliers). This is the master catalog — every physical part that exists anywhere across the three programs, including every A/B/C variant as its own row.

### `bom_lines.json` — the core BOM table
`bom_line_id` (PK), `program_id` (FK → programs), `part_id` (FK → parts), `subassembly`, `quantity`, `unit_price_usd`, `currency`, `price_source`, `supplier_id` (FK → suppliers), `region`, `certainty` (`Actual`|`Surrogate`|`Estimated`|`No match`), `surrogate_match_pct` (nullable int), `surrogate_breakdown` (nullable object: `geometry`/`manufacture_complexity`/`material`/`supplier_location`/`order_of_magnitude`, each 0–100), `provenance` (free text, matches the Similarity-tab copy style), `other_candidates` (array of `{part_id, program_id, match_pct}` — the "other candidates" ranking), `carry_note` (nullable), `match_type` (`duplicate`|`surrogate`|`estimated`|`new`|null).

One row per (program, part) pair — this is a join table in spirit (a program's BOM is "give me all `bom_lines` where `program_id = X`") but is flattened here since that's the unit the UI actually renders as a table row.

### `requirements.json`
`req_id` (PK), `title`, `subsystem`, `linked_part_id` (FK → parts), `source_type` (`RFQ`|`Carryover`|`OEM Spec`), `citation`, `requirement_text`, `text_status` (`New`|`Changed`|`Unchanged`), `driven_by_status` (`New`|`Changed`|`Unchanged`), `driven_by_confidence` (nullable int, 0–100), `dangerous_case` (bool — `text_status == "Unchanged" and driven_by_status == "Changed"`), `severity` (`Critical`|`High`|`Medium`|`Low`), `owner`, `notes`.

All 16 requirements here are scoped to the Si program (the one being quoted) — `linked_part_id` always points at the Si-specific part id where one exists, so joining `requirements.linked_part_id = bom_lines.part_id AND bom_lines.program_id = 'PGM-CIV-SI'` gives you the Requirement → BOM line view directly.

### `tests.json`
`test_id` (PK), `name`, `standard`, `lab`, `procedure`, `req_ids` (array of FK → requirements — a test can cover more than one requirement, e.g. `DV-TC-211` covers both the wastegate actuator and the blow-off valve response requirements, giving a real "Referenced-by" cross-requirement case for the Test detail screen).

### `requirement_test_links.json` — the req ↔ test join, with matching metadata
`req_id` (FK), `test_id` (FK), `match_confidence` (nullable int), `why_matched` (array of tags: `RFQ`|`Carryover`|`PLM`|`Supplier`|`CAD features`|`Internal`), `reasoning` (free text — this is the literal "Why this test" panel copy).

### `test_runs.json` — run history, across programs
`run_id` (PK), `test_id` (FK), `program_id` (FK), `date` (nullable — null means not yet run), `result` (`Pass`|`Fail`|`Carried`|`Scheduled`|`In progress`), `samples` (nullable int), `notes`. `result: "Carried"` means the run was not repeated for this program — it's reusing an earlier program's run, which is pointed to in `notes`.

### `carryover_events.json` — the chronological chain per requirement
`req_id` (FK), `events` (array of `{date, event, program_id, note}`, ordered). `event` is one of `Raised`|`Test run`|`Test in progress`|`Carried`|`Interface changed`|`Requirement changed`|`Flagged for review`. Only populated for the 10 requirements with a meaningful multi-hop history (the other 6 are either brand-new to Si with nothing to chain, or omitted here for brevity — same shape would apply).

### `cost_estimates.json` — cost-model routing, for 5 representative Si lines
`part_id` (FK), `program_id` (FK), `routing_score` (0–100), `routing_status`, `suggested_model`, `next_best_alternative`, `why_this_model` (array of `{tag, note}`), `input_maturity` (`{3d_cad, 2d_drawing, material_spec}`, each `Have`|`Via surrogate`|`Missing`), `cost_breakdown` (array of `{line, amount_usd, confidence}`). Not every Si BOM line has a cost estimate — only the 5 chosen to show a spread of routing scores (30–90) and input-maturity states, matching the Cost Estimate page's structure.

## Suggested load order (FK dependencies)

1. `suppliers.json`
2. `programs.json`
3. `parts.json`
4. `bom_lines.json`
5. `requirements.json`
6. `tests.json`
7. `requirement_test_links.json`
8. `test_runs.json`
9. `carryover_events.json` (one row per event if flattened to a table — `req_id`, plus an auto-increment or composite key on `(req_id, date, event)`)
10. `cost_estimates.json`

## Known gaps / open questions for whoever picks this up

- `Search failed` certainty tier has no data — see note above.
- Requirements and tests are scoped only to Si (the active RFQ); LX and Sport don't have their own full requirement sets in this pass, since the goal was to populate the *new-RFQ-against-production-evidence* workflow the prototype actually demos, not three independent requirement trees. Easy to extend if LX/Sport need their own Requirement trace tables populated too.
- Prices are plausible estimates for a realistic automotive turbo-engine BOM, not sourced from any real supplier quote — fine for prototype/demo purposes, not for anything presented as real costing data.
- `generate.py` and `generate_part2.py` (one directory up from this `data/` folder) are the source of truth — re-run them to regenerate deterministically (seeded), or edit them directly to extend the dataset rather than hand-editing the JSON.
