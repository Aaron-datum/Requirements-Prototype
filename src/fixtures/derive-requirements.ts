/**
 * Derive layer for requirements and traceability (steps 05 to 07). Pure functions, no React, no Date.now().
 * Builds on derive.ts (requirementRows) and adds: decision state read from the ledger, the per-requirement view model,
 * test candidates, evidence candidates, the carryover buckets, the plan receipt (carried, routed, still open), the impact
 * graph, the event lanes and the Test detail view model. Counts are derived here, never typed.
 */
import type { Thresholds } from '../domain/extra'
import type { TestDef, TestRun } from '../domain/types'
import { ACTIVE_PROGRAM, bomLines, partById, programById, programShort, testById, testRuns, tests as allTests } from './civic'
import { requirementRows, siBomRows, type BomRow, type RequirementRow } from './derive'
import { ALTERNATES_BY_REQ, DEFAULT_OWNER, INTERFACE_BY_REQ, DELTA_BY_REQ, OWNER_BY_CATEGORY, REQUIREMENTS_SCOPE } from './extras/requirements/interfaces'
import { EVIDENCE_RECORDS, toCandidateRows } from './extras/requirements/evidence'
import { PROCEDURES } from './extras/requirements/procedures'
import { EVENT_LANE, INTERFACE_EVENT, LANES, REQUIREMENT_RULES, SCENARIOS, WARN_EVENTS, type Lane } from './extras/requirements/rules'
import type { EvidenceCandidateRow, EvidenceRecord, ImpactFlag, ImpactRole, TestCandidateRow, TestProcedure } from './extras/requirements/types'
import { REQ_STATE, RUN } from './semantics'

/* ------------------------------ raw vocabulary values ------------------------------ */
// Raw dataset values the derive layer reasons about. They are not labels: screens render through vocabularies.
export const CONFORMANCE = { undetermined: 'Undetermined', gap: 'Gap', evaluatedElsewhere: 'Evaluated Elsewhere', noGap: 'No Gap', notApplicable: 'Not Applicable' } as const

/* ------------------------------ decisions (ledger) ------------------------------ */

export const KEYS = {
  map: (reqId: string) => `req-map:${reqId}`,
  test: (reqId: string) => `req-test:${reqId}`,
  carry: (reqId: string) => `req-carry:${reqId}`,
  transfer: (reqId: string) => `req-transfer:${reqId}`,
  iface: (interfaceId: string) => `req-iface:${interfaceId}`,
  flag: (nodeId: string) => `req-flag:${nodeId}`,
  plan: 'req-plan',
  evidence: (recordId: string) => `req-evidence:${recordId}`,
  cand: (reqId: string, recordId: string) => `req-cand:${reqId}:${recordId}`,
  verify: (recordId: string) => `req-verify:${recordId}`,
} as const

export type LedgerDecisions = Record<string, { value: string; at: string; by: string }>
export interface Stamp { at: string; by: string }
export type CarryKind = 'linked' | 'gap'
export type EvidenceProvenance = 'computed' | 'manual' | 'user-supplied'
export interface CarryDecision extends Stamp { kind: CarryKind; recordId?: string; provenance?: EvidenceProvenance }

export interface Decisions {
  mapping: Record<string, Stamp & { state: 'accepted' | 'rejected' }>
  testChoice: Record<string, string>
  carry: Record<string, CarryDecision>
  transfer: Record<string, Stamp>
  iface: Record<string, Stamp>
  flags: Record<string, Stamp & { scenario: string }>
  plan: (Stamp & { planId: string; name: string }) | null
  candidates: Record<string, string[]>
  uploads: EvidenceRecord[]
  verified: Record<string, Stamp>
}

export const emptyDecisions = (): Decisions => ({ mapping: {}, testChoice: {}, carry: {}, transfer: {}, iface: {}, flags: {}, plan: null, candidates: {}, uploads: [], verified: {} })

const parse = <T>(v: string): T | null => { try { return JSON.parse(v) as T } catch { return null } }

