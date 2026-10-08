/**
 * The Civic-class 1.5T example dataset (data/*.json), typed. Never edit data/: extend through src/fixtures/extras/.
 * Everything in the UI reaches this through derive.ts (the derive layer), not by importing JSON directly.
 */
import bomLinesJson from '../../data/bom_lines.json'
import carryoverJson from '../../data/carryover_events.json'
import costJson from '../../data/cost_estimates.json'
import partsJson from '../../data/parts.json'
import programsJson from '../../data/programs.json'
import linksJson from '../../data/requirement_test_links.json'
import requirementsJson from '../../data/requirements.json'
import suppliersJson from '../../data/suppliers.json'
import testRunsJson from '../../data/test_runs.json'
import testsJson from '../../data/tests.json'
import type { BomLine, CarryoverEvent, CostEstimate, Part, Program, Requirement, RequirementTestLink, Supplier, TestDef, TestRun } from '../domain/types'

export const programs = programsJson as Program[]
export const suppliers = suppliersJson as Supplier[]
export const parts = partsJson as Part[]
export const bomLines = bomLinesJson as BomLine[]
export const requirements = requirementsJson as Requirement[]
export const tests = testsJson as TestDef[]
export const requirementTestLinks = linksJson as RequirementTestLink[]
export const testRuns = testRunsJson as TestRun[]
export const carryoverEvents = carryoverJson as CarryoverEvent[]
export const costEstimates = costJson as CostEstimate[]

/** The active RFQ: Civic Si is the BOM being quoted; LX and Sport are the production evidence sources. */
export const ACTIVE_PROGRAM = 'PGM-CIV-SI'
export const RFQ_ID = 'RFQ-26-0512'

export const programById = Object.fromEntries(programs.map((p) => [p.program_id, p])) as Record<string, Program>
export const supplierById = Object.fromEntries(suppliers.map((s) => [s.supplier_id, s])) as Record<string, Supplier>
export const partById = Object.fromEntries(parts.map((p) => [p.part_id, p])) as Record<string, Part>
export const testById = Object.fromEntries(tests.map((t) => [t.test_id, t])) as Record<string, TestDef>
export const requirementById = Object.fromEntries(requirements.map((r) => [r.req_id, r])) as Record<string, Requirement>
export const linkByReq = Object.fromEntries(requirementTestLinks.map((l) => [l.req_id, l])) as Record<string, RequirementTestLink>
export const eventsByReq = Object.fromEntries(carryoverEvents.map((e) => [e.req_id, e.events])) as Record<string, CarryoverEvent['events']>
export const costByPart = Object.fromEntries(costEstimates.map((c) => [c.part_id, c])) as Record<string, CostEstimate>
export const programShort = (id: string): string => ({ 'PGM-CIV-LX': 'LX', 'PGM-CIV-SPT': 'Sport', 'PGM-CIV-SI': 'Si' } as Record<string, string>)[id] ?? id
