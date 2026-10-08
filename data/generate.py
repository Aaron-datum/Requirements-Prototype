#!/usr/bin/env python3
"""
Generates a realistic example BOM dataset: a Civic-class 1.5T inline-4 engine
assembly with 3 trims (LX / Sport / Si). Si is the active RFQ being quoted;
LX and Sport are already in production and serve as surrogate/duplicate
evidence sources. Output: normalized JSON files in data/, ready to load into
a small relational database (see data/README.md for the schema).
"""
import json, os, random

random.seed(42)
OUT = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUT, exist_ok=True)

def write(name, obj):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)
    print("wrote", path, "-", len(obj) if isinstance(obj, list) else 1, "records")

# ---------------------------------------------------------------------------
# 1. SUPPLIERS
# ---------------------------------------------------------------------------
suppliers = [
    {"supplier_id": "SUP-001", "name": "BorgWarner Turbo Systems", "region": "US-IN", "category": "Turbocharger"},
    {"supplier_id": "SUP-002", "name": "Garrett Motion",          "region": "FR-Rouen", "category": "Turbocharger"},
    {"supplier_id": "SUP-003", "name": "IHI Turbo America",       "region": "US-NC", "category": "Turbocharger"},
    {"supplier_id": "SUP-004", "name": "Mahle Powertrain",        "region": "DE-Stuttgart", "category": "Castings/Pistons"},
    {"supplier_id": "SUP-005", "name": "Nemak",                   "region": "MX-Monterrey", "category": "Aluminum Castings"},
    {"supplier_id": "SUP-006", "name": "Linamar Corporation",     "region": "CA-Guelph", "category": "Machined Components"},
    {"supplier_id": "SUP-007", "name": "Denso",                   "region": "JP-Aichi", "category": "Fuel/Sensors"},
    {"supplier_id": "SUP-008", "name": "Bosch Powertrain",        "region": "DE-Stuttgart", "category": "Fuel/Sensors/ECU"},
    {"supplier_id": "SUP-009", "name": "NSK Bearings",            "region": "JP-Fukushima", "category": "Bearings"},
    {"supplier_id": "SUP-010", "name": "ContiTech",               "region": "DE-Hannover", "category": "Hoses/Belts"},
    {"supplier_id": "SUP-011", "name": "Dana Incorporated",       "region": "US-OH", "category": "Gaskets/Sealing"},
    {"supplier_id": "SUP-012", "name": "Valeo Powertrain",        "region": "FR-Paris", "category": "Thermal/Cooling"},
    {"supplier_id": "SUP-013", "name": "Martinrea International","region": "CA-Vaughan", "category": "Castings"},
    {"supplier_id": "SUP-014", "name": "Aisin",                   "region": "JP-Kariya", "category": "Drivetrain/Accessory"},
]
write("suppliers.json", suppliers)

# ---------------------------------------------------------------------------
# 2. PROGRAMS (the 3 variants)
# ---------------------------------------------------------------------------
programs = [
    {
        "program_id": "PGM-CIV-LX",
        "name": "Civic LX 1.5T",
        "model_year": 2025,
        "status": "in_production",
        "rfq_id": None,
        "description": "Base trim, single-scroll turbo, 2.0 bar boost target. In production — fully resolved BOM, used as the primary surrogate source for Sport and Si.",
        "owner": "R. Castillo (Program Mgr)",
    },
    {
        "program_id": "PGM-CIV-SPT",
        "name": "Civic Sport 1.5T",
        "model_year": 2025,
        "status": "in_production",
        "rfq_id": None,
        "description": "Mid trim, larger single-scroll turbo + electronic wastegate, 2.0 bar boost target with a flatter torque curve. In production — fully resolved BOM.",
        "owner": "R. Castillo (Program Mgr)",
    },
    {
        "program_id": "PGM-CIV-SI",
        "name": "Civic Si 1.5T",
        "model_year": 2026,
        "status": "quoting",
        "rfq_id": "RFQ-26-0512",
        "description": "Performance trim, NEW RFQ in progress. Twin-scroll turbo, forged internals, larger injectors, air-to-water intercooler. Being quoted now — this is the BOM running surrogate search against LX and Sport.",
        "owner": "A. Novak (Sourcing Engineer)",
    },
]
write("programs.json", programs)

LX, SPT, SI = "PGM-CIV-LX", "PGM-CIV-SPT", "PGM-CIV-SI"