/** Read every requirements decision out of the ledger's generic decision map. Unknown keys are ignored. */
export function readDecisions(ledger: LedgerDecisions): Decisions {
  const d = emptyDecisions()
  for (const [key, entry] of Object.entries(ledger)) {
    const i = key.indexOf(':')
    const prefix = i < 0 ? key : key.slice(0, i)
    const rest = i < 0 ? '' : key.slice(i + 1)
    const stamp: Stamp = { at: entry.at, by: entry.by }
    switch (prefix) {
      case 'req-map': { const s = entry.value; if (s === 'accepted' || s === 'rejected') d.mapping[rest] = { ...stamp, state: s }; break }
      case 'req-test': d.testChoice[rest] = entry.value; break
      case 'req-carry': { const v = parse<{ kind: CarryKind; recordId?: string; provenance?: EvidenceProvenance }>(entry.value); if (v) d.carry[rest] = { ...stamp, ...v }; break }
      case 'req-transfer': d.transfer[rest] = stamp; break
      case 'req-iface': d.iface[rest] = stamp; break
      case 'req-flag': d.flags[rest] = { ...stamp, scenario: entry.value }; break
      case 'req-plan': { const v = parse<{ planId: string; name: string }>(entry.value); if (v) d.plan = { ...stamp, ...v }; break }
      case 'req-evidence': { const v = parse<EvidenceRecord>(entry.value); if (v) d.uploads.push(v); break }
      case 'req-cand': { const j = rest.indexOf(':'); const reqId = rest.slice(0, j); (d.candidates[reqId] ??= []).push(rest.slice(j + 1)); break }
      case 'req-verify': d.verified[rest] = stamp; break
      default: break
    }
  }
  d.uploads.sort((a, b) => a.id.localeCompare(b.id))
  return d
}

/* ------------------------------ test candidates (05) ------------------------------ */

/** Reasoning text to bullets: split on semicolons and sentence ends. */
export const toBullets = (text: string): string[] => text.split(/;\s+|\.\s+(?=[A-Z])/).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean)

/**
 * Candidate tests for a requirement: the proposed test from requirement_test_links.json first, then alternates at or above the
 * test-match floor, best first. The proposed test keeps its null confidence when no score exists.
 */
export function testCandidates(req: Pick<RequirementRow, 'req_id' | 'link'>, floor: number): TestCandidateRow[] {
  const primary: TestCandidateRow = { testId: req.link.test_id, confidence: req.link.match_confidence, tags: req.link.why_matched, reasoning: toBullets(req.link.reasoning) }
  const alts = (ALTERNATES_BY_REQ[req.req_id] ?? []).filter((c) => c.confidence != null && c.confidence >= floor).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
  return [primary, ...alts]
}

/* ------------------------------ evidence candidates (06) ------------------------------ */

export interface EvidenceCandidate { record: EvidenceRecord; score: number | null; provenance: EvidenceProvenance }

export const allEvidenceRecords = (d: Decisions): EvidenceRecord[] => [...EVIDENCE_RECORDS, ...d.uploads].map((r) => (d.verified[r.id] ? { ...r, verifiedBy: d.verified[r.id]!.by, verifiedAt: d.verified[r.id]!.at } : r))

/** Ranked evidence for one requirement: computed candidates by score, then records a person added (no score). */
export function evidenceCandidates(reqId: string, d: Decisions, computedRows: EvidenceCandidateRow[] = toCandidateRows(reqId)): EvidenceCandidate[] {
  const records = Object.fromEntries(allEvidenceRecords(d).map((r) => [r.id, r]))
  const computed = computedRows.flatMap((c) => (records[c.recordId] ? [{ record: records[c.recordId]!, score: c.score, provenance: c.provenance } as EvidenceCandidate] : []))
  const added = (d.candidates[reqId] ?? []).filter((id) => !computed.some((c) => c.record.id === id)).flatMap((id) => (records[id] ? [{ record: records[id]!, score: null, provenance: records[id]!.origin === 'user-supplied' ? 'user-supplied' : 'manual' } as EvidenceCandidate] : []))
  return [...computed, ...added]
}

/** Split candidates at the evidence floor. A record a person added has no score and always counts as above. */
export function splitByFloor(cands: EvidenceCandidate[], floor: number): { above: EvidenceCandidate[]; below: EvidenceCandidate[] } {
  const above = cands.filter((c) => c.score == null || c.score >= floor)
  return { above, below: cands.filter((c) => !above.includes(c)) }
}

/* ------------------------------ the per-requirement view model ------------------------------ */

