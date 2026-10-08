#!/usr/bin/env python3
"""Referential-integrity check across all generated data files."""
import json, os, sys

OUT = os.path.join(os.path.dirname(__file__), "data")

def load(name):
    with open(os.path.join(OUT, name)) as f:
        return json.load(f)

programs = load("programs.json")
suppliers = load("suppliers.json")
parts = load("parts.json")
bom_lines = load("bom_lines.json")
requirements = load("requirements.json")
tests = load("tests.json")
req_test_links = load("requirement_test_links.json")
test_runs = load("test_runs.json")
carryover_events = load("carryover_events.json")
cost_estimates = load("cost_estimates.json")

program_ids = {p["program_id"] for p in programs}
supplier_ids = {s["supplier_id"] for s in suppliers}
part_ids = {p["part_id"] for p in parts}
req_ids = {r["req_id"] for r in requirements}
test_ids = {t["test_id"] for t in tests}

errors = []

for l in bom_lines:
    if l["program_id"] not in program_ids: errors.append(f"bom_line {l['bom_line_id']}: bad program_id {l['program_id']}")
    if l["part_id"] not in part_ids: errors.append(f"bom_line {l['bom_line_id']}: bad part_id {l['part_id']}")
    if l["supplier_id"] not in supplier_ids: errors.append(f"bom_line {l['bom_line_id']}: bad supplier_id {l['supplier_id']}")
    for c in l.get("other_candidates") or []:
        if c["part_id"] not in part_ids: errors.append(f"bom_line {l['bom_line_id']}: bad candidate part_id {c['part_id']}")
        if c["program_id"] not in program_ids: errors.append(f"bom_line {l['bom_line_id']}: bad candidate program_id {c['program_id']}")

for r in requirements:
    if r["linked_part_id"] not in part_ids: errors.append(f"requirement {r['req_id']}: bad linked_part_id {r['linked_part_id']}")

for t in tests:
    for rid in t["req_ids"]:
        if rid not in req_ids: errors.append(f"test {t['test_id']}: bad req_id {rid}")

for link in req_test_links:
    if link["req_id"] not in req_ids: errors.append(f"req_test_link: bad req_id {link['req_id']}")
    if link["test_id"] not in test_ids: errors.append(f"req_test_link: bad test_id {link['test_id']}")

linked_req_ids = {l["req_id"] for l in req_test_links}
missing_links = req_ids - linked_req_ids
if missing_links: errors.append(f"requirements with no test link: {missing_links}")

for run in test_runs:
    if run["test_id"] not in test_ids: errors.append(f"test_run {run['run_id']}: bad test_id {run['test_id']}")
    if run["program_id"] not in program_ids: errors.append(f"test_run {run['run_id']}: bad program_id {run['program_id']}")

for ce in carryover_events:
    if ce["req_id"] not in req_ids: errors.append(f"carryover_events: bad req_id {ce['req_id']}")
    for ev in ce["events"]:
        if ev["program_id"] not in program_ids: errors.append(f"carryover_events[{ce['req_id']}]: bad program_id {ev['program_id']}")

for ce_ in cost_estimates:
    if ce_["part_id"] not in part_ids: errors.append(f"cost_estimate: bad part_id {ce_['part_id']}")
    if ce_["program_id"] not in program_ids: errors.append(f"cost_estimate: bad program_id {ce_['program_id']}")

# Cross-check: every part referenced by a BOM line in a given program should
# actually belong to that program's expected set size (sanity, not strict).
lines_by_program = {}
for l in bom_lines:
    lines_by_program.setdefault(l["program_id"], []).append(l)
for pid, lines in lines_by_program.items():
    part_set = [l["part_id"] for l in lines]
    dupes = set(x for x in part_set if part_set.count(x) > 1)
    if dupes: errors.append(f"program {pid}: duplicate part_id(s) in BOM: {dupes}")

print("Programs:", len(programs))
print("Suppliers:", len(suppliers))
print("Parts:", len(parts))
print("BOM lines:", len(bom_lines), {pid: len(v) for pid, v in lines_by_program.items()})
print("Requirements:", len(requirements))
print("Tests:", len(tests))
print("Requirement-test links:", len(req_test_links))
print("Test runs:", len(test_runs))
print("Carryover event chains:", len(carryover_events))
print("Cost estimates:", len(cost_estimates))

certainty_counts = {}
for l in bom_lines:
    certainty_counts[l["certainty"]] = certainty_counts.get(l["certainty"], 0) + 1
print("Certainty tier distribution:", certainty_counts)

dangerous = [r["req_id"] for r in requirements if r["dangerous_case"]]
print("Dangerous-case requirements (Text=Unchanged, Driven-by=Changed):", dangerous)

if errors:
    print("\nERRORS FOUND:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
else:
    print("\nAll referential integrity checks passed.")