# ---------------------------------------------------------------------------
# 3. PART CATALOG
# Each entry: part_id, name, subsystem, material, manufacture_method,
# complexity (Low/Med/High), weight_kg, base_price_usd, lead_time_wk, supplier_id
# ---------------------------------------------------------------------------
parts = [
    # --- Cylinder Block & Bottom End (shared across all 3, except pistons) ---
    {"part_id": "BLK-101", "name": "Cylinder block", "subsystem": "Cylinder Block & Bottom End",
     "material": "Die-cast aluminum A380", "manufacture_method": "High-pressure die casting", "complexity": "High",
     "weight_kg": 18.4, "base_price_usd": 210.00, "lead_time_wk": 10, "supplier_id": "SUP-005"},
    {"part_id": "BLK-110", "name": "Crankshaft", "subsystem": "Cylinder Block & Bottom End",
     "material": "Forged steel 1548", "manufacture_method": "Closed-die forging + CNC machining", "complexity": "High",
     "weight_kg": 9.1, "base_price_usd": 165.00, "lead_time_wk": 12, "supplier_id": "SUP-006"},
    {"part_id": "BLK-115", "name": "Connecting rod set (x4)", "subsystem": "Cylinder Block & Bottom End",
     "material": "Powder-forged steel", "manufacture_method": "Powder metal forging", "complexity": "Med",
     "weight_kg": 2.0, "base_price_usd": 88.00, "lead_time_wk": 8, "supplier_id": "SUP-006"},
    {"part_id": "BLK-120", "name": "Piston set (x4), hypereutectic", "subsystem": "Cylinder Block & Bottom End",
     "material": "Hypereutectic aluminum alloy", "manufacture_method": "Gravity die casting", "complexity": "Med",
     "weight_kg": 1.6, "base_price_usd": 72.00, "lead_time_wk": 8, "supplier_id": "SUP-004"},
    {"part_id": "BLK-121", "name": "Piston set (x4), forged", "subsystem": "Cylinder Block & Bottom End",
     "material": "2618 forged aluminum alloy", "manufacture_method": "Closed-die forging", "complexity": "High",
     "weight_kg": 1.7, "base_price_usd": 141.00, "lead_time_wk": 11, "supplier_id": "SUP-004"},
    {"part_id": "BLK-130", "name": "Oil pump", "subsystem": "Cylinder Block & Bottom End",
     "material": "Die-cast aluminum housing / sintered gerotor", "manufacture_method": "Die casting + powder metal", "complexity": "Med",
     "weight_kg": 1.1, "base_price_usd": 46.00, "lead_time_wk": 7, "supplier_id": "SUP-006"},
    {"part_id": "BLK-135", "name": "Oil pan", "subsystem": "Cylinder Block & Bottom End",
     "material": "Stamped steel", "manufacture_method": "Progressive-die stamping", "complexity": "Low",
     "weight_kg": 2.2, "base_price_usd": 24.00, "lead_time_wk": 5, "supplier_id": "SUP-013"},
    {"part_id": "BLK-140", "name": "Main bearing set", "subsystem": "Cylinder Block & Bottom End",
     "material": "Steel-backed babbitt", "manufacture_method": "Bi-metal strip rolling + machining", "complexity": "Low",
     "weight_kg": 0.6, "base_price_usd": 19.00, "lead_time_wk": 6, "supplier_id": "SUP-009"},
    {"part_id": "BLK-145", "name": "Balance shaft assembly", "subsystem": "Cylinder Block & Bottom End",
     "material": "Cast iron / forged steel shaft", "manufacture_method": "Casting + machining", "complexity": "Med",
     "weight_kg": 2.4, "base_price_usd": 58.00, "lead_time_wk": 8, "supplier_id": "SUP-006"},

    # --- Cylinder Head & Valvetrain (fully shared across all 3) ---
    {"part_id": "HD-201", "name": "Cylinder head casting", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Die-cast aluminum A356", "manufacture_method": "Low-pressure die casting", "complexity": "High",
     "weight_kg": 11.2, "base_price_usd": 175.00, "lead_time_wk": 10, "supplier_id": "SUP-005"},
    {"part_id": "HD-205", "name": "Intake camshaft", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Chilled cast iron", "manufacture_method": "Casting + grinding", "complexity": "Med",
     "weight_kg": 1.3, "base_price_usd": 42.00, "lead_time_wk": 7, "supplier_id": "SUP-006"},
    {"part_id": "HD-206", "name": "Exhaust camshaft", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Chilled cast iron", "manufacture_method": "Casting + grinding", "complexity": "Med",
     "weight_kg": 1.3, "base_price_usd": 42.00, "lead_time_wk": 7, "supplier_id": "SUP-006"},
    {"part_id": "HD-210", "name": "VTEC solenoid assembly", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Aluminum body / steel spool", "manufacture_method": "Machining + assembly", "complexity": "Med",
     "weight_kg": 0.4, "base_price_usd": 61.00, "lead_time_wk": 9, "supplier_id": "SUP-008"},
    {"part_id": "HD-215", "name": "Valve set, intake (x4)", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Chrome-silicon steel", "manufacture_method": "Forging + grinding", "complexity": "Low",
     "weight_kg": 0.3, "base_price_usd": 28.00, "lead_time_wk": 6, "supplier_id": "SUP-006"},
    {"part_id": "HD-216", "name": "Valve set, exhaust (x4)", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Austenitic steel, sodium-filled", "manufacture_method": "Forging + grinding", "complexity": "Med",
     "weight_kg": 0.35, "base_price_usd": 39.00, "lead_time_wk": 6, "supplier_id": "SUP-006"},
    {"part_id": "HD-220", "name": "Head gasket", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Multi-layer steel", "manufacture_method": "Stamping + coating", "complexity": "Low",
     "weight_kg": 0.3, "base_price_usd": 22.00, "lead_time_wk": 5, "supplier_id": "SUP-011"},
    {"part_id": "HD-225", "name": "Timing chain", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Alloy steel, roller type", "manufacture_method": "Precision link assembly", "complexity": "Low",
     "weight_kg": 0.5, "base_price_usd": 18.00, "lead_time_wk": 5, "supplier_id": "SUP-014"},
    {"part_id": "HD-230", "name": "Timing chain tensioner", "subsystem": "Cylinder Head & Valvetrain",
     "material": "Aluminum housing, hydraulic ratchet", "manufacture_method": "Machining + assembly", "complexity": "Low",
     "weight_kg": 0.3, "base_price_usd": 21.00, "lead_time_wk": 6, "supplier_id": "SUP-014"},

    # --- Turbocharger System: shared lines (all 3) ---
    {"part_id": "TC-310", "name": "Turbo oil feed line", "subsystem": "Turbocharger System",
     "material": "Braided steel / banjo fittings", "manufacture_method": "Hose assembly", "complexity": "Low",
     "weight_kg": 0.2, "base_price_usd": 26.00, "lead_time_wk": 5, "supplier_id": "SUP-010"},
    {"part_id": "TC-315", "name": "Turbo oil return line", "subsystem": "Turbocharger System",
     "material": "Rubber/steel composite", "manufacture_method": "Hose assembly", "complexity": "Low",
     "weight_kg": 0.2, "base_price_usd": 19.00, "lead_time_wk": 5, "supplier_id": "SUP-010"},
    {"part_id": "TC-320", "name": "Turbo coolant feed line", "subsystem": "Turbocharger System",
     "material": "Silicone-reinforced hose", "manufacture_method": "Hose assembly", "complexity": "Low",
     "weight_kg": 0.15, "base_price_usd": 16.00, "lead_time_wk": 5, "supplier_id": "SUP-010"},
    {"part_id": "TC-325", "name": "Turbo coolant return line", "subsystem": "Turbocharger System",
     "material": "Silicone-reinforced hose", "manufacture_method": "Hose assembly", "complexity": "Low",
     "weight_kg": 0.15, "base_price_usd": 16.00, "lead_time_wk": 5, "supplier_id": "SUP-010"},

    # --- Turbocharger System: variant families (A=LX, B=Sport, C=Si) ---
    {"part_id": "TC-401-A", "name": "Turbine wheel, single-scroll", "subsystem": "Turbocharger System",
     "material": "Cast Inconel 713C", "manufacture_method": "Investment casting", "complexity": "High",
     "weight_kg": 0.35, "base_price_usd": 210.00, "lead_time_wk": 14, "supplier_id": "SUP-001"},
    {"part_id": "TC-401-B", "name": "Turbine wheel, single-scroll, high-flow", "subsystem": "Turbocharger System",
     "material": "Cast Inconel 713C", "manufacture_method": "Investment casting", "complexity": "High",
     "weight_kg": 0.39, "base_price_usd": 238.00, "lead_time_wk": 14, "supplier_id": "SUP-001"},
    {"part_id": "TC-401-C", "name": "Turbine wheel, twin-scroll", "subsystem": "Turbocharger System",
     "material": "Cast Inconel 713C", "manufacture_method": "Investment casting", "complexity": "High",
     "weight_kg": 0.44, "base_price_usd": 285.00, "lead_time_wk": 16, "supplier_id": "SUP-001"},

    {"part_id": "TC-402-A", "name": "Compressor wheel, 48mm", "subsystem": "Turbocharger System",
     "material": "Forged 2618 aluminum", "manufacture_method": "5-axis milling from billet", "complexity": "High",
     "weight_kg": 0.12, "base_price_usd": 95.00, "lead_time_wk": 12, "supplier_id": "SUP-001"},
    {"part_id": "TC-402-B", "name": "Compressor wheel, 52mm", "subsystem": "Turbocharger System",
     "material": "Forged 2618 aluminum", "manufacture_method": "5-axis milling from billet", "complexity": "High",
     "weight_kg": 0.14, "base_price_usd": 112.00, "lead_time_wk": 12, "supplier_id": "SUP-001"},
    {"part_id": "TC-402-C", "name": "Compressor wheel, 56mm billet", "subsystem": "Turbocharger System",
     "material": "Forged 2618 aluminum, billet", "manufacture_method": "5-axis milling from billet", "complexity": "High",
     "weight_kg": 0.16, "base_price_usd": 149.00, "lead_time_wk": 14, "supplier_id": "SUP-001"},

    {"part_id": "TC-403-A", "name": "Center housing (CHRA), journal bearing", "subsystem": "Turbocharger System",
     "material": "Cast iron housing / bronze journal bearings", "manufacture_method": "Casting + precision bore machining", "complexity": "High",
     "weight_kg": 1.8, "base_price_usd": 265.00, "lead_time_wk": 14, "supplier_id": "SUP-001"},
    {"part_id": "TC-403-B", "name": "Center housing (CHRA), ball bearing", "subsystem": "Turbocharger System",
     "material": "Cast iron housing / ceramic ball bearing cartridge", "manufacture_method": "Casting + precision bore machining", "complexity": "High",
     "weight_kg": 1.7, "base_price_usd": 340.00, "lead_time_wk": 15, "supplier_id": "SUP-009"},
    {"part_id": "TC-403-C", "name": "Center housing (CHRA), ball bearing, twin-scroll", "subsystem": "Turbocharger System",
     "material": "Cast iron housing / ceramic ball bearing cartridge", "manufacture_method": "Casting + precision bore machining", "complexity": "High",
     "weight_kg": 1.9, "base_price_usd": 375.00, "lead_time_wk": 16, "supplier_id": "SUP-009"},

    {"part_id": "TC-404-A", "name": "Turbine housing, single-scroll", "subsystem": "Turbocharger System",
     "material": "Ni-resist cast iron", "manufacture_method": "Sand casting", "complexity": "High",
     "weight_kg": 2.6, "base_price_usd": 120.00, "lead_time_wk": 13, "supplier_id": "SUP-013"},
    {"part_id": "TC-404-B", "name": "Turbine housing, single-scroll, revised A/R", "subsystem": "Turbocharger System",
     "material": "Ni-resist cast iron", "manufacture_method": "Sand casting", "complexity": "High",
     "weight_kg": 2.7, "base_price_usd": 128.00, "lead_time_wk": 13, "supplier_id": "SUP-013"},
    {"part_id": "TC-404-C", "name": "Turbine housing, twin-scroll", "subsystem": "Turbocharger System",
     "material": "Ni-resist cast iron", "manufacture_method": "Sand casting", "complexity": "High",
     "weight_kg": 3.1, "base_price_usd": 168.00, "lead_time_wk": 15, "supplier_id": "SUP-013"},

    {"part_id": "TC-405-A", "name": "Compressor housing", "subsystem": "Turbocharger System",
     "material": "Cast aluminum A356", "manufacture_method": "Sand casting", "complexity": "Med",
     "weight_kg": 1.1, "base_price_usd": 64.00, "lead_time_wk": 11, "supplier_id": "SUP-005"},
    {"part_id": "TC-405-B", "name": "Compressor housing, larger", "subsystem": "Turbocharger System",
     "material": "Cast aluminum A356", "manufacture_method": "Sand casting", "complexity": "Med",
     "weight_kg": 1.25, "base_price_usd": 71.00, "lead_time_wk": 11, "supplier_id": "SUP-005"},
    {"part_id": "TC-405-C", "name": "Compressor housing, large, twin-scroll volute", "subsystem": "Turbocharger System",
     "material": "Cast aluminum A356", "manufacture_method": "Sand casting", "complexity": "High",
     "weight_kg": 1.4, "base_price_usd": 89.00, "lead_time_wk": 13, "supplier_id": "SUP-005"},

    {"part_id": "TC-406-A", "name": "Wastegate actuator, pneumatic", "subsystem": "Turbocharger System",
     "material": "Stamped steel canister / diaphragm", "manufacture_method": "Stamping + assembly", "complexity": "Low",
     "weight_kg": 0.4, "base_price_usd": 34.00, "lead_time_wk": 8, "supplier_id": "SUP-001"},
    {"part_id": "TC-406-B", "name": "Wastegate actuator, electronic", "subsystem": "Turbocharger System",
     "material": "Aluminum housing / brushless motor", "manufacture_method": "Machining + assembly", "complexity": "Med",
     "weight_kg": 0.55, "base_price_usd": 78.00, "lead_time_wk": 10, "supplier_id": "SUP-001"},
    {"part_id": "TC-406-C", "name": "Wastegate actuator, electronic, high-torque", "subsystem": "Turbocharger System",
     "material": "Aluminum housing / brushless motor", "manufacture_method": "Machining + assembly", "complexity": "Med",
     "weight_kg": 0.58, "base_price_usd": 86.00, "lead_time_wk": 10, "supplier_id": "SUP-001"},

    # Valve seat: A used by LX & Sport & reused by Si (true duplicate)
    {"part_id": "TC-407-A", "name": "Wastegate valve seat", "subsystem": "Turbocharger System",
     "material": "Stellite-faced steel", "manufacture_method": "Machining + hardfacing", "complexity": "Low",
     "weight_kg": 0.05, "base_price_usd": 12.00, "lead_time_wk": 6, "supplier_id": "SUP-001"},

    # Blow-off/diverter valve: A shared LX+Sport, C new for Si
    {"part_id": "TC-408-A", "name": "Blow-off/diverter valve", "subsystem": "Turbocharger System",
     "material": "Aluminum housing / composite valve", "manufacture_method": "Machining + molding", "complexity": "Low",
     "weight_kg": 0.3, "base_price_usd": 29.00, "lead_time_wk": 7, "supplier_id": "SUP-001"},
    {"part_id": "TC-408-C", "name": "Blow-off/diverter valve, high-flow", "subsystem": "Turbocharger System",
     "material": "Aluminum housing / composite valve", "manufacture_method": "Machining + molding", "complexity": "Low",
     "weight_kg": 0.32, "base_price_usd": 33.00, "lead_time_wk": 7, "supplier_id": "SUP-001"},

    # New-to-Si sensor with no prior counterpart at all
    {"part_id": "ELEC-925-C", "name": "Turbine inlet EGT sensor", "subsystem": "Electrical & Sensors",
     "material": "Inconel sheath / ceramic insulated thermocouple", "manufacture_method": "Thermocouple assembly", "complexity": "Med",
     "weight_kg": 0.08, "base_price_usd": 41.00, "lead_time_wk": 9, "supplier_id": "SUP-007"},

    # --- Intake & Charge Air ---
    {"part_id": "INT-501", "name": "Air filter housing", "subsystem": "Intake & Charge Air",
     "material": "Molded polypropylene", "manufacture_method": "Injection molding", "complexity": "Low",
     "weight_kg": 0.9, "base_price_usd": 18.00, "lead_time_wk": 6, "supplier_id": "SUP-013"},
    {"part_id": "INT-505-A", "name": "Throttle body, 60mm", "subsystem": "Intake & Charge Air",
     "material": "Die-cast aluminum", "manufacture_method": "Die casting + machining", "complexity": "Med",
     "weight_kg": 0.8, "base_price_usd": 72.00, "lead_time_wk": 9, "supplier_id": "SUP-008"},
    {"part_id": "INT-505-C", "name": "Throttle body, 68mm", "subsystem": "Intake & Charge Air",
     "material": "Die-cast aluminum", "manufacture_method": "Die casting + machining", "complexity": "Med",
     "weight_kg": 0.9, "base_price_usd": 84.00, "lead_time_wk": 9, "supplier_id": "SUP-008"},
    {"part_id": "INT-510-A", "name": "Intercooler, air-to-air", "subsystem": "Intake & Charge Air",
     "material": "Aluminum bar-and-plate core", "manufacture_method": "Brazed aluminum core assembly", "complexity": "Med",
     "weight_kg": 4.2, "base_price_usd": 95.00, "lead_time_wk": 10, "supplier_id": "SUP-012"},
    {"part_id": "INT-510-B", "name": "Intercooler, air-to-air, larger core", "subsystem": "Intake & Charge Air",
     "material": "Aluminum bar-and-plate core", "manufacture_method": "Brazed aluminum core assembly", "complexity": "Med",
     "weight_kg": 4.8, "base_price_usd": 112.00, "lead_time_wk": 10, "supplier_id": "SUP-012"},
    {"part_id": "INT-510-C", "name": "Intercooler, air-to-water", "subsystem": "Intake & Charge Air",
     "material": "Aluminum core / cast end tanks, dedicated coolant loop", "manufacture_method": "Brazed core + cast tank assembly", "complexity": "High",
     "weight_kg": 6.1, "base_price_usd": 215.00, "lead_time_wk": 15, "supplier_id": "SUP-012"},
    {"part_id": "INT-515-A", "name": "Charge pipe set", "subsystem": "Intake & Charge Air",
     "material": "Molded silicone + aluminum tube", "manufacture_method": "Tube bending + molding", "complexity": "Low",
     "weight_kg": 1.1, "base_price_usd": 38.00, "lead_time_wk": 7, "supplier_id": "SUP-010"},
    {"part_id": "INT-515-B", "name": "Charge pipe set, larger bore", "subsystem": "Intake & Charge Air",
     "material": "Molded silicone + aluminum tube", "manufacture_method": "Tube bending + molding", "complexity": "Low",
     "weight_kg": 1.2, "base_price_usd": 42.00, "lead_time_wk": 7, "supplier_id": "SUP-010"},
    {"part_id": "INT-515-C", "name": "Charge pipe set, larger bore, water-cooled routing", "subsystem": "Intake & Charge Air",
     "material": "Molded silicone + aluminum tube", "manufacture_method": "Tube bending + molding", "complexity": "Med",
     "weight_kg": 1.4, "base_price_usd": 51.00, "lead_time_wk": 8, "supplier_id": "SUP-010"},
    {"part_id": "INT-520", "name": "Intake manifold", "subsystem": "Intake & Charge Air",
     "material": "Molded composite", "manufacture_method": "Injection molding", "complexity": "Med",
     "weight_kg": 1.8, "base_price_usd": 54.00, "lead_time_wk": 8, "supplier_id": "SUP-013"},

    # --- Fuel System ---
    {"part_id": "FUEL-601", "name": "Fuel rail", "subsystem": "Fuel System",
     "material": "Stainless steel, direct-injection rated", "manufacture_method": "Tube forming + machining", "complexity": "Med",
     "weight_kg": 0.6, "base_price_usd": 48.00, "lead_time_wk": 9, "supplier_id": "SUP-008"},
    {"part_id": "FUEL-605", "name": "High-pressure fuel pump", "subsystem": "Fuel System",
     "material": "Steel body, cam-driven plunger", "manufacture_method": "Precision machining + assembly", "complexity": "High",
     "weight_kg": 0.5, "base_price_usd": 110.00, "lead_time_wk": 12, "supplier_id": "SUP-008"},
    {"part_id": "FUEL-610", "name": "Fuel pressure sensor", "subsystem": "Fuel System",
     "material": "Steel diaphragm / molded housing", "manufacture_method": "MEMS sensor assembly", "complexity": "Low",
     "weight_kg": 0.05, "base_price_usd": 22.00, "lead_time_wk": 8, "supplier_id": "SUP-007"},
    {"part_id": "FUEL-615-A", "name": "Fuel injector, 350cc", "subsystem": "Fuel System",
     "material": "Steel body / piezo-electric valve", "manufacture_method": "Precision machining + assembly", "complexity": "High",
     "weight_kg": 0.08, "base_price_usd": 58.00, "lead_time_wk": 11, "supplier_id": "SUP-007"},
    {"part_id": "FUEL-615-C", "name": "Fuel injector, 440cc", "subsystem": "Fuel System",
     "material": "Steel body / piezo-electric valve", "manufacture_method": "Precision machining + assembly", "complexity": "High",
     "weight_kg": 0.09, "base_price_usd": 69.00, "lead_time_wk": 11, "supplier_id": "SUP-007"},

    # --- Exhaust System ---
    {"part_id": "EXH-701", "name": "Catalytic converter", "subsystem": "Exhaust System",
     "material": "Cordierite substrate / stainless shell", "manufacture_method": "Extrusion + canning", "complexity": "Med",
     "weight_kg": 2.8, "base_price_usd": 185.00, "lead_time_wk": 10, "supplier_id": "SUP-011"},
    {"part_id": "EXH-705", "name": "O2 sensor, upstream", "subsystem": "Exhaust System",
     "material": "Zirconia ceramic element", "manufacture_method": "Ceramic sensor assembly", "complexity": "Low",
     "weight_kg": 0.1, "base_price_usd": 31.00, "lead_time_wk": 8, "supplier_id": "SUP-007"},
    {"part_id": "EXH-706", "name": "O2 sensor, downstream", "subsystem": "Exhaust System",
     "material": "Zirconia ceramic element", "manufacture_method": "Ceramic sensor assembly", "complexity": "Low",
     "weight_kg": 0.1, "base_price_usd": 27.00, "lead_time_wk": 8, "supplier_id": "SUP-007"},
    {"part_id": "EXH-710-A", "name": "Exhaust manifold/downpipe, single-scroll flange", "subsystem": "Exhaust System",
     "material": "Cast stainless steel", "manufacture_method": "Investment casting", "complexity": "Med",
     "weight_kg": 3.4, "base_price_usd": 92.00, "lead_time_wk": 11, "supplier_id": "SUP-013"},
    {"part_id": "EXH-710-C", "name": "Exhaust manifold/downpipe, twin-scroll flange", "subsystem": "Exhaust System",
     "material": "Cast stainless steel", "manufacture_method": "Investment casting", "complexity": "High",
     "weight_kg": 3.9, "base_price_usd": 128.00, "lead_time_wk": 13, "supplier_id": "SUP-013"},

    # --- Cooling System (fully shared) ---
    {"part_id": "COOL-801", "name": "Water pump", "subsystem": "Cooling System",
     "material": "Aluminum housing / composite impeller", "manufacture_method": "Die casting + molding", "complexity": "Med",
     "weight_kg": 1.0, "base_price_usd": 44.00, "lead_time_wk": 9, "supplier_id": "SUP-012"},
    {"part_id": "COOL-805", "name": "Thermostat", "subsystem": "Cooling System",
     "material": "Wax-pellet element / composite housing", "manufacture_method": "Molding + assembly", "complexity": "Low",
     "weight_kg": 0.2, "base_price_usd": 15.00, "lead_time_wk": 6, "supplier_id": "SUP-012"},
    {"part_id": "COOL-810", "name": "Radiator hose, upper", "subsystem": "Cooling System",
     "material": "EPDM rubber", "manufacture_method": "Extrusion + molding", "complexity": "Low",
     "weight_kg": 0.3, "base_price_usd": 12.00, "lead_time_wk": 5, "supplier_id": "SUP-010"},
    {"part_id": "COOL-811", "name": "Radiator hose, lower", "subsystem": "Cooling System",
     "material": "EPDM rubber", "manufacture_method": "Extrusion + molding", "complexity": "Low",
     "weight_kg": 0.3, "base_price_usd": 12.00, "lead_time_wk": 5, "supplier_id": "SUP-010"},

    # --- Electrical & Sensors (shared) ---
    {"part_id": "ELEC-901", "name": "ECU (hardware)", "subsystem": "Electrical & Sensors",
     "material": "Aluminum housing / PCB assembly", "manufacture_method": "SMT assembly + potting", "complexity": "High",
     "weight_kg": 0.6, "base_price_usd": 165.00, "lead_time_wk": 14, "supplier_id": "SUP-008"},
    {"part_id": "ELEC-905", "name": "Crank position sensor", "subsystem": "Electrical & Sensors",
     "material": "Hall-effect element / molded housing", "manufacture_method": "Sensor assembly", "complexity": "Low",
     "weight_kg": 0.05, "base_price_usd": 19.00, "lead_time_wk": 7, "supplier_id": "SUP-007"},
    {"part_id": "ELEC-906", "name": "Cam position sensor", "subsystem": "Electrical & Sensors",
     "material": "Hall-effect element / molded housing", "manufacture_method": "Sensor assembly", "complexity": "Low",
     "weight_kg": 0.05, "base_price_usd": 19.00, "lead_time_wk": 7, "supplier_id": "SUP-007"},
    {"part_id": "ELEC-910", "name": "Ignition coil set (x4)", "subsystem": "Electrical & Sensors",
     "material": "Epoxy-potted coil / steel core", "manufacture_method": "Coil winding + potting", "complexity": "Med",
     "weight_kg": 0.5, "base_price_usd": 62.00, "lead_time_wk": 8, "supplier_id": "SUP-008"},
    {"part_id": "ELEC-915", "name": "Spark plug set (x4)", "subsystem": "Electrical & Sensors",
     "material": "Iridium-tipped electrode", "manufacture_method": "Ceramic insulator assembly", "complexity": "Low",
     "weight_kg": 0.1, "base_price_usd": 24.00, "lead_time_wk": 6, "supplier_id": "SUP-008"},
    {"part_id": "ELEC-920-A", "name": "MAP/boost pressure sensor, 2.0 bar range", "subsystem": "Electrical & Sensors",
     "material": "Silicon piezoresistive element", "manufacture_method": "MEMS sensor assembly", "complexity": "Low",
     "weight_kg": 0.04, "base_price_usd": 21.00, "lead_time_wk": 8, "supplier_id": "SUP-007"},
    {"part_id": "ELEC-920-C", "name": "MAP/boost pressure sensor, 2.5 bar range", "subsystem": "Electrical & Sensors",
     "material": "Silicon piezoresistive element", "manufacture_method": "MEMS sensor assembly", "complexity": "Low",
     "weight_kg": 0.04, "base_price_usd": 24.00, "lead_time_wk": 8, "supplier_id": "SUP-007"},

    # --- Accessory Drive (fully shared) ---
    {"part_id": "ACC-1001", "name": "Alternator", "subsystem": "Accessory Drive",
     "material": "Aluminum housing / copper windings", "manufacture_method": "Die casting + winding assembly", "complexity": "Med",
     "weight_kg": 4.1, "base_price_usd": 88.00, "lead_time_wk": 10, "supplier_id": "SUP-014"},
    {"part_id": "ACC-1005", "name": "Accessory belt", "subsystem": "Accessory Drive",
     "material": "EPDM, ribbed", "manufacture_method": "Extrusion + molding", "complexity": "Low",
     "weight_kg": 0.2, "base_price_usd": 14.00, "lead_time_wk": 5, "supplier_id": "SUP-010"},
    {"part_id": "ACC-1006", "name": "Belt tensioner", "subsystem": "Accessory Drive",
     "material": "Aluminum arm / steel spring", "manufacture_method": "Casting + assembly", "complexity": "Low",
     "weight_kg": 0.6, "base_price_usd": 26.00, "lead_time_wk": 7, "supplier_id": "SUP-014"},
]
write("parts.json", parts)
part_ids = {p["part_id"] for p in parts}