export type MappingState = 'auto' | 'accepted' | 'rejected' | 'proposed'
export type TestStatus = 'has-test' | 'no-test' | 'scope-unclear'
export type Bucket = 'undetermined' | 'evaluated-elsewhere'
export type CarryFlag = 'no-candidates' | 'interface-changed'

export interface ReqView extends RequirementRow {
  bomLine: BomRow | undefined
  interfaceId: string
  interfaceLabel: string
  driven: { state: string; score: number | null; confirmed: Stamp | null }
  delta: string | undefined
  ownerFull: string
  ownerShort: string
  due: string
  hops: number
  ifaceDeltas: number
  /** Carryover bucket for items flagged for review (Si test run still open). null when not flagged. */
  bucket: Bucket | null
  needsMapping: boolean
  mapping: MappingState
  mappingStamp: Stamp | null
  proposedTestId: string
  chosenTestId: string
  chosenConfidence: number | null
  carryDecision: CarryDecision | null
  transferConfirmed: Stamp | null
  /** Flagged for review and no carryover decision yet. */
  openCarry: boolean
  conformance: string
  testStatus: TestStatus
  flags: CarryFlag[]
  /** Standing highlight: text Unchanged and Driven by Changed, until a person confirms the change. By condition, never by selection. */
  rowDanger: boolean
}

export const shortOwner = (owner: string): string => owner.split(' (')[0] ?? owner

export function buildReqViews(th: Pick<Thresholds, 'autoAcceptAt' | 'testMatchFloor' | 'evidenceFloor'>, d: Decisions): ReqView[] {
  const bom = new Map(siBomRows().map((b) => [b.part_id, b]))
  return requirementRows({ autoAcceptAt: th.autoAcceptAt }).map((r): ReqView => {
    const iface = INTERFACE_BY_REQ[r.req_id] ?? { id: `IF-${r.req_id}`, label: r.part?.name ?? r.linked_part_id }
    const confirmed = r.driven_by_status === REQ_STATE.changed ? (d.iface[iface.id] ?? null) : null
    const mappingDecision = d.mapping[r.req_id]
    const chosen = d.testChoice[r.req_id] ?? r.link.test_id
    const cands = testCandidates(r, th.testMatchFloor)
    const chosenConfidence = cands.find((c) => c.testId === chosen)?.confidence ?? null
    const carry = d.carry[r.req_id] ?? null
    const bucket: Bucket | null = r.stillOpen ? ((r.driven_by_confidence ?? -1) < REQUIREMENT_RULES.transferFloor ? 'undetermined' : 'evaluated-elsewhere') : null
    const openCarry = r.stillOpen && !carry
    const mapping: MappingState = r.autoAccept ? 'auto' : (mappingDecision?.state ?? 'proposed')
    const flags: CarryFlag[] = []
    if (r.stillOpen) {
      const strong = evidenceCandidates(r.req_id, d).filter((c) => c.score == null || c.score >= th.evidenceFloor)
      if (bucket === 'undetermined' && strong.length === 0) flags.push('no-candidates')
      if (r.driven_by_status === REQ_STATE.changed) flags.push('interface-changed')
    }
    const conformance = carry?.kind === 'linked' ? CONFORMANCE.noGap
      : carry?.kind === 'gap' ? CONFORMANCE.gap
      : bucket === 'undetermined' ? CONFORMANCE.undetermined
      : bucket === 'evaluated-elsewhere' ? CONFORMANCE.evaluatedElsewhere
      : r.siRun?.result === RUN.carried ? CONFORMANCE.evaluatedElsewhere
      : r.siRun?.result === RUN.pass ? CONFORMANCE.noGap
      : CONFORMANCE.undetermined
    const testStatus: TestStatus = carry?.kind === 'gap' || mapping === 'rejected' ? 'no-test' : openCarry && bucket === 'undetermined' ? 'scope-unclear' : 'has-test'
    const ownerFull = r.owner || OWNER_BY_CATEGORY[r.subsystem] || DEFAULT_OWNER
    return {
      ...r,
      bomLine: bom.get(r.linked_part_id),
      interfaceId: iface.id, interfaceLabel: iface.label,
      driven: { state: r.driven_by_status, score: r.driven_by_confidence, confirmed },
      delta: DELTA_BY_REQ[r.req_id],
      ownerFull, ownerShort: shortOwner(ownerFull), due: REQUIREMENTS_SCOPE.due,
      hops: Math.max(0, r.chain.length - 1),
      ifaceDeltas: r.chain.filter((e) => e.event === INTERFACE_EVENT).length,
      bucket, needsMapping: !r.autoAccept, mapping, mappingStamp: mappingDecision ?? null,
      proposedTestId: r.link.test_id, chosenTestId: chosen, chosenConfidence,
      carryDecision: carry, transferConfirmed: d.transfer[r.req_id] ?? null, openCarry,
      conformance, testStatus, flags,
      // Alert tone only while it is an open action item: accepting or rejecting the mapping (or confirming the driver) clears it.
      rowDanger: r.dangerous && !confirmed && mapping !== 'accepted' && mapping !== 'rejected',
    }
  })
}

