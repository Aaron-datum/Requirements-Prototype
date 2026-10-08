#!/usr/bin/env python3
"""
Part 2: requirements, tests, test runs, requirement-test links, carryover
event chains, and a handful of cost-model-routing records for Si BOM lines.
Run after generate.py (shares the same data/ output directory and part/program
ids, but does not import generate.py directly — ids are repeated literally so
this file can be read and audited on its own).
"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), "data")

def write(name, obj):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)
    print("wrote", path, "-", len(obj) if isinstance(obj, list) else 1, "records")

LX, SPT, SI = "PGM-CIV-LX", "PGM-CIV-SPT", "PGM-CIV-SI"

# ---------------------------------------------------------------------------
# REQUIREMENTS
# ---------------------------------------------------------------------------
requirements = [
    {
        "req_id": "REC-20001", "title": "Turbine burst/overspeed containment",
        "subsystem": "Turbocharger System", "linked_part_id": "TC-404-C",
        "source_type": "OEM Spec", "citation": "SOR-CIV-15 §4.2.1 / ES-CIV-0150 §3.3",
        "requirement_text": "Turbine housing shall contain wheel fragments at 120% of maximum design speed without housing rupture, per OEM burst-containment standard.",
        "text_status": "Unchanged", "driven_by_status": "Changed", "driven_by_confidence": None,
        "dangerous_case": True, "severity": "Critical", "owner": "M. Okafor (Validation Engineer)",
        "notes": "Boilerplate OEM clause reads identical to LX/Sport, but the twin-scroll turbine/housing geometry behind it is new — nothing here flags that the physical burst energy at containment speed has changed.",
    },
    {
        "req_id": "REC-20002", "title": "Wastegate actuator response time",
        "subsystem": "Turbocharger System", "linked_part_id": "TC-406-C",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §5.1",
        "requirement_text": "Electronic wastegate actuator shall achieve full stroke within 180 ms at operating temperature across -30C to 150C.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 95,
        "dangerous_case": False, "severity": "High", "owner": "D. Patel (Powertrain Systems)",
        "notes": None,
    },
    {
        "req_id": "REC-20003", "title": "Turbo bearing system thermal cycling durability",
        "subsystem": "Turbocharger System", "linked_part_id": "TC-403-C",
        "source_type": "Carryover", "citation": "SOR-CIV-15 §4.2.4",
        "requirement_text": "Center housing bearing system shall withstand 50,000 thermal cycles (-30C to 250C) without measurable bearing clearance growth beyond 0.05mm.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 93,
        "dangerous_case": False, "severity": "High", "owner": "M. Okafor (Validation Engineer)",
        "notes": None,
    },
    {
        "req_id": "REC-20004", "title": "Compressor surge margin",
        "subsystem": "Turbocharger System", "linked_part_id": "TC-402-C",
        "source_type": "RFQ", "citation": "ES-CIV-0150 §5.4",
        "requirement_text": "Compressor map shall maintain a minimum 15% surge margin across the full engine operating range at rated boost (tightened from 12% on LX/Sport).",
        "text_status": "Changed", "driven_by_status": "Changed", "driven_by_confidence": 87,
        "dangerous_case": False, "severity": "Medium", "owner": "D. Patel (Powertrain Systems)",
        "notes": None,
    },
    {
        "req_id": "REC-20005", "title": "Boost pressure sensor accuracy",
        "subsystem": "Electrical & Sensors", "linked_part_id": "ELEC-920-C",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §6.2",
        "requirement_text": "MAP/boost sensor shall read within +/-1.5% of actual pressure across the full 0-2.5 bar(a) range.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 92,
        "dangerous_case": False, "severity": "Medium", "owner": "D. Patel (Powertrain Systems)",
        "notes": None,
    },
    {
        "req_id": "REC-20006", "title": "Charge-air cooling effectiveness",
        "subsystem": "Intake & Charge Air", "linked_part_id": "INT-510-C",
        "source_type": "RFQ", "citation": "SOR-CIV-15 §4.3.2",
        "requirement_text": "Charge air cooling system shall limit compressor-outlet-to-intake-manifold temperature rise to no more than 15C above ambient at sustained high load.",
        "text_status": "New", "driven_by_status": "New", "driven_by_confidence": None,
        "dangerous_case": False, "severity": "High", "owner": "M. Okafor (Validation Engineer)",
        "notes": "New clause written specifically for the air-to-water architecture; no equivalent existed for LX/Sport's air-to-air system.",
    },
    {
        "req_id": "REC-20007", "title": "Charge pipe burst pressure",
        "subsystem": "Intake & Charge Air", "linked_part_id": "INT-515-C",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §6.5",
        "requirement_text": "Charge air piping shall withstand 4.5 bar(g) internal pressure without rupture or joint separation.",
        "text_status": "Unchanged", "driven_by_status": "Changed", "driven_by_confidence": 82,
        "dangerous_case": True, "severity": "Medium", "owner": "D. Patel (Powertrain Systems)",
        "notes": "Same clause as LX/Sport, but the larger-bore water-cooled routing is a different part with a different joint layout — easy to assume it's already covered.",
    },
    {
        "req_id": "REC-20008", "title": "Exhaust manifold thermal fatigue life",
        "subsystem": "Exhaust System", "linked_part_id": "EXH-710-C",
        "source_type": "RFQ", "citation": "SOR-CIV-15 §4.4.1",
        "requirement_text": "Exhaust manifold/downpipe shall survive 1,500 thermal cycles to 950C peak gas temperature without crack propagation exceeding 2mm (cycle count raised for the twin-scroll casting).",
        "text_status": "Changed", "driven_by_status": "Changed", "driven_by_confidence": 58,
        "dangerous_case": False, "severity": "Critical", "owner": "M. Okafor (Validation Engineer)",
        "notes": "Lowest surrogate confidence in the turbo-adjacent set (58%) paired with Critical severity — highest-priority open item regardless of the dangerous-case flag.",
    },
    {
        "req_id": "REC-20009", "title": "Fuel injector flow linearity",
        "subsystem": "Fuel System", "linked_part_id": "FUEL-615-C",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §7.1",
        "requirement_text": "Fuel injector shall maintain flow linearity within +/-3% across the 0.3-3.0 ms pulse-width range at 350 bar rail pressure.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 93,
        "dangerous_case": False, "severity": "Medium", "owner": "D. Patel (Powertrain Systems)",
        "notes": None,
    },
    {
        "req_id": "REC-20010", "title": "Piston thermal/mechanical durability",
        "subsystem": "Cylinder Block & Bottom End", "linked_part_id": "BLK-121",
        "source_type": "RFQ", "citation": "SOR-CIV-15 §4.1.3",
        "requirement_text": "Piston shall withstand peak cylinder pressure of 130 bar and crown temperatures up to 380C for the full validation duty cycle without crown cracking or ring-land failure (pressure limit raised for the forged piston).",
        "text_status": "Changed", "driven_by_status": "Changed", "driven_by_confidence": 75,
        "dangerous_case": False, "severity": "Critical", "owner": "M. Okafor (Validation Engineer)",
        "notes": None,
    },
    {
        "req_id": "REC-20011", "title": "Wastegate valve seat leakage rate",
        "subsystem": "Turbocharger System", "linked_part_id": "TC-407-A",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §5.2",
        "requirement_text": "Wastegate valve seat shall leak no more than 1.5% of rated exhaust mass flow in the fully closed position after 500 actuation cycles.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 100,
        "dangerous_case": False, "severity": "Medium", "owner": "D. Patel (Powertrain Systems)",
        "notes": "Geometric duplicate part (same PN as LX/Sport) — carried with full confidence, no re-test required.",
    },
    {
        "req_id": "REC-20012", "title": "Blow-off valve response & sealing",
        "subsystem": "Turbocharger System", "linked_part_id": "TC-408-C",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §5.3",
        "requirement_text": "Blow-off/diverter valve shall fully reseat within 50 ms of throttle closure with zero measurable boost leak at idle.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 95,
        "dangerous_case": False, "severity": "Low", "owner": "D. Patel (Powertrain Systems)",
        "notes": None,
    },
    {
        "req_id": "REC-20013", "title": "Turbine inlet EGT sensor accuracy & survivability",
        "subsystem": "Electrical & Sensors", "linked_part_id": "ELEC-925-C",
        "source_type": "RFQ", "citation": "SOR-CIV-15 §4.2.6 (new clause)",
        "requirement_text": "Turbine inlet EGT sensor shall read within +/-15C across 400-980C and survive continuous exposure at 1000C for the full engine service life.",
        "text_status": "New", "driven_by_status": "New", "driven_by_confidence": None,
        "dangerous_case": False, "severity": "High", "owner": "M. Okafor (Validation Engineer)",
        "notes": "No equivalent sensor or requirement exists on LX or Sport — first use of EGT monitoring on this engine family.",
    },
    {
        "req_id": "REC-20014", "title": "Turbo oil feed line pressure/flow rating",
        "subsystem": "Turbocharger System", "linked_part_id": "TC-310",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §5.6",
        "requirement_text": "Turbo oil feed line shall sustain 6 bar supply pressure and deliver minimum 3.5 L/min to the center housing at idle oil temperature.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 100,
        "dangerous_case": False, "severity": "Medium", "owner": "D. Patel (Powertrain Systems)",
        "notes": "Geometric duplicate — same feed line used on all three trims.",
    },
    {
        "req_id": "REC-20015", "title": "Crankshaft torsional vibration / fatigue life",
        "subsystem": "Cylinder Block & Bottom End", "linked_part_id": "BLK-110",
        "source_type": "Carryover", "citation": "SOR-CIV-15 §4.1.1",
        "requirement_text": "Crankshaft shall demonstrate infinite fatigue life under the full torsional vibration spectrum at rated power, with no detectable crack initiation after 1e8 cycles.",
        "text_status": "Unchanged", "driven_by_status": "Unchanged", "driven_by_confidence": 100,
        "dangerous_case": False, "severity": "Critical", "owner": "M. Okafor (Validation Engineer)",
        "notes": "Geometric duplicate — unaffected by the turbo change. Included to show a Critical-severity item that is genuinely low-risk this cycle, a useful contrast to REC-20001/20008.",
    },
    {
        "req_id": "REC-20016", "title": "Ignition coil dwell/energy at elevated boost",
        "subsystem": "Electrical & Sensors", "linked_part_id": "ELEC-910",
        "source_type": "Carryover", "citation": "ES-CIV-0150 §7.4",
        "requirement_text": "Ignition coil shall deliver sufficient spark energy to maintain reliable combustion at in-cylinder pressures corresponding to 2.5 bar(a) boost without misfire.",
        "text_status": "Unchanged", "driven_by_status": "Changed", "driven_by_confidence": 78,
        "dangerous_case": True, "severity": "High", "owner": "D. Patel (Powertrain Systems)",
        "notes": "Same physical coil as LX/Sport (hardware unchanged), but the duty cycle shifted enough at Si's higher boost target that the original validation doesn't automatically cover it.",
    },
]
write("requirements.json", requirements)

# ---------------------------------------------------------------------------
# TESTS
# ---------------------------------------------------------------------------
tests = [
    {"test_id": "DV-TC-210", "name": "Turbine burst/overspeed containment test", "standard": "SAE J1826-mod",
     "lab": "Horizon Powertrain Test Labs", "procedure": "Spin turbine wheel to 120% of max design speed in a calibrated burst-containment rig; inspect housing for rupture or fragment penetration.",
     "req_ids": ["REC-20001"]},
    {"test_id": "DV-TC-211", "name": "Actuator response time bench test", "standard": "ES-CIV-0150 Annex B",
     "lab": "Horizon Powertrain Test Labs", "procedure": "Command full-stroke actuation across the -30C to 150C range on a thermal bench rig; measure stroke time with a linear position sensor.",
     "req_ids": ["REC-20002", "REC-20012"]},
    {"test_id": "DV-TC-212", "name": "CHRA thermal cycling durability test", "standard": "SOR-CIV-15 Annex D",
     "lab": "Horizon Powertrain Test Labs", "procedure": "Cycle center housing between -30C and 250C for 50,000 cycles; measure bearing clearance growth via CMM before/after.",
     "req_ids": ["REC-20003"]},
    {"test_id": "DV-TC-213", "name": "Compressor map / surge margin dyno test", "standard": "ES-CIV-0150 Annex C",
     "lab": "Datum Powertrain Dyno Cell 2", "procedure": "Sweep compressor operating points across the full engine map on an engine dynamometer; record surge margin at each rated-boost point.",
     "req_ids": ["REC-20004"]},
    {"test_id": "DV-TC-214", "name": "Boost sensor accuracy calibration test", "standard": "ES-CIV-0150 Annex A",
     "lab": "Datum Sensor Cal Lab", "procedure": "Compare sensor output to a calibrated reference pressure source across 0-2.5 bar(a) at 5 setpoints, 3 temperature conditions.",
     "req_ids": ["REC-20005"]},
    {"test_id": "DV-TC-215", "name": "Charge air cooling effectiveness dyno test", "standard": "SOR-CIV-15 Annex E",
     "lab": "Datum Powertrain Dyno Cell 1", "procedure": "Run sustained high-load dyno cycle; measure compressor-outlet and intake-manifold temperatures continuously, compute delta-T above ambient.",
     "req_ids": ["REC-20006"]},
    {"test_id": "DV-TC-216", "name": "Charge pipe burst pressure test", "standard": "ES-CIV-0150 Annex F",
     "lab": "Horizon Powertrain Test Labs", "procedure": "Pressurize charge piping assembly to 4.5 bar(g) and beyond in a hydrostatic rig; monitor for rupture or joint separation.",
     "req_ids": ["REC-20007"]},
    {"test_id": "DV-TC-217", "name": "Exhaust manifold thermal fatigue cycling test", "standard": "SOR-CIV-15 Annex G",
     "lab": "Horizon Powertrain Test Labs", "procedure": "Cycle manifold/downpipe assembly to 950C peak gas temperature for 1,500 cycles; inspect for crack propagation via dye penetrant.",
     "req_ids": ["REC-20008"]},
    {"test_id": "DV-TC-218", "name": "Fuel injector flow bench test", "standard": "ES-CIV-0150 Annex H",
     "lab": "Datum Fuel Systems Lab", "procedure": "Measure injected fuel mass across the 0.3-3.0 ms pulse-width range at 350 bar rail pressure on a calibrated flow bench.",
     "req_ids": ["REC-20009"]},
    {"test_id": "DV-TC-219", "name": "Piston thermal/mechanical durability engine test", "standard": "SOR-CIV-15 Annex B",
     "lab": "Datum Powertrain Dyno Cell 1", "procedure": "Run full validation duty cycle at 130 bar peak cylinder pressure; inspect piston crowns and ring lands via borescope and teardown.",
     "req_ids": ["REC-20010"]},
    {"test_id": "DV-TC-220", "name": "Wastegate valve seat leakage test", "standard": "ES-CIV-0150 Annex I",
     "lab": "Horizon Powertrain Test Labs", "procedure": "Actuate valve 500 cycles, then measure closed-position leakage as a percentage of rated exhaust mass flow.",
     "req_ids": ["REC-20011"]},
    {"test_id": "DV-TC-222", "name": "EGT sensor accuracy & survivability test", "standard": "SOR-CIV-15 Annex J (new)",
     "lab": "Datum Sensor Cal Lab", "procedure": "Calibrate sensor reading against reference thermocouple across 400-980C, then hold at continuous 1000C exposure for accelerated service-life equivalence.",
     "req_ids": ["REC-20013"]},
    {"test_id": "DV-TC-223", "name": "Oil feed line pressure/flow test", "standard": "ES-CIV-0150 Annex K",
     "lab": "Horizon Powertrain Test Labs", "procedure": "Pressurize feed line to 6 bar and measure delivered flow rate to a simulated center-housing fixture at idle oil temperature.",
     "req_ids": ["REC-20014"]},
    {"test_id": "DV-TC-224", "name": "Crankshaft torsional vibration fatigue test", "standard": "SOR-CIV-15 Annex A",
     "lab": "Datum Powertrain Dyno Cell 2", "procedure": "Apply the full torsional vibration spectrum at rated power on an instrumented dynamometer; monitor for crack initiation via strain gauge and periodic NDT.",
     "req_ids": ["REC-20015"]},
    {"test_id": "DV-TC-225", "name": "Ignition coil dwell/energy validation", "standard": "ES-CIV-0150 Annex L",
     "lab": "Datum Powertrain Dyno Cell 1", "procedure": "Run coil at commanded dwell/energy settings under in-cylinder pressures equivalent to 2.5 bar(a) boost; monitor for misfire via in-cylinder pressure trace.",
     "req_ids": ["REC-20016"]},
]
write("tests.json", tests)

# ---------------------------------------------------------------------------
# REQUIREMENT <-> TEST LINKS (candidate confidence + why-matched reasoning)
# ---------------------------------------------------------------------------
requirement_test_links = [
    {"req_id": "REC-20001", "test_id": "DV-TC-210", "match_confidence": None, "why_matched": ["RFQ", "Internal"], "reasoning": "Only test in the library that exercises burst-containment at overspeed; no confidence score shown because the driving geometry is new."},
    {"req_id": "REC-20002", "test_id": "DV-TC-211", "match_confidence": 95, "why_matched": ["Carryover", "PLM"], "reasoning": "Same actuator family and test rig used on Sport; high confidence carryover."},
    {"req_id": "REC-20003", "test_id": "DV-TC-212", "match_confidence": 93, "why_matched": ["Carryover", "PLM"], "reasoning": "Bearing architecture unchanged from Sport's ball-bearing CHRA; same thermal-cycle profile applies."},
    {"req_id": "REC-20004", "test_id": "DV-TC-213", "match_confidence": 87, "why_matched": ["RFQ", "CAD features"], "reasoning": "Compressor wheel geometry is a scaled variant of Sport's; map data close enough to anchor the test plan, re-run required due to tightened margin."},
    {"req_id": "REC-20005", "test_id": "DV-TC-214", "match_confidence": 92, "why_matched": ["Carryover", "Supplier"], "reasoning": "Same sensor family and supplier (Denso) as LX/Sport, wider pressure range only."},
    {"req_id": "REC-20006", "test_id": "DV-TC-215", "match_confidence": None, "why_matched": ["RFQ"], "reasoning": "New test written specifically for the air-to-water intercooler; no prior air-to-water test exists on this program."},
    {"req_id": "REC-20007", "test_id": "DV-TC-216", "match_confidence": 82, "why_matched": ["Carryover", "CAD features"], "reasoning": "Same burst-pressure procedure as LX/Sport's charge pipe test; geometry and joint count differ enough to lower confidence below the duplicate threshold."},
    {"req_id": "REC-20008", "test_id": "DV-TC-217", "match_confidence": 58, "why_matched": ["RFQ", "CAD features"], "reasoning": "Twin-scroll casting changes the flange and runner geometry enough that the LX/Sport thermal-fatigue result is only a rough anchor, not a direct carryover."},
    {"req_id": "REC-20009", "test_id": "DV-TC-218", "match_confidence": 93, "why_matched": ["Carryover", "Supplier"], "reasoning": "Same injector platform and supplier (Denso), larger flow rating only."},
    {"req_id": "REC-20010", "test_id": "DV-TC-219", "match_confidence": 75, "why_matched": ["RFQ", "CAD features"], "reasoning": "Forged piston shares the hypereutectic piston's bore/stroke geometry but a different manufacture process and material, lowering confidence from a true carryover."},
    {"req_id": "REC-20011", "test_id": "DV-TC-220", "match_confidence": 100, "why_matched": ["Carryover", "PLM"], "reasoning": "Identical part (same PN) as LX/Sport — direct carryover, no re-test required."},
    {"req_id": "REC-20012", "test_id": "DV-TC-211", "match_confidence": 95, "why_matched": ["Carryover", "Supplier"], "reasoning": "Shares the actuation-response rig and supplier family with REC-20002; cross-referenced from the same test."},
    {"req_id": "REC-20013", "test_id": "DV-TC-222", "match_confidence": None, "why_matched": ["RFQ"], "reasoning": "First-ever EGT sensor on this engine family — new test written against the new requirement, nothing to match against."},
    {"req_id": "REC-20014", "test_id": "DV-TC-223", "match_confidence": 100, "why_matched": ["Carryover", "PLM"], "reasoning": "Identical part across all three trims — direct carryover."},
    {"req_id": "REC-20015", "test_id": "DV-TC-224", "match_confidence": 100, "why_matched": ["Carryover", "PLM"], "reasoning": "Identical part, unaffected by the turbo change — direct carryover."},
    {"req_id": "REC-20016", "test_id": "DV-TC-225", "match_confidence": 78, "why_matched": ["Carryover", "CAD features"], "reasoning": "Same physical coil as LX/Sport; re-validation driven by the higher in-cylinder pressure duty cycle, not a hardware change."},
]
write("requirement_test_links.json", requirement_test_links)

# ---------------------------------------------------------------------------
# TEST RUNS (run history across programs)
# ---------------------------------------------------------------------------
test_runs = [
    {"run_id": "TR-24-0031", "test_id": "DV-TC-210", "program_id": LX, "date": "2024-02-14", "result": "Pass", "samples": 6, "notes": "Baseline single-scroll turbine, established containment margin at 2.3x design energy."},
    {"run_id": "TR-26-0118", "test_id": "DV-TC-210", "program_id": SI, "date": None, "result": "Scheduled", "samples": None, "notes": "Twin-scroll turbine/housing burst test — booked at Horizon Test Labs, awaiting rig availability."},

    {"run_id": "TR-24-0045", "test_id": "DV-TC-211", "program_id": LX, "date": "2024-03-02", "result": "Pass", "samples": 8, "notes": "Pneumatic actuator baseline."},
    {"run_id": "TR-25-0019", "test_id": "DV-TC-211", "program_id": SPT, "date": "2025-01-20", "result": "Pass", "samples": 8, "notes": "Electronic actuator, carried design — re-run for the new actuator type, full pass."},
    {"run_id": "TR-26-0071", "test_id": "DV-TC-211", "program_id": SI, "date": "2025-01-20", "result": "Carried", "samples": None, "notes": "Carried from Sport's TR-25-0019 — same actuator family, no hardware change."},

    {"run_id": "TR-24-0052", "test_id": "DV-TC-212", "program_id": LX, "date": "2024-03-18", "result": "Pass", "samples": 4, "notes": "Journal-bearing CHRA baseline."},
    {"run_id": "TR-25-0024", "test_id": "DV-TC-212", "program_id": SPT, "date": "2025-02-05", "result": "Pass", "samples": 4, "notes": "Ball-bearing CHRA, full 50,000-cycle run completed."},
    {"run_id": "TR-26-0072", "test_id": "DV-TC-212", "program_id": SI, "date": "2025-02-05", "result": "Carried", "samples": None, "notes": "Carried from Sport's TR-25-0024 — same bearing architecture."},

    {"run_id": "TR-26-0119", "test_id": "DV-TC-213", "program_id": SI, "date": "2026-03-11", "result": "Pass", "samples": 3, "notes": "Dyno sweep at rated boost confirmed 16.2% surge margin, above the 15% requirement."},

    {"run_id": "TR-24-0061", "test_id": "DV-TC-214", "program_id": LX, "date": "2024-04-02", "result": "Pass", "samples": 10, "notes": "2.0 bar range sensor, calibration confirmed within spec."},
    {"run_id": "TR-26-0073", "test_id": "DV-TC-214", "program_id": SI, "date": "2024-04-02", "result": "Carried", "samples": None, "notes": "Carried from LX's TR-24-0061 — same supplier family, Si's wider range covered by the sensor's own datasheet tolerance."},

    {"run_id": "TR-26-0120", "test_id": "DV-TC-215", "program_id": SI, "date": None, "result": "In progress", "samples": None, "notes": "Dyno cell instrumented for the air-to-water loop; sustained high-load run underway."},

    {"run_id": "TR-26-0121", "test_id": "DV-TC-216", "program_id": SI, "date": None, "result": "Scheduled", "samples": None, "notes": "Hydrostatic rig booked for the new water-cooled charge pipe routing."},

    {"run_id": "TR-26-0122", "test_id": "DV-TC-217", "program_id": SI, "date": None, "result": "Scheduled", "samples": None, "notes": "Highest-priority open item — Critical severity, lowest surrogate confidence (58%) of the turbo-adjacent set."},

    {"run_id": "TR-24-0077", "test_id": "DV-TC-218", "program_id": LX, "date": "2024-05-09", "result": "Pass", "samples": 12, "notes": "350cc injector baseline."},
    {"run_id": "TR-26-0074", "test_id": "DV-TC-218", "program_id": SI, "date": "2024-05-09", "result": "Carried", "samples": None, "notes": "Carried from LX's TR-24-0077 — same injector platform, larger flow rating within the supplier's validated family."},

    {"run_id": "TR-26-0123", "test_id": "DV-TC-219", "program_id": SI, "date": "2026-02-20", "result": "Pass", "samples": 4, "notes": "Forged piston teardown after full duty cycle — no crown cracking, ring lands within spec."},

    {"run_id": "TR-24-0083", "test_id": "DV-TC-220", "program_id": LX, "date": "2024-05-22", "result": "Pass", "samples": 6, "notes": "Valve seat baseline."},
    {"run_id": "TR-26-0075", "test_id": "DV-TC-220", "program_id": SI, "date": "2024-05-22", "result": "Carried", "samples": None, "notes": "Carried from LX's TR-24-0083 — identical part, no re-test required."},

    {"run_id": "TR-26-0124", "test_id": "DV-TC-222", "program_id": SI, "date": None, "result": "In progress", "samples": None, "notes": "First EGT sensor validation on this engine family — calibration phase underway, 1000C soak scheduled next."},

    {"run_id": "TR-24-0088", "test_id": "DV-TC-223", "program_id": LX, "date": "2024-06-02", "result": "Pass", "samples": 4, "notes": "Oil feed line baseline."},
    {"run_id": "TR-26-0076", "test_id": "DV-TC-223", "program_id": SI, "date": "2024-06-02", "result": "Carried", "samples": None, "notes": "Carried from LX's TR-24-0088 — identical part across all three trims."},

    {"run_id": "TR-24-0091", "test_id": "DV-TC-224", "program_id": LX, "date": "2024-06-14", "result": "Pass", "samples": 2, "notes": "Crankshaft baseline — no crack initiation after 1e8 cycles."},
    {"run_id": "TR-26-0077", "test_id": "DV-TC-224", "program_id": SI, "date": "2024-06-14", "result": "Carried", "samples": None, "notes": "Carried from LX's TR-24-0091 — unaffected by the turbo change."},

    {"run_id": "TR-26-0125", "test_id": "DV-TC-225", "program_id": SI, "date": None, "result": "Scheduled", "samples": None, "notes": "Recalibration validation at Si's higher boost target — not yet run; same coil hardware as LX/Sport."},
]
write("test_runs.json", test_runs)

# ---------------------------------------------------------------------------
# CARRYOVER EVENTS (chronological chain per requirement)
# ---------------------------------------------------------------------------
carryover_events = [
    # REC-20001 — new geometry, flagged
    {"req_id": "REC-20001", "events": [
        {"date": "2024-01-10", "event": "Raised", "program_id": LX, "note": "Burst-containment clause established for LX program."},
        {"date": "2024-02-14", "event": "Test run", "program_id": LX, "note": "TR-24-0031 — Pass, single-scroll turbine."},
        {"date": "2025-11-02", "event": "Interface changed", "program_id": SI, "note": "Twin-scroll turbine/housing introduced — prior burst-containment evidence no longer applies directly."},
        {"date": "2026-01-15", "event": "Flagged for review", "program_id": SI, "note": "Owner (M. Okafor) flagged for fresh burst test; no confidence score available."},
    ]},
    # REC-20002
    {"req_id": "REC-20002", "events": [
        {"date": "2024-01-10", "event": "Raised", "program_id": LX, "note": "Response-time clause established for LX program."},
        {"date": "2024-03-02", "event": "Test run", "program_id": LX, "note": "TR-24-0045 — Pass, pneumatic actuator."},
        {"date": "2024-11-20", "event": "Interface changed", "program_id": SPT, "note": "Switched to electronic wastegate actuator for Sport."},
        {"date": "2025-01-20", "event": "Test run", "program_id": SPT, "note": "TR-25-0019 — Pass, electronic actuator."},
        {"date": "2025-11-02", "event": "Carried", "program_id": SI, "note": "Carried from Sport at 95% confidence — same actuator family."},
    ]},
    # REC-20007 — flagged
    {"req_id": "REC-20007", "events": [
        {"date": "2024-01-12", "event": "Raised", "program_id": LX, "note": "Burst-pressure clause established for LX program."},
        {"date": "2024-04-20", "event": "Test run", "program_id": LX, "note": "Charge pipe burst test — Pass."},
        {"date": "2025-11-10", "event": "Interface changed", "program_id": SI, "note": "Larger-bore, water-cooled charge pipe routing introduced for Si."},
        {"date": "2026-01-15", "event": "Flagged for review", "program_id": SI, "note": "82% surrogate confidence — below the duplicate threshold; re-test booked."},
    ]},
    # REC-20008 — flagged, critical
    {"req_id": "REC-20008", "events": [
        {"date": "2024-01-12", "event": "Raised", "program_id": LX, "note": "Thermal fatigue clause established for LX program, single-scroll flange."},
        {"date": "2024-05-30", "event": "Test run", "program_id": LX, "note": "Exhaust manifold thermal fatigue test — Pass, 1,000-cycle target."},
        {"date": "2025-10-28", "event": "Interface changed", "program_id": SI, "note": "Twin-scroll flange introduced; OEM also raised the cycle-count requirement to 1,500."},
        {"date": "2026-01-15", "event": "Flagged for review", "program_id": SI, "note": "Critical severity + 58% confidence — highest-priority open item in this cycle."},
    ]},
    # REC-20011 — clean duplicate carry
    {"req_id": "REC-20011", "events": [
        {"date": "2024-01-14", "event": "Raised", "program_id": LX, "note": "Leakage-rate clause established for LX program."},
        {"date": "2024-05-22", "event": "Test run", "program_id": LX, "note": "TR-24-0083 — Pass."},
        {"date": "2024-11-20", "event": "Carried", "program_id": SPT, "note": "Same part reused on Sport, no re-test."},
        {"date": "2025-11-02", "event": "Carried", "program_id": SI, "note": "Same part reused on Si (TC-407-A) — geometric duplicate, no re-test."},
    ]},
    # REC-20013 — brand new
    {"req_id": "REC-20013", "events": [
        {"date": "2025-10-15", "event": "Raised", "program_id": SI, "note": "New clause added for the twin-scroll turbine's thermal-protection strategy — no prior equivalent."},
        {"date": "2026-02-01", "event": "Test in progress", "program_id": SI, "note": "TR-26-0124 — calibration phase underway."},
    ]},
    # REC-20016 — flagged, dangerous case
    {"req_id": "REC-20016", "events": [
        {"date": "2024-01-18", "event": "Raised", "program_id": LX, "note": "Spark-energy clause established for LX program."},
        {"date": "2024-06-28", "event": "Test run", "program_id": LX, "note": "Ignition coil validated at LX's boost target — Pass."},
        {"date": "2024-11-20", "event": "Carried", "program_id": SPT, "note": "Same coil, same boost target — carried without re-test."},
        {"date": "2025-11-05", "event": "Interface changed", "program_id": SI, "note": "Boost target raised to 2.5 bar(a) for Si — duty cycle on the coil shifted, even though the coil part itself did not change."},
        {"date": "2026-01-15", "event": "Flagged for review", "program_id": SI, "note": "Owner (D. Patel) flagged — hardware unchanged but operating context changed; re-validation booked, not yet run."},
    ]},
    # REC-20004
    {"req_id": "REC-20004", "events": [
        {"date": "2024-01-20", "event": "Raised", "program_id": LX, "note": "Surge-margin clause established at 12% minimum."},
        {"date": "2025-12-01", "event": "Requirement changed", "program_id": SI, "note": "OEM tightened the minimum surge margin to 15% for the Si program."},
        {"date": "2026-03-11", "event": "Test run", "program_id": SI, "note": "TR-26-0119 — Pass, 16.2% measured margin."},
    ]},
    # REC-20010
    {"req_id": "REC-20010", "events": [
        {"date": "2024-01-22", "event": "Raised", "program_id": LX, "note": "Piston durability clause established, 115 bar peak cylinder pressure."},
        {"date": "2025-12-01", "event": "Requirement changed", "program_id": SI, "note": "Peak cylinder pressure limit raised to 130 bar for the forged-piston Si build."},
        {"date": "2026-02-20", "event": "Test run", "program_id": SI, "note": "TR-26-0123 — Pass, no crown cracking or ring-land failure."},
    ]},
    # REC-20006 — new
    {"req_id": "REC-20006", "events": [
        {"date": "2025-10-20", "event": "Raised", "program_id": SI, "note": "New clause written for the air-to-water intercooler architecture."},
        {"date": "2026-02-10", "event": "Test in progress", "program_id": SI, "note": "TR-26-0120 — sustained high-load dyno run underway."},
    ]},
]
write("carryover_events.json", carryover_events)

# ---------------------------------------------------------------------------
# COST ESTIMATES (cost-model routing for a representative set of Si BOM lines)
# ---------------------------------------------------------------------------
cost_estimates = [
    {
        "part_id": "TC-404-C", "program_id": SI,
        "routing_score": 68, "routing_status": "Suggested - not yet confirmed",
        "suggested_model": "Should-cost: sand casting, Ni-resist iron, twin-scroll",
        "next_best_alternative": "Supplier-quoted analog (TC-404-B, Sport) scaled by casting volume",
        "why_this_model": [
            {"tag": "PLM", "note": "Casting process and material match TC-404-B exactly."},
            {"tag": "CAD features", "note": "Twin-scroll volute adds ~18% casting volume and two additional core pulls vs. single-scroll."},
            {"tag": "Surrogate", "note": "TC-404-B's supplier-quoted price is the primary anchor, scaled for the added complexity."},
        ],
        "input_maturity": {"3d_cad": "Have", "2d_drawing": "Have", "material_spec": "Have"},
        "cost_breakdown": [
            {"line": "Material", "amount_usd": 42.10, "confidence": "Medium"},
            {"line": "Casting & machining", "amount_usd": 98.40, "confidence": "Medium"},
            {"line": "Tooling amortization", "amount_usd": 27.50, "confidence": "Low"},
        ],
    },
    {
        "part_id": "INT-510-C", "program_id": SI,
        "routing_score": 41, "routing_status": "Suggested - not yet confirmed",
        "suggested_model": "Should-cost: brazed aluminum core + cast end tanks, air-to-water",
        "next_best_alternative": "Parametric estimate scaled from INT-510-B (air-to-air) by surface area and dedicated coolant-loop content",
        "why_this_model": [
            {"tag": "RFQ", "note": "Architecture is new to this program; no direct supplier quote on file yet."},
            {"tag": "CAD features", "note": "Cast end tanks and dedicated coolant loop are new content not present on any air-to-air variant."},
            {"tag": "Surrogate", "note": "Core-brazing cost anchored to INT-510-B; end-tank and coolant-loop content estimated separately, lower confidence."},
        ],
        "input_maturity": {"3d_cad": "Have", "2d_drawing": "Via surrogate", "material_spec": "Have"},
        "cost_breakdown": [
            {"line": "Core (brazed aluminum)", "amount_usd": 88.00, "confidence": "Medium"},
            {"line": "Cast end tanks", "amount_usd": 71.00, "confidence": "Low"},
            {"line": "Coolant loop integration", "amount_usd": 56.00, "confidence": "Low"},
        ],
    },
    {
        "part_id": "TC-401-C", "program_id": SI,
        "routing_score": 90, "routing_status": "Suggested - not yet confirmed",
        "suggested_model": "Supplier-quoted analog: BorgWarner twin-scroll family, scaled",
        "next_best_alternative": "Should-cost: investment casting, Inconel 713C",
        "why_this_model": [
            {"tag": "Supplier", "note": "Same supplier (BorgWarner) and casting process as TC-401-B."},
            {"tag": "PLM", "note": "Material identical to TC-401-A/B."},
            {"tag": "Surrogate", "note": "90% geometric/manufacture similarity to TC-401-B supports a direct scaled quote."},
        ],
        "input_maturity": {"3d_cad": "Have", "2d_drawing": "Have", "material_spec": "Have"},
        "cost_breakdown": [
            {"line": "Material", "amount_usd": 61.00, "confidence": "High"},
            {"line": "Investment casting", "amount_usd": 158.00, "confidence": "High"},
            {"line": "Finish machining", "amount_usd": 66.00, "confidence": "Medium"},
        ],
    },
    {
        "part_id": "EXH-710-C", "program_id": SI,
        "routing_score": 52, "routing_status": "Suggested - not yet confirmed",
        "suggested_model": "Should-cost: investment casting, stainless steel, twin-scroll flange",
        "next_best_alternative": "Supplier-quoted analog (EXH-710-A) scaled by flange and runner geometry",
        "why_this_model": [
            {"tag": "CAD features", "note": "Twin-scroll flange requires a materially different runner layout than EXH-710-A's single-scroll flange."},
            {"tag": "RFQ", "note": "No supplier quote yet for the twin-scroll casting; should-cost used as the primary model pending quote."},
        ],
        "input_maturity": {"3d_cad": "Have", "2d_drawing": "Have", "material_spec": "Have"},
        "cost_breakdown": [
            {"line": "Material", "amount_usd": 38.00, "confidence": "Medium"},
            {"line": "Investment casting", "amount_usd": 71.00, "confidence": "Medium"},
            {"line": "Tooling amortization", "amount_usd": 19.00, "confidence": "Low"},
        ],
    },
    {
        "part_id": "ELEC-925-C", "program_id": SI,
        "routing_score": 30, "routing_status": "Suggested - not yet confirmed",
        "suggested_model": "Should-cost: thermocouple sensor assembly, new part",
        "next_best_alternative": "None — no surrogate or supplier quote exists for an EGT sensor on this program",
        "why_this_model": [
            {"tag": "RFQ", "note": "Brand-new part; cost model built from component-level should-cost rather than any surrogate."},
        ],
        "input_maturity": {"3d_cad": "Have", "2d_drawing": "Have", "material_spec": "Via surrogate"},
        "cost_breakdown": [
            {"line": "Thermocouple element", "amount_usd": 18.00, "confidence": "Low"},
            {"line": "Inconel sheath & housing", "amount_usd": 14.00, "confidence": "Low"},
            {"line": "Assembly & calibration", "amount_usd": 9.00, "confidence": "Low"},
        ],
    },
]
write("cost_estimates.json", cost_estimates)

print("\nDone.")