# ---------------------------------------------------------------------------
# 4. BOM LINES per program
# For each program, the set of parts used + certainty/provenance/carry info.
# ---------------------------------------------------------------------------

# Parts shared identically across all 3 programs (true duplicates everywhere)
SHARED_ALL = [
    "BLK-101","BLK-110","BLK-115","BLK-130","BLK-135","BLK-140","BLK-145",
    "HD-201","HD-205","HD-206","HD-210","HD-215","HD-216","HD-220","HD-225","HD-230",
    "TC-310","TC-315","TC-320","TC-325","TC-407-A",
    "INT-501","INT-520",
    "FUEL-601","FUEL-605","FUEL-610",
    "EXH-701","EXH-705","EXH-706",
    "COOL-801","COOL-805","COOL-810","COOL-811",
    "ELEC-901","ELEC-905","ELEC-906","ELEC-910","ELEC-915",
    "ACC-1001","ACC-1005","ACC-1006",
]

# Parts shared between LX & Sport only, with a distinct Si replacement.
# tuple: (lx/sport part id, si replacement part id, surrogate_pct for Si row, similarity note)
PAIRED_LX_SPORT_VS_SI = [
    ("BLK-120", "BLK-121", 75, {"geometry": 82, "manufacture_complexity": 55, "material": 70, "supplier_location": 100, "order_of_magnitude": 90}),
    ("TC-408-A", "TC-408-C", 95, {"geometry": 96, "manufacture_complexity": 95, "material": 100, "supplier_location": 100, "order_of_magnitude": 95}),
    ("INT-505-A", "INT-505-C", 90, {"geometry": 90, "manufacture_complexity": 92, "material": 100, "supplier_location": 100, "order_of_magnitude": 88}),
    ("FUEL-615-A", "FUEL-615-C", 93, {"geometry": 94, "manufacture_complexity": 95, "material": 100, "supplier_location": 100, "order_of_magnitude": 90}),
    ("EXH-710-A", "EXH-710-C", 58, {"geometry": 40, "manufacture_complexity": 65, "material": 100, "supplier_location": 100, "order_of_magnitude": 75}),
    ("ELEC-920-A", "ELEC-920-C", 92, {"geometry": 95, "manufacture_complexity": 95, "material": 100, "supplier_location": 100, "order_of_magnitude": 85}),
]