/** Requirements whose Driven by is Changed and not yet confirmed, sharing this interface: what "Confirm Changed" applies to. */
export const sharingInterface = (rows: ReqView[], interfaceId: string): ReqView[] => rows.filter((r) => r.interfaceId === interfaceId && r.driven_by_status === REQ_STATE.changed && !r.driven.confirmed)

/* ------------------------------ bulk accept (05) ------------------------------ */

export interface BulkPlan { eligible: ReqView[]; held: { dangerous: ReqView[]; changed: ReqView[]; noScore: ReqView[] } }

/**
 * What "Accept all >= N" would do. It never accepts a requirement whose text is New or Changed (config matchRules.changedRaw), a
 * dangerous case, or a row with no score; the held-back rows are reported so the screen can say so.
 */
export function bulkAcceptPlan(rows: ReqView[], floor: number, changedRaw: string[]): BulkPlan {
  const plan: BulkPlan = { eligible: [], held: { dangerous: [], changed: [], noScore: [] } }
  for (const r of rows) {
    if (!r.needsMapping || r.mapping !== 'proposed') continue
    if (r.chosenConfidence == null) { plan.held.noScore.push(r); continue }
    if (r.chosenConfidence < floor) continue
    if (r.dangerous) plan.held.dangerous.push(r)
    else if (changedRaw.includes(r.text_status)) plan.held.changed.push(r)
    else plan.eligible.push(r)
  }
  return plan
}

/* ------------------------------ carryover review (06) ------------------------------ */

export interface CarryStats { flagged: number; needDecision: number; undetermined: number; evaluatedElsewhere: number; linked: number; gap: number }
export const flaggedRows = (rows: ReqView[]): ReqView[] => rows.filter((r) => r.bucket != null)
export function carryStats(rows: ReqView[]): CarryStats {
  const f = flaggedRows(rows)
  return {
    flagged: f.length,
    needDecision: f.filter((r) => r.openCarry).length,
    undetermined: f.filter((r) => r.openCarry && r.bucket === 'undetermined').length,
    evaluatedElsewhere: f.filter((r) => r.openCarry && r.bucket === 'evaluated-elsewhere').length,
    linked: f.filter((r) => r.carryDecision?.kind === 'linked').length,
    gap: f.filter((r) => r.carryDecision?.kind === 'gap').length,
  }
}

/** Why an Undetermined requirement is Undetermined, in one or two plain sentences. */
export function undeterminedReason(r: ReqView, evidenceFloor: number): string {
  const parts: string[] = []
  if (r.siRun) parts.push(`${r.siRun.run_id} is ${r.siRun.result.toLowerCase()} on ${programShort(r.siRun.program_id)}, so there is no result yet.`)
  if (r.driven_by_confidence == null) parts.push('No transfer score exists: the driving geometry or clause is new.')
  else if (r.driven_by_confidence < REQUIREMENT_RULES.transferFloor) parts.push(`Transfer confidence is ${r.driven_by_confidence}%, below the ${REQUIREMENT_RULES.transferFloor}% needed to treat an earlier result as transferable.`)
  parts.push(`Evidence candidates need to score at least ${evidenceFloor}%.`)
  return parts.join(' ')
}

export interface ChainHop { date: string; event: string; programId: string; program: string; note: string; warn: 'Changed' | 'Unmet' | null }
export const chainHops = (r: Pick<RequirementRow, 'chain'>): ChainHop[] =>
  r.chain.map((e) => ({ date: e.date, event: e.event, programId: e.program_id, program: programShort(e.program_id), note: e.note, warn: WARN_EVENTS[e.event] ?? null }))

