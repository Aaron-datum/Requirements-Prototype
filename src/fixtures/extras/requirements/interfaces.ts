/**
 * What each requirement is Driven by (the interface it verifies), the delta text for New and Changed clauses, the alternate
 * test candidates and the owners by category. The dataset has the Driven-by state and score but no interface entity (docs/01:
 * "the interface-change computation engine and a real interface entity" are prototype simplifications), so propagation of
 * "Confirm Changed" is by shared interface id from this table.
 */
import type { TestCandidateRow } from './types'

export interface InterfaceDef { id: string; label: string }

const IF = {
  turbineHousing: { id: 'IF-TURB-HSG', label: 'Turbine wheel ↔ twin-scroll housing' },
  boostTarget: { id: 'IF-BOOST-2.5', label: 'Boost target 2.5 bar(a) ↔ engine' },
  chargePipe: { id: 'IF-CHG-ROUTE', label: 'Charge pipe ↔ water-cooled routing' },
  pistonLoad: { id: 'IF-PISTON-130', label: 'Piston ↔ 130 bar cylinder pressure' },
  wastegate: { id: 'IF-WG-HSG', label: 'Wastegate actuator ↔ turbine housing' },
  bearing: { id: 'IF-BRG-SHAFT', label: 'Bearing ↔ shaft' },
  mapSensor: { id: 'IF-MAP-MANIFOLD', label: 'MAP sensor ↔ intake manifold' },
  injector: { id: 'IF-INJ-RAIL', label: 'Injector ↔ fuel rail' },
  oilFeed: { id: 'IF-OIL-CHRA', label: 'Oil feed ↔ center housing' },
  crank: { id: 'IF-CRANK-DAMPER', label: 'Crankshaft ↔ torsional damper' },
  intercooler: { id: 'IF-ICOOL-LOOP', label: 'Intercooler ↔ water loop' },
  egt: { id: 'IF-EGT-HSG', label: 'EGT sensor ↔ turbine inlet' },
} satisfies Record<string, InterfaceDef>

export const INTERFACE_BY_REQ: Record<string, InterfaceDef> = {
  'REC-20001': IF.turbineHousing, 'REC-20008': IF.turbineHousing,
  'REC-20016': IF.boostTarget, 'REC-20004': IF.boostTarget,
  'REC-20007': IF.chargePipe, 'REC-20010': IF.pistonLoad,
  'REC-20002': IF.wastegate, 'REC-20011': IF.wastegate, 'REC-20012': IF.wastegate,
  'REC-20003': IF.bearing, 'REC-20005': IF.mapSensor, 'REC-20009': IF.injector,
  'REC-20014': IF.oilFeed, 'REC-20015': IF.crank, 'REC-20006': IF.intercooler, 'REC-20013': IF.egt,
}

/** Delta line for Changed and New rows (panel order: clause, source, delta, BOM line, why this test, candidates). */
export const DELTA_BY_REQ: Record<string, string> = {
  'REC-20004': 'Minimum surge margin tightened 12% → 15% · no surrogate at the new limit',
  'REC-20008': 'Cycle count raised 1,000 → 1,500 · twin-scroll flange has no prior fatigue result',
  'REC-20010': 'Peak cylinder pressure raised 115 → 130 bar · forged piston is a different process',
  'REC-20006': 'New clause · no prior air-to-water test exists on this program',
  'REC-20013': 'New clause · first EGT sensor on this engine family',
}

/**
 * Alternate test candidates, beside the proposed test from requirement_test_links.json. One per row is below the test-match
 * floor on purpose, so the floor visibly filters (config thresholds.testMatchFloor).
 */
export const ALTERNATES_BY_REQ: Record<string, TestCandidateRow[]> = {
  'REC-20001': [{ testId: 'DV-TC-217', confidence: 38, tags: ['CAD features'], reasoning: ['Thermal cycling of a cast housing', 'Does not load the housing to burst energy'] }],
  'REC-20004': [{ testId: 'DV-TC-215', confidence: 54, tags: ['RFQ', 'Internal'], reasoning: ['Also a sustained high-load dyno sweep', 'Does not record surge margin'] }],
  'REC-20006': [{ testId: 'DV-TC-213', confidence: 61, tags: ['Internal'], reasoning: ['Dyno sweep with compressor-outlet temperature logging', 'Would need a delta-T channel added'] }],
  'REC-20007': [{ testId: 'DV-TC-210', confidence: 57, tags: ['Internal'], reasoning: ['Burst-type procedure on a different article', 'Rig can take a charge pipe fixture'] }],
  'REC-20008': [{ testId: 'DV-TC-212', confidence: 53, tags: ['CAD features'], reasoning: ['Thermal cycling to 250 C only', 'Peak gas temperature is far below 950 C'] }],
  'REC-20010': [{ testId: 'DV-TC-224', confidence: 51, tags: ['Internal'], reasoning: ['Same dyno cell, fatigue spectrum rather than peak pressure'] }],
  'REC-20013': [{ testId: 'DV-TC-214', confidence: 63, tags: ['Internal', 'Supplier'], reasoning: ['Sensor accuracy calibration against a reference', 'Pressure source, not a temperature soak'] }],
  'REC-20016': [{ testId: 'DV-TC-215', confidence: 48, tags: ['Internal'], reasoning: ['Dyno cell is shared', 'No coil instrumentation'] }],
}

/** Owners by category (subsystem): a fallback when a requirement has no owner, and the owner of an uploaded record's review. */
export const OWNER_BY_CATEGORY: Record<string, string> = {
  'Turbocharger System': 'M. Okafor (Validation Engineer)',
  'Electrical & Sensors': 'D. Patel (Powertrain Systems)',
  'Intake & Charge Air': 'M. Okafor (Validation Engineer)',
  'Exhaust System': 'M. Okafor (Validation Engineer)',
  'Fuel System': 'D. Patel (Powertrain Systems)',
  'Cylinder Block & Bottom End': 'M. Okafor (Validation Engineer)',
}
export const DEFAULT_OWNER = 'M. Okafor (Validation Engineer)'

/** Scope facts that requirements inherit: due date, gate, source BOM. */
export const REQUIREMENTS_SCOPE = {
  due: '2026-10-09',
  planId: 'TP-CIV26-0007',
  gate: 'DV · 2027-01-18',
  bomId: 'BOM-CIV-SI rev 1',
  sources: 'SOR-CIV-15 · ES-CIV-0150',
  planOwner: 'M. Okafor (Validation Engineer)',
  programName: 'Civic Si 1.5T',
  modelYear: 'MY2026',
} as const