# Fully variant-specific families: (A, B, C) with Si's best-candidate = B, similarity breakdown
VARIANT_FAMILIES = [
    ("TC-401-A", "TC-401-B", "TC-401-C", 90, {"geometry": 88, "manufacture_complexity": 95, "material": 100, "supplier_location": 100, "order_of_magnitude": 85}),
    ("TC-402-A", "TC-402-B", "TC-402-C", 87, {"geometry": 85, "manufacture_complexity": 92, "material": 100, "supplier_location": 100, "order_of_magnitude": 82}),
    ("TC-403-A", "TC-403-B", "TC-403-C", 93, {"geometry": 92, "manufacture_complexity": 96, "material": 100, "supplier_location": 100, "order_of_magnitude": 90}),
    ("TC-404-A", "TC-404-B", "TC-404-C", 68, {"geometry": 45, "manufacture_complexity": 80, "material": 100, "supplier_location": 100, "order_of_magnitude": 85}),
    ("TC-405-A", "TC-405-B", "TC-405-C", 91, {"geometry": 90, "manufacture_complexity": 93, "material": 100, "supplier_location": 100, "order_of_magnitude": 88}),
    ("TC-406-A", "TC-406-B", "TC-406-C", 95, {"geometry": 96, "manufacture_complexity": 97, "material": 100, "supplier_location": 100, "order_of_magnitude": 94}),
    ("INT-510-A", "INT-510-B", "INT-510-C", 55, {"geometry": 35, "manufacture_complexity": 45, "material": 70, "supplier_location": 100, "order_of_magnitude": 60}),
    ("INT-515-A", "INT-515-B", "INT-515-C", 82, {"geometry": 78, "manufacture_complexity": 85, "material": 100, "supplier_location": 100, "order_of_magnitude": 80}),
]