/** Programs in the order the requirement passed through them, e.g. LX, Sport, Si. */
export const lineage = (r: Pick<RequirementRow, 'chain'>): string[] => [...new Set(r.chain.map((e) => programShort(e.program_id)))]

/** The earlier-program test run that the carried answer rests on, and the interface change that may invalidate it. */
export function evidenceTrail(r: ReqView): { source: ChainHop | null; interfaceChange: ChainHop | null; predates: boolean } {
  const hops = chainHops(r)
  const source = [...hops].reverse().find((h) => h.programId !== ACTIVE_PROGRAM && h.event === 'Test run') ?? null
  const interfaceChange = [...hops].reverse().find((h) => h.event === INTERFACE_EVENT && h.programId === ACTIVE_PROGRAM) ?? null
  return { source, interfaceChange, predates: !!source && !!interfaceChange && source.date < interfaceChange.date }
}

/* ------------------------------ the plan receipt (07) ------------------------------ */

export type OpenReason = 'evidence' | 'rejected' | 'unreviewed'
export interface PlanSummary {
  total: number
  carried: Array<{ req: ReqView; via: 'auto' | 'evidence' }>
  routed: Array<{ req: ReqView; testId: string; via: 'mapping' | 'gap' }>
  open: Array<{ req: ReqView; reasons: OpenReason[] }>
  tests: Array<{ testId: string; reqs: ReqView[]; partIds: string[] }>
  autoReqs: ReqView[]
  autoTests: number
}

/**
 * Every requirement lands in exactly one of carried, routed or open, so the three counters always add up to the total.
 * Precedence: a carryover decision, then auto-acceptance, then an accepted mapping; anything else is open.
 */
export function planSummary(rows: ReqView[]): PlanSummary {
  const out: PlanSummary = { total: rows.length, carried: [], routed: [], open: [], tests: [], autoReqs: rows.filter((r) => r.mapping === 'auto'), autoTests: 0 }
  for (const r of rows) {
    if (r.carryDecision?.kind === 'linked') out.carried.push({ req: r, via: 'evidence' })
    else if (r.carryDecision?.kind === 'gap') out.routed.push({ req: r, testId: r.chosenTestId, via: 'gap' })
    else if (r.mapping === 'auto') out.carried.push({ req: r, via: 'auto' })
    else if (r.mapping === 'accepted') out.routed.push({ req: r, testId: r.chosenTestId, via: 'mapping' })
    else {
      const reasons: OpenReason[] = []
      if (r.openCarry) reasons.push('evidence')
      if (r.mapping === 'rejected') reasons.push('rejected')
      else if (r.mapping === 'proposed') reasons.push('unreviewed')
      out.open.push({ req: r, reasons })
    }
  }
  const byTest = new Map<string, { testId: string; reqs: ReqView[]; partIds: string[] }>()
  for (const x of out.routed) {
    const t = byTest.get(x.testId) ?? { testId: x.testId, reqs: [], partIds: [] }
    t.reqs.push(x.req)
    if (!t.partIds.includes(x.req.linked_part_id)) t.partIds.push(x.req.linked_part_id)
    byTest.set(x.testId, t)
  }
  out.tests = [...byTest.values()]
  out.autoTests = new Set(out.autoReqs.map((r) => r.chosenTestId)).size
  return out
}

/* ------------------------------ impact graph (06b) ------------------------------ */

export type GraphType = 'REQ' | 'DOC' | 'PRT' | 'TST' | 'PLN'
export interface GraphNode { id: string; type: GraphType }
export interface GraphEdge { from: string; to: string; kind: 'depends-on' | 'donates-evidence'; label: string }
export interface Graph { nodes: Map<string, GraphNode>; edges: GraphEdge[] }

export const planNodeId = (): string => `PLN:${REQUIREMENTS_SCOPE.planId}`
const docsOf = (citation: string): string[] => [...new Set(citation.split(' / ').map((c) => c.trim().split(' ')[0]!).filter(Boolean))]
export const typeOfNode = (id: string): GraphType => (id.startsWith('DOC:') ? 'DOC' : id.startsWith('PRT:') ? 'PRT' : id.startsWith('TST:') ? 'TST' : id.startsWith('PLN:') ? 'PLN' : 'REQ')

