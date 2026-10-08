# Example BOM dataset — Civic-class 1.5T engine, 3 trims

A full example dataset built for Claude Code to seed the prototype's database, delivered as a zip (`civic-engine-dataset.zip`) alongside this note. Not a design brief — a content/data deliverable. Full field-level schema lives in the zip's `data/README.md`; this note captures the design decisions so they don't need to be reverse-engineered later.

## What it is

A Honda-Civic-style turbocharged 1.5L inline-4 engine, modeled as 3 trims:

- **Civic LX 1.5T** — in production, baseline single-scroll turbo (surrogate source).
- **Civic Sport 1.5T** — in production, larger single-scroll turbo + electronic wastegate (surrogate source).
- **Civic Si 1.5T** — the active RFQ (RFQ-26-0512), twin-scroll turbo + forged pistons + larger injectors + air-to-water intercooler. This is the BOM running surrogate search against the other two — matching the app's real workflow (new RFQ searches already-in-production parts), not three unrelated model years.

~78 unique parts across 9 subsystems (Cylinder Block & Bottom End, Cylinder Head & Valvetrain, Turbocharger System, Intake & Charge Air, Fuel System, Exhaust System, Cooling System, Electrical & Sensors, Accessory Drive), 166 BOM lines total (55/55/56 across the three programs), 16 requirements, 15 tests, 25 test runs, 10 carryover event chains, and 5 representative cost-model-routing records.

## Why it's built this way — deliberate coverage, not random data

- **~41 parts are literal duplicates across all three trims** (block, head, cooling, most electrical) — same part_id reused verbatim, `certainty: Actual`, `provenance: Carryover — geometric duplicate`. Matches the live prototype's already-built duplicate case exactly.
- **6 parts are shared LX+Sport only, with a distinct Si replacement** (forged piston, bigger injector, bigger MAP sensor, etc.) — each a clean, plausible surrogate match.
- **8 part families vary across all three trims** (turbine wheel, compressor wheel, CHRA, turbine/compressor housing, wastegate actuator, intercooler, charge pipes) — each carries a full 5-metric surrogate breakdown (Geometry/Manufacture complexity/Material/Supplier-location/Order of magnitude), matching the `SIMILAR-TO` card.
- **One part has no surrogate at all** (`ELEC-925-C`, a new EGT sensor — `certainty: No match`) and **one is a weak surrogate routed to Estimated** (`INT-510-C`, air-to-water intercooler vs. air-to-air, 55%) — the full certainty spectrum is represented except `Search failed`, which is flagged as a transient system state rather than a sourcing conclusion, not something to fake a record for.
- **3 requirements are deliberately "dangerous cases"** (`REC-20001`, `REC-20007`, `REC-20016`: Text=Unchanged, Driven-by=Changed) — the exact pattern flagged as needing a selection-independent highlight in `requirement-trace-table-cleanup.md` and the consolidated design brief (2c).
- **Severity and owner are populated on every requirement** — this dataset doesn't wait on the still-open severity-scale decision (brief 2f) to be useful; it ships a placeholder Critical/High/Medium/Low scale now.
- **6 requirements have open/flagged test runs** (Scheduled or In progress rather than Carried/Pass), giving Carryover review a realistic, varied flagged list with a spread of severity and owners.

## Where it lives in this handoff

`data/` — the JSON entity files (`programs.json`, `suppliers.json`, `parts.json`, `bom_lines.json`, `requirements.json`, `tests.json`, `requirement_test_links.json`, `test_runs.json`, `carryover_events.json`, `cost_estimates.json`), a `README.md` with the full field-level schema and foreign-key notes, and the generator scripts (`generate.py`, `generate_part2.py`, deterministic/seeded — edit and re-run these to extend the dataset rather than hand-editing JSON) plus `validate.py` (referential-integrity check, all passing as of this handoff).