bom_lines = []
line_seq = 1

def new_line(program_id, part_id, certainty, provenance, surrogate_pct=None,
             surrogate_breakdown=None, other_candidates=None, carry_note=None,
             match_type=None):
    global line_seq
    part = next(p for p in parts if p["part_id"] == part_id)
    price = round(part["base_price_usd"] * (1 + random.uniform(-0.03, 0.03)), 2)
    line = {
        "bom_line_id": f"BOML-{line_seq:04d}",
        "program_id": program_id,
        "part_id": part_id,
        "subassembly": part["subsystem"],
        "quantity": 1,
        "unit_price_usd": price,
        "currency": "USD",
        "price_source": "Supplier quote" if program_id != SI else ("Supplier quote" if certainty == "Actual" else "Surrogate-derived estimate"),
        "supplier_id": part["supplier_id"],
        "region": next(s["region"] for s in suppliers if s["supplier_id"] == part["supplier_id"]),
        "certainty": certainty,  # Actual | Surrogate | Estimated | No match | Search failed
        "surrogate_match_pct": surrogate_pct,
        "surrogate_breakdown": surrogate_breakdown,
        "provenance": provenance,
        "other_candidates": other_candidates or [],
        "carry_note": carry_note,
        "match_type": match_type,  # duplicate | surrogate | new | None (for in-production actuals)
    }
    line_seq += 1
    bom_lines.append(line)
    return line