const graphCache = new Map<number, Graph>()
/** Adjacency over the dataset: requirements, documents, parts, tests and runs, the plan. Edges point from the upstream node to the dependent one. */
export function buildImpactGraph(evidenceFloor: number): Graph {
  const hit = graphCache.get(evidenceFloor)
  if (hit) return hit
  const rows = requirementRows()
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const seen = new Set<string>()
  const node = (id: string) => { if (!nodes.has(id)) nodes.set(id, { id, type: typeOfNode(id) }) }
  const edge = (from: string, to: string, kind: GraphEdge['kind'], label: string) => {
    const k = `${from}>${to}>${kind}`
    if (seen.has(k)) return
    seen.add(k); node(from); node(to); edges.push({ from, to, kind, label })
  }
  const bom = new Map(siBomRows().map((b) => [b.part_id, b]))
  const plan = planNodeId()
  for (const r of rows) {
    node(r.req_id)
    docsOf(r.citation).forEach((d) => edge(`DOC:${d}`, r.req_id, 'depends-on', 'defines'))
    edge(`PRT:${r.linked_part_id}`, r.req_id, 'depends-on', 'verified on')
    const test = `TST:${r.link.test_id}`
    edge(r.req_id, test, 'depends-on', 'tested by')
    edge(test, plan, 'depends-on', 'in plan')
    r.runs.filter((x) => x.program_id !== ACTIVE_PROGRAM && x.result === RUN.pass).forEach((x) => edge(`TST:${x.run_id}`, r.req_id, 'donates-evidence', 'evidence'))
    toCandidateRows(r.req_id).filter((c) => (c.score ?? 0) >= evidenceFloor).forEach((c) => edge(`TST:${c.recordId}`, r.req_id, 'donates-evidence', 'evidence'))
    allTests.filter((t) => t.test_id === r.link.test_id).forEach((t) => t.req_ids.filter((x) => x !== r.req_id).forEach((x) => edge(test, x, 'depends-on', 'also covers')))
    const cand = bom.get(r.linked_part_id)?.other_candidates[0]
    if (cand) edge(`PRT:${cand.part_id}`, `PRT:${r.linked_part_id}`, 'donates-evidence', 'surrogate for')
  }
  const g = { nodes, edges }
  graphCache.set(evidenceFloor, g)
  return g
}

const TERMINAL: GraphType[] = ['DOC', 'PLN']
export interface Neighborhood { nodes: GraphNode[]; edges: GraphEdge[]; hop: Record<string, number>; side: Record<string, 'self' | 'back' | 'forward'> }

/** Nodes within `hops` of `start`. back follows edges into a node (what it depends on), forward follows edges out of it. DOC and PLN are leaves. */
export function neighborhood(g: Graph, start: string, hops: 1 | 2, direction: 'both' | 'back' | 'forward'): Neighborhood {
  const hop: Record<string, number> = { [start]: 0 }
  const side: Neighborhood['side'] = { [start]: 'self' }
  const used = new Set<GraphEdge>()
  let frontier = [start]
  for (let h = 1; h <= hops; h++) {
    const next: string[] = []
    for (const id of frontier) {
      if (id !== start && TERMINAL.includes(typeOfNode(id))) continue
      for (const e of g.edges) {
        const fwd = e.from === id && direction !== 'back'
        const back = e.to === id && direction !== 'forward'
        if (!fwd && !back) continue
        const other = fwd ? e.to : e.from
        if (other === start) continue
        used.add(e)
        if (hop[other] == null) { hop[other] = h; side[other] = id === start ? (fwd ? 'forward' : 'back') : side[id]!; next.push(other) }
      }
    }
    frontier = next
  }
  const ids = Object.keys(hop)
  const edges = g.edges.filter((e) => ids.includes(e.from) && ids.includes(e.to) && (direction === 'both' ? true : used.has(e)))
  return { nodes: ids.map((id) => ({ id, type: typeOfNode(id) })), edges, hop, side }
}

