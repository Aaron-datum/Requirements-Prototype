/**
 * The derive layer: view models over the relational Civic dataset (docs/04-fixtures-spec.md section 6).
 * Pure functions, no React, no Date.now(). Other areas add their own files (derive-bom.ts, derive-requirements.ts, ...)
 * rather than editing this one.
 */
import type { BomLine, Part, Requirement, RequirementTestLink, Supplier, TestDef, TestRun } from '../domain/types'
import type { Thresholds } from '../domain/extra'
import {
  ACTIVE_PROGRAM, bomLines, eventsByReq, linkByReq, partById, requirements, supplierById, testById, testRuns,
} from './civic'
import { REQ_STATE, RUN } from './semantics'

/* ------------------------------ BOM view models ------------------------------ */

export interface BomRow extends BomLine { part: Part; supplier: Supplier; name: string; extPrice: number; requirementIds: string[] }

export const siBomRows = (): BomRow[] =>
  bomLines.filter((l) => l.program_id === ACTIVE_PROGRAM).map((l) => {
    const part = partById[l.part_id]!
    return { ...l, part, supplier: supplierById[l.supplier_id]!, name: part.name, extPrice: round2(l.unit_price_usd * l.quantity), requirementIds: requirements.filter((r) => r.linked_part_id === l.part_id).map((r) => r.req_id) }
  })

export const bomRowsForProgram = (programId: string): BomRow[] =>
  bomLines.filter((l) => l.program_id === programId).map((l) => {
    const part = partById[l.part_id]!
    return { ...l, part, supplier: supplierById[l.supplier_id]!, name: part.name, extPrice: round2(l.unit_price_usd * l.quantity), requirementIds: [] }
  })

export const programTotal = (programId: string): number => round2(bomLines.filter((l) => l.program_id === programId).reduce((s, l) => s + l.unit_price_usd * l.quantity, 0))

/** Where a part is used across programs. */
export const programsUsing = (partId: string): string[] => [...new Set(bomLines.filter((l) => l.part_id === partId).map((l) => l.program_id))]

export const subassemblies = (rows: Array<Pick<BomRow, 'subassembly'>>): string[] => [...new Set(rows.map((r) => r.subassembly))]

export interface Kpis {
  firstOrderCost: number
  pricedLines: number
  totalLines: number
  /** Reuse % = lines with certainty in `reuseTypes` over all lines. */
  reusePct: number
  /** Risk = count of lines in `riskTypes` + requirements with severity in `riskSeverities`. */
  risk: number
  riskParts: { lines: number; requirements: number }
  certaintyCounts: Record<string, number>
  formulas: { cost: string; reuse: string; risk: string }
}

/** KPI bar, derived not typed. `reuseTypes` / `riskTypes` are raw data-type values chosen by the caller from config. */
export function bomKpis(rows: BomRow[], opts: { reuseTypes: string[]; riskTypes: string[]; riskSeverities: string[] }): Kpis {
  const priced = rows.filter((r) => r.unit_price_usd > 0)
  const counts: Record<string, number> = {}
  rows.forEach((r) => { counts[r.certainty] = (counts[r.certainty] ?? 0) + 1 })
  const reuse = rows.filter((r) => opts.reuseTypes.includes(r.certainty)).length
  const riskLines = rows.filter((r) => opts.riskTypes.includes(r.certainty)).length
  const riskReqs = requirements.filter((r) => opts.riskSeverities.includes(r.severity)).length
  return {
    firstOrderCost: round2(rows.reduce((s, r) => s + r.extPrice, 0)),
    pricedLines: priced.length, totalLines: rows.length,
    reusePct: rows.length ? Math.round((reuse / rows.length) * 100) : 0,
    risk: riskLines + riskReqs, riskParts: { lines: riskLines, requirements: riskReqs },
    certaintyCounts: counts,
    formulas: {
      cost: 'Sum of unit price × quantity over all priced lines.',
      reuse: `Reuse rate = lines with certainty ${opts.reuseTypes.join(' or ')} ÷ all lines (${reuse} ÷ ${rows.length}).`,
      risk: `Risk = lines with certainty ${opts.riskTypes.join(' or ')} (${riskLines}) + requirements with severity ${opts.riskSeverities.join(' or ')} (${riskReqs}).`,
    },
  }
}

/** Surrogate detail: five bars plus ranked other candidates. null when the line has no computed breakdown. */
export const surrogateDetail = (line: BomLine) => (line.surrogate_breakdown ? { total: line.surrogate_match_pct, breakdown: line.surrogate_breakdown, candidates: line.other_candidates } : null)

/** Si assembly tree generated from subassembly groupings (the dataset has none). Reference-geometry parts are not in the dataset. */
export interface AssemblyNode { id: string; name: string; partId?: string; hasCad?: boolean; children?: AssemblyNode[] }
export function siAssemblyTree(noCadSubassemblies: string[] = ['Electrical & Sensors']): AssemblyNode {
  const rows = siBomRows()
  return {
    id: 'asm-si', name: 'Civic Si 1.5T Engine Assembly',
    children: subassemblies(rows).map((sub) => ({
      id: `asm-${sub.toLowerCase().replace(/\W+/g, '-')}`, name: sub,
      children: rows.filter((r) => r.subassembly === sub).map((r) => ({ id: r.bom_line_id, name: r.name, partId: r.part_id, hasCad: !noCadSubassemblies.includes(sub) })),
    })),
  }
}

/* ------------------------- Requirement view models --------------------------- */

export interface RequirementRow extends Requirement {
  part: Part | undefined
  link: RequirementTestLink
  test: TestDef
  runs: TestRun[]
  siRun: TestRun | undefined
  sourceRun: TestRun | undefined
  /** Si test run still Scheduled or In progress: the requirement is flagged for carryover review. */
  stillOpen: boolean
  dangerous: boolean
  chain: Array<{ date: string; event: string; program_id: string; note: string }>
  autoAccept: boolean
}

export const runsForTest = (testId: string): TestRun[] => testRuns.filter((r) => r.test_id === testId).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))

export function requirementRows(th: Pick<Thresholds, 'autoAcceptAt'> = { autoAcceptAt: 90 }): RequirementRow[] {
  return requirements.map((r) => {
    const link = linkByReq[r.req_id]!
    const test = testById[link.test_id]!
    const runs = runsForTest(test.test_id)
    const siRun = runs.find((x) => x.program_id === ACTIVE_PROGRAM)
    const sourceRun = runs.find((x) => x.program_id !== ACTIVE_PROGRAM && x.result === RUN.pass)
    return {
      ...r, part: partById[r.linked_part_id], link, test, runs, siRun, sourceRun,
      stillOpen: !!siRun && RUN.open.includes(siRun.result),
      // Dangerous case: the text reads Unchanged but what it traces to has Changed. Derived from the two states, not from the flag column.
      dangerous: r.text_status === REQ_STATE.unchanged && r.driven_by_status === REQ_STATE.changed,
      chain: [...(eventsByReq[r.req_id] ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
      autoAccept: r.text_status === REQ_STATE.unchanged && r.driven_by_status === REQ_STATE.unchanged && (link.match_confidence ?? 0) >= th.autoAcceptAt,
    }
  })
}

export const dangerousCases = (rows: RequirementRow[] = requirementRows()): string[] => rows.filter((r) => r.dangerous).map((r) => r.req_id)
export const stillOpenList = (rows: RequirementRow[] = requirementRows()): string[] => rows.filter((r) => r.stillOpen).map((r) => r.req_id)

export const round2 = (n: number): number => Math.round(n * 100) / 100