# --- LX (in production): everything Actual ---
for pid in SHARED_ALL:
    new_line(LX, pid, "Actual", "Direct — production part", match_type=None)
new_line(LX, "BLK-120", "Actual", "Direct — production part")
new_line(LX, "TC-401-A", "Actual", "Direct — production part")
new_line(LX, "TC-402-A", "Actual", "Direct — production part")
new_line(LX, "TC-403-A", "Actual", "Direct — production part")
new_line(LX, "TC-404-A", "Actual", "Direct — production part")
new_line(LX, "TC-405-A", "Actual", "Direct — production part")
new_line(LX, "TC-406-A", "Actual", "Direct — production part")
new_line(LX, "TC-408-A", "Actual", "Direct — production part")
new_line(LX, "INT-505-A", "Actual", "Direct — production part")
new_line(LX, "INT-510-A", "Actual", "Direct — production part")
new_line(LX, "INT-515-A", "Actual", "Direct — production part")
new_line(LX, "FUEL-615-A", "Actual", "Direct — production part")
new_line(LX, "EXH-710-A", "Actual", "Direct — production part")
new_line(LX, "ELEC-920-A", "Actual", "Direct — production part")

# --- Sport (in production): everything Actual ---
for pid in SHARED_ALL:
    new_line(SPT, pid, "Actual", "Direct — production part")