/** Hop distance and side (back or forward of the anchor) for a set of nodes and edges returned by the impact-graph service. */
export function annotate(start: string, edges: Array<{ from: string; to: string }>): Pick<Neighborhood, 'hop' | 'side'> {
  const hop: Record<string, number> = { [start]: 0 }
  const side: Neighborhood['side'] = { [start]: 'self' }
  let frontier = [start]
  for (let h = 1; frontier.length; h++) {
    const next: string[] = []
    for (const id of frontier) {
      if (id !== start && TERMINAL.includes(typeOfNode(id))) continue
      for (const e of edges) {
        const fwd = e.from === id
        const back = e.to === id
        if (!fwd && !back) continue
        const other = fwd ? e.to : e.from
        if (hop[other] == null) { hop[other] = h; side[other] = id === start ? (fwd ? 'forward' : 'back') : side[id]!; next.push(other) }
      }
    }
    frontier = next
  }
  return { hop, side }
}

export interface NodeInfo { id: string; type: GraphType; label: string; sub: string; programs: string[]; role?: ImpactRole }

/** Display facts for a graph node, from the dataset (labels and programs are never stored on the graph). */
export function describeNode(id: string, rows: Array<Pick<RequirementRow, 'req_id' | 'title' | 'linked_part_id'>> = requirementRows()): NodeInfo {
  const type = typeOfNode(id)
  const si = programShort(ACTIVE_PROGRAM)
  if (type === 'REQ') { const r = rows.find((x) => x.req_id === id); return { id, type, label: r?.title ?? id, sub: `${id} · ${r?.linked_part_id ?? ''}`, programs: [si] } }
  const raw = id.slice(4)
  if (type === 'DOC') return { id, type, label: raw, sub: 'Source document', programs: [si] }
  if (type === 'PRT') {
    const used = [...new Set(bomLines.filter((l) => l.part_id === raw).map((l) => programShort(l.program_id)))]
    return { id, type, label: partById[raw]?.name ?? raw, sub: `${raw} · ${used.join(', ') || 'no program'}`, programs: used }
  }
  if (type === 'PLN') return { id, type, label: raw, sub: REQUIREMENTS_SCOPE.gate, programs: [si] }
  const test = testById[raw]
  if (test) return { id, type, label: test.name, sub: `${raw} · ${test.standard}`, programs: [si] }
  const run = runById(raw)
  if (run) return { id, type, label: `Run ${raw}`, sub: `${programShort(run.program_id)} · ${run.date ?? 'not run'} · ${run.result}`, programs: [programShort(run.program_id)] }
  const rec = EVIDENCE_RECORDS.find((x) => x.id === raw)
  if (rec) return { id, type, label: rec.title, sub: `${rec.id} · ${rec.programLabel} · ${rec.date ?? ''}`, programs: [rec.programLabel] }
  return { id, type, label: raw, sub: '', programs: [] }
}

const runById = (id: string): TestRun | undefined => testRuns.find((r) => r.run_id === id)

/** Role of a node relative to the anchor requirement. Drives the scenario rules. */
export function roleOf(anchor: Pick<RequirementRow, 'req_id' | 'linked_part_id' | 'link'>, nodeId: string, rows: Array<Pick<RequirementRow, 'req_id' | 'linked_part_id' | 'link'>>): ImpactRole | null {
  const type = typeOfNode(nodeId)
  if (nodeId === anchor.req_id) return null
  if (type === 'DOC') return 'doc'
  if (type === 'PLN') return 'plan'
  if (type === 'PRT') return nodeId === `PRT:${anchor.linked_part_id}` ? 'anchor-part' : 'surrogate-part'
  if (type === 'TST') return nodeId === `TST:${anchor.link.test_id}` ? 'linked-test' : 'donor-evidence'
  const other = rows.find((r) => r.req_id === nodeId)
  if (other && other.link.test_id === anchor.link.test_id) return 'sibling-by-test'
  if (other && other.linked_part_id === anchor.linked_part_id) return 'sibling-by-part'
  return 'sibling-by-test'
}

export interface Affected { id: string; flag: ImpactFlag; reason: string; role: ImpactRole; hop: number; programs: string[] }

/** The "Affected downstream" list for a scenario: each visible node whose role has a rule gets a flag and a reason. */
export function affectedBy(scenarioId: string, anchor: ReqView, hood: Neighborhood, rows: ReqView[]): Affected[] {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!
  const out: Affected[] = []
  for (const n of hood.nodes) {
    const role = roleOf(anchor, n.id, rows)
    if (!role) continue
    const rule = scenario.rules.find((x) => x.role === role)
    if (!rule) continue
    const hop = hood.hop[n.id] ?? 1
    out.push({ id: n.id, flag: rule.flag, reason: hop >= 2 && rule.flag === 'check' ? `Two hops out. ${rule.reason}` : rule.reason, role, hop, programs: describeNode(n.id, rows).programs })
  }
  return out.sort((a, b) => (a.flag === b.flag ? a.id.localeCompare(b.id) : a.flag === 're-review' ? -1 : 1))
}