new_line(SPT, "BLK-120", "Actual", "Direct — production part")
new_line(SPT, "TC-401-B", "Actual", "Direct — production part")
new_line(SPT, "TC-402-B", "Actual", "Direct — production part")
new_line(SPT, "TC-403-B", "Actual", "Direct — production part")
new_line(SPT, "TC-404-B", "Actual", "Direct — production part")
new_line(SPT, "TC-405-B", "Actual", "Direct — production part")
new_line(SPT, "TC-406-B", "Actual", "Direct — production part")
new_line(SPT, "TC-408-A", "Actual", "Direct — production part")
new_line(SPT, "INT-505-A", "Actual", "Direct — production part")
new_line(SPT, "INT-510-B", "Actual", "Direct — production part")
new_line(SPT, "INT-515-B", "Actual", "Direct — production part")
new_line(SPT, "FUEL-615-A", "Actual", "Direct — production part")
new_line(SPT, "EXH-710-A", "Actual", "Direct — production part")
new_line(SPT, "ELEC-920-A", "Actual", "Direct — production part")

# --- Si (NEW RFQ, being quoted) ---
# Shared-all-3 parts (incl. TC-407-A) carry straight over as literal duplicates
for pid in SHARED_ALL:
    if pid == "TC-407-A":
        new_line(SI, pid, "Actual", "Carryover — geometric duplicate",
                 carry_note="Identical part already used on LX and Sport (same PN) — no search needed.",
                 match_type="duplicate")
    else:
        new_line(SI, pid, "Actual", "Carryover — geometric duplicate",
                 carry_note="Unchanged block/head/accessory architecture — reused as-is across all three trims.",
                 match_type="duplicate")

# Paired LX/Sport -> distinct Si replacement: Surrogate match against the LX/Sport part
for (src, dst, pct, breakdown) in PAIRED_LX_SPORT_VS_SI:
    new_line(SI, dst, "Surrogate", f"Surrogate match — {pct}% vs. {src} (LX/Sport)",
             surrogate_pct=pct, surrogate_breakdown=breakdown,
             other_candidates=[{"part_id": src, "program_id": LX, "match_pct": pct}],
             match_type="surrogate")

# Fully variant families: Si's best candidate is the B (Sport) version
for (a, b, c, pct, breakdown) in VARIANT_FAMILIES:
    certainty = "Surrogate" if pct >= 60 else "Estimated"
    provenance = (f"Surrogate match — {pct}% vs. {b} (Sport)" if certainty == "Surrogate"
                  else f"Estimated — closest candidate {b} (Sport) scored only {pct}%, below the surrogate-confidence threshold; routed to an estimated cost model pending supplier quote.")
    new_line(SI, c, certainty, provenance,
             surrogate_pct=pct, surrogate_breakdown=breakdown,
             other_candidates=[{"part_id": b, "program_id": SPT, "match_pct": pct},
                                {"part_id": a, "program_id": LX, "match_pct": max(pct - 15, 20)}],
             match_type="surrogate" if certainty == "Surrogate" else "estimated")

# Brand-new part with no prior counterpart anywhere
new_line(SI, "ELEC-925-C", "No match", "New requirement — no equivalent sensor on any existing program.",
         other_candidates=[], carry_note="First use of an EGT sensor on this engine family; driven by the twin-scroll turbine's new thermal-protection requirement.",
         match_type="new")

write("bom_lines.json", bom_lines)

print("\nLine counts per program:")
for pid in (LX, SPT, SI):
    print(" ", pid, sum(1 for l in bom_lines if l["program_id"] == pid))