/* ------------------------------ event lanes (03c) ------------------------------ */

export interface LaneEvent { id: string; lane: Lane; date: string; programId: string; program: string; title: string; detail: string; warn: 'Changed' | 'Unmet' | null; thisRfq: boolean }
export const laneEventsFor = (r: Pick<RequirementRow, 'req_id' | 'chain'>): LaneEvent[] =>
  [...r.chain].sort((a, b) => a.date.localeCompare(b.date)).map((e, i) => ({
    id: `${r.req_id}-${i}`, lane: EVENT_LANE[e.event] ?? LANES[0]!, date: e.date, programId: e.program_id, program: programShort(e.program_id),
    title: e.event, detail: e.note, warn: WARN_EVENTS[e.event] ?? null, thisRfq: e.program_id === ACTIVE_PROGRAM,
  }))
/** Edges between consecutive visible events: solid within a program, dashed across programs. */
export const laneEdges = (events: LaneEvent[]): Array<{ from: string; to: string; sameProgram: boolean }> =>
  events.slice(1).map((e, i) => ({ from: events[i]!.id, to: e.id, sameProgram: events[i]!.programId === e.programId }))

/* ------------------------------ Test detail ------------------------------ */

export type RefState = 'alternate' | 'accepted' | 'rejected' | 'proposed' | 'evidence' | 'ran'
export interface TestDetail {
  test: TestDef
  procedure: TestProcedure | undefined
  runs: Array<{ run: TestRun; programName: string; partId: string }>
  last: TestRun | undefined
  referencedBy: Array<{ req: ReqView; state: RefState }>
  programCount: number
}

export function testDetail(testId: string, rows: ReqView[], d: Decisions, floor: number): TestDetail | null {
  const test = testById[testId]
  if (!test) return null
  const runs = [...rows.find((r) => r.link.test_id === testId)?.runs ?? []].sort((a, b) => (b.date ?? '9999').localeCompare(a.date ?? '9999') || b.run_id.localeCompare(a.run_id))
  const partFor = (programId: string): string => {
    const r = rows.find((x) => x.link.test_id === testId)
    if (!r) return ''
    if (programId === ACTIVE_PROGRAM) return r.linked_part_id
    return r.bomLine?.other_candidates.find((c) => c.program_id === programId)?.part_id ?? r.linked_part_id
  }
  const primary = rows.filter((r) => test.req_ids.includes(r.req_id)).map((req): { req: ReqView; state: RefState } => {
    const evidenceHere = req.carryDecision?.kind === 'linked' && allEvidenceRecords(d).find((x) => x.id === req.carryDecision?.recordId)?.testId === testId
    const state: RefState = req.chosenTestId !== testId ? 'alternate'
      : evidenceHere ? 'evidence'
      : req.mapping === 'accepted' || req.mapping === 'auto' ? 'accepted'
      : req.mapping === 'rejected' ? 'rejected'
      : req.siRun?.result === RUN.pass ? 'ran'
      : 'proposed'
    return { req, state }
  })
  const alternates = rows.filter((r) => !test.req_ids.includes(r.req_id) && testCandidates(r, floor).some((c) => c.testId === testId && c.testId !== r.link.test_id))
    .map((req): { req: ReqView; state: RefState } => ({ req, state: req.chosenTestId === testId ? 'accepted' : 'alternate' }))
  const dated = runs.filter((x) => x.date && x.result !== RUN.carried)
  return {
    test, procedure: PROCEDURES[testId], runs: runs.map((run) => ({ run, programName: programById[run.program_id]?.name ?? run.program_id, partId: partFor(run.program_id) })),
    last: dated[0], referencedBy: [...primary, ...alternates], programCount: new Set(runs.map((x) => x.program_id)).size,
  }
}

/** Human-readable summary of how a run reads: result raw value plus sample count. */
export const runNote = (run: TestRun): string => (run.samples ? `${run.samples} samples` : '')
