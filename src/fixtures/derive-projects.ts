/**
 * Derive layer for Home and the Projects dashboard. Pure functions over derive.ts (the Civic dataset), no React, no Date.now().
 * Action rows come from the dataset (flagged requirements, dangerous cases, unconfirmed surrogates, Estimated and No match
 * lines, still-open test runs); severity and owner come from the dataset (D-16) with BOM severity from DASHBOARD_RULES.
 */
import type { Tone } from '../domain/types'
import { ACTIVE_PROGRAM, programById, programShort, testRuns, requirements } from './civic'
import { bomRowsForProgram, programsUsing, requirementRows, round2, siBomRows, type BomRow } from './derive'
import { MATCH_TYPE } from './semantics'
import { CIVIC_OUTPUTS, DASHBOARD_RULES, PROGRESS_STEPS, PROJECT_DUE, type OutputDef } from './extras/projects/projectData'

export type Zoom = 'program' | 'part' | 'hw'
export type Metric = 'certainty' | 'price' | 'diversity' | 'timeline'
export type VizForm = 'chart' | 'table' | 'actions'

export const ZOOMS: Array<[Zoom, string]> = [['program', 'Program'], ['part', 'Part'], ['hw', 'HW level']]
export const METRICS: Array<[Metric, string]> = [['certainty', 'Certainty'], ['price', 'Price'], ['diversity', 'Diversity and redundancy'], ['timeline', 'Timeline']]
export const FORMS: Array<[VizForm, string]> = [['chart', 'Chart'], ['table', 'Table'], ['actions', 'Action items']]

/* ------------------------------ Action rows ------------------------------ */

export interface ActionRow {
  id: string
  kind: string
  title: string
  severity: string
  owner: string
  due: string
  dueFrom: string
  impact: string
  status: string
  to: string
  urgent: boolean
  outputIds: string[]
  /** Zoom keys used by the data-viz "Action items" form. */
  program: string
  part: string
  hw: string
  price: number
  lineId?: string
  reqId?: string
}

const money = (n: number): string => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Which outputs each kind of item belongs to. The first is the primary output, whose due date the row inherits. */
const KIND_OUTPUTS: Record<string, string[]> = {
  'dangerous-case': ['carryover-si', 'trace-si', 'plan-si'],
  'open-test': ['trace-si', 'plan-si'],
  'flagged-req': ['mapping-si', 'plan-si'],
  surrogate: ['bom-si'],
  estimated: ['cost-si', 'bom-si'],
  'no-match': ['bom-si', 'cost-si', 'composition-si'],
}
const KIND_TO: Record<string, string> = {
  'dangerous-case': '/create/requirements/06', 'open-test': '/create/requirements/06c', 'flagged-req': '/create/requirements/05',
  surrogate: '/create/bom/03', estimated: '/create/bom/03d', 'no-match': '/create/bom/03',
}

export const outputById = (id: string): OutputDef | undefined => CIVIC_OUTPUTS.find((o) => o.id === id)

/** Resolved ids: bom_line_id or req_id that a decision in the ledger already settled. */
export function deriveActionRows(opts: { resolved?: ReadonlySet<string>; outputId?: string } = {}): ActionRow[] {
  const resolved = opts.resolved ?? new Set<string>()
  const bom = siBomRows()
  const totalCost = bom.reduce((s, r) => s + r.extPrice, 0)
  const rows: ActionRow[] = []
  const owner = programById[ACTIVE_PROGRAM]!.owner

  for (const r of requirementRows()) {
    const kind = r.dangerous ? 'dangerous-case' : r.stillOpen ? 'open-test' : !r.autoAccept ? 'flagged-req' : null
    if (!kind || resolved.has(r.req_id)) continue
    const status = kind === 'dangerous-case' ? 'Text unchanged, driver changed' : kind === 'open-test' ? `Run ${r.siRun?.run_id ?? ''}: ${r.siRun?.result ?? ''}` : `Proposed ${r.test.test_id} at ${r.link.match_confidence ?? 0}%`
    const impact = kind === 'dangerous-case'
      ? `Carried ${r.test.name} result may not hold; blocks plan sign-off.`
      : kind === 'open-test' ? `${r.test.name} has no result yet; blocks plan approval.`
      : `${r.test.test_id} needs a decision before it carries to the plan.`
    rows.push({ id: r.req_id, kind, title: `${r.req_id} ${r.title}`, severity: r.severity, owner: r.owner, due: '', dueFrom: '', impact, status, to: KIND_TO[kind]!, urgent: false, outputIds: KIND_OUTPUTS[kind]!, program: programShort(ACTIVE_PROGRAM), part: r.part?.name ?? r.linked_part_id, hw: r.subsystem, price: 0, reqId: r.req_id })
  }

  for (const l of bom) {
    if (l.match_type === MATCH_TYPE.duplicate || resolved.has(l.bom_line_id)) continue
    const kind = l.match_type === MATCH_TYPE.surrogate ? 'surrogate' : l.match_type === MATCH_TYPE.estimated ? 'estimated' : 'no-match'
    const weak = kind === 'surrogate' && (l.surrogate_match_pct ?? 100) < DASHBOARD_RULES.weakSurrogatePct
    const severity = weak ? DASHBOARD_RULES.bomSeverityByMatchType.estimated! : DASHBOARD_RULES.bomSeverityByMatchType[l.match_type ?? ''] ?? 'Low'
    const share = totalCost ? Math.round((l.extPrice / totalCost) * 1000) / 10 : 0
    const reqs = l.requirementIds.length
    const reqNote = reqs ? `; ${reqs} requirement${reqs > 1 ? 's' : ''} depend on it` : ''
    const impact = kind === 'surrogate'
      ? `${money(l.extPrice)} (${share}% of cost) rests on a ${l.surrogate_match_pct}% match${reqNote}.`
      : kind === 'estimated' ? `${money(l.extPrice)} (${share}% of cost) is a model estimate; needs a quote${reqNote}.`
      : `${money(l.extPrice)} (${share}% of cost) has no usable match${reqNote}.`
    rows.push({ id: l.bom_line_id, kind, title: `${l.name} · ${l.part_id}`, severity, owner, due: '', dueFrom: '', impact, status: kind === 'surrogate' ? `Surrogate ${l.surrogate_match_pct}% · unconfirmed` : l.certainty, to: KIND_TO[kind]!, urgent: false, outputIds: KIND_OUTPUTS[kind]!, program: programShort(ACTIVE_PROGRAM), part: l.name, hw: l.subassembly, price: l.extPrice, lineId: l.bom_line_id })
  }

  const scopeOut = opts.outputId ? outputById(opts.outputId) : undefined
  return rows
    .filter((r) => !opts.outputId || r.outputIds.includes(opts.outputId))
    .map((r) => {
      const out = scopeOut ?? outputById(r.outputIds[0]!)
      return { ...r, due: out?.due ?? PROJECT_DUE, dueFrom: out?.name ?? 'Project', urgent: DASHBOARD_RULES.urgentKinds.includes(r.kind) || DASHBOARD_RULES.urgentSeverities.includes(r.severity) }
    })
}

/** Rank by the severity vocabulary order (best-known first); unknown severities sort last. */
export const severityRank = (order: string[], raw: string): number => { const i = order.indexOf(raw); return i < 0 ? order.length : i }
export const sortBySeverity = (rows: ActionRow[], order: string[]): ActionRow[] =>
  [...rows].sort((a, b) => severityRank(order, a.severity) - severityRank(order, b.severity) || b.price - a.price || a.id.localeCompare(b.id))

/* ------------------------------ Progress and summary ------------------------------ */

export interface Step { id: string; label: string; to: string; done: boolean }
/** Progress derived from what is still open. `decisions` is the ledger map; approve-plan:* means the plan was approved. */
export function progressSteps(rows: ActionRow[], decisions: Record<string, unknown>): Step[] {
  const open = (kinds: string[]) => rows.some((r) => kinds.includes(r.kind))
  const approved = Object.keys(decisions).some((k) => k.startsWith('approve-plan:'))
  const done: Record<string, boolean> = {
    intake: true, tree: true,
    bom: !open(['surrogate', 'estimated', 'no-match']),
    mapping: !open(['flagged-req']),
    carryover: !open(['dangerous-case', 'open-test']),
    approve: approved,
  }
  return PROGRESS_STEPS.map((s) => ({ ...s, done: !!done[s.id] }))
}

export interface ScopeSummary { bomLines: number; requirements: number; tests: number; firstOrderCost: number; openActions: number }
export function scopeSummary(openActions: number): ScopeSummary {
  const bom = siBomRows()
  return { bomLines: bom.length, requirements: requirements.length, tests: new Set(testRuns.filter((t) => t.program_id === ACTIVE_PROGRAM).map((t) => t.test_id)).size, firstOrderCost: round2(bom.reduce((s, r) => s + r.extPrice, 0)), openActions }
}

/* ------------------------------ Data-viz series ------------------------------ */

export interface VizRow { label: string; values: number[]; note?: string; date?: string | null }
export interface VizSeries {
  title: string
  unit: string
  kind: 'stacked' | 'score' | 'timeline'
  keys: string[]
  /** One tone per key; the legend and the segment text carry the meaning, the tone only helps. */
  tones: Tone[]
  /** Scale for score bars. */
  max?: number
  rows: VizRow[]
  /** timeline: min and max date of dated rows. */
  range?: [string, string]
}
export interface VizContext {
  /** Raw certainty values in vocabulary order. */
  certaintyOrder: string[]
  /** Raw test-run results in vocabulary order. */
  resultOrder: string[]
  label: (vocabularyId: string, raw: string) => string
  tone: (vocabularyId: string, raw: string) => Tone
}

const PROGRAMS = ['PGM-CIV-LX', 'PGM-CIV-SPT', 'PGM-CIV-SI']
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

const groupLines = (zoom: Zoom): Array<[string, BomRow[]]> => {
  if (zoom === 'program') return PROGRAMS.map((p) => [programShort(p), bomRowsForProgram(p)])
  const si = siBomRows()
  const subs = [...new Set(si.map((r) => r.subassembly))]
  return subs.map((s) => [s, si.filter((r) => r.subassembly === s)])
}

export function buildSeries(zoom: Zoom, metric: Metric, cx: VizContext): VizSeries {
  const zoomLabel = ZOOMS.find(([z]) => z === zoom)![1]
  const metricLabel = METRICS.find(([m]) => m === metric)![1]
  const title = `${metricLabel} by ${zoomLabel.toLowerCase()}`
  const si = siBomRows()
  const used = (cols: BomRow[][]) => cx.certaintyOrder.filter((c) => cols.some((ls) => ls.some((l) => l.certainty === c)))

  if (zoom === 'part') {
    if (metric === 'certainty') {
      const rows = [...si].filter((l) => l.match_type !== MATCH_TYPE.duplicate).map((l) => ({ l, score: l.surrogate_match_pct ?? 0 })).sort((a, b) => a.score - b.score)
      return { title: 'Certainty by part: lines that are not Actual', unit: 'match percent (0 = no usable match)', kind: 'score', keys: ['Match percent'], tones: ['info'], max: 100, rows: rows.map(({ l, score }) => ({ label: l.name, values: [score], note: cx.label('dataType', l.certainty) })) }
    }
    const top = [...si].sort((a, b) => b.extPrice - a.extPrice).slice(0, 10)
    if (metric === 'price') return { title: 'Price by part: ten largest lines', unit: 'USD per vehicle', kind: 'score', keys: ['Extended price'], tones: ['info'], max: Math.max(...top.map((l) => l.extPrice)), rows: top.map((l) => ({ label: l.name, values: [l.extPrice], note: cx.label('dataType', l.certainty) })) }
    if (metric === 'diversity') return { title: 'Diversity by part: programs using each of the ten largest lines', unit: 'programs using the part (of 3)', kind: 'score', keys: ['Programs using the part'], tones: ['info'], max: 3, rows: top.map((l) => ({ label: l.name, values: [programsUsing(l.part_id).length], note: programsUsing(l.part_id).map(programShort).join(', ') })) }
    const reqs = requirementRows().map((r) => ({ label: `${r.req_id} ${r.test.name}`, values: [1], note: cx.label('testResult', r.siRun?.result ?? ''), date: r.siRun?.date ?? null }))
    const dated = reqs.map((r) => r.date).filter((d): d is string => !!d).sort()
    return { title: 'Timeline by part: Si test runs per requirement', unit: 'run date (no date = not yet run)', kind: 'timeline', keys: ['Test run'], tones: ['info'], rows: reqs, range: [dated[0]!, dated[dated.length - 1]!] }
  }

  if (metric === 'timeline') {
    const groups: Array<[string, string[]]> = zoom === 'program'
      ? PROGRAMS.map((p) => [programShort(p), testRuns.filter((t) => t.program_id === p).map((t) => t.result)])
      : (() => { const subsystems = [...new Set(requirementRows().map((r) => r.subsystem))]; return subsystems.map((s) => [s, requirementRows().filter((r) => r.subsystem === s).map((r) => r.siRun?.result ?? '').filter(Boolean)] as [string, string[]]) })()
    const keys = cx.resultOrder.filter((k) => groups.some(([, rs]) => rs.includes(k)))
    return { title: zoom === 'program' ? 'Timeline by program: test runs by result' : 'Timeline by HW level: Si test runs by result', unit: 'test runs', kind: 'stacked', keys: keys.map((k) => cx.label('testResult', k)), tones: keys.map((k) => cx.tone('testResult', k)), rows: groups.map(([label, rs]) => ({ label, values: keys.map((k) => rs.filter((x) => x === k).length) })) }
  }

  const groups = groupLines(zoom)
  if (metric === 'certainty' || metric === 'price') {
    const keys = used(groups.map(([, ls]) => ls))
    const f = metric === 'price' ? (ls: BomRow[], k: string) => Math.round(sum(ls.filter((l) => l.certainty === k).map((l) => l.extPrice))) : (ls: BomRow[], k: string) => ls.filter((l) => l.certainty === k).length
    return { title, unit: metric === 'price' ? 'USD per vehicle, by certainty' : 'BOM lines, by certainty', kind: 'stacked', keys: keys.map((k) => cx.label('dataType', k)), tones: keys.map((k) => cx.tone('dataType', k)), rows: groups.map(([label, ls]) => ({ label, values: keys.map((k) => f(ls, k)) })) }
  }
  return {
    title, unit: 'BOM lines', kind: 'stacked', keys: ['Shared with another program', 'Used in one program only'], tones: ['info', 'neutral'],
    rows: groups.map(([label, ls]) => { const shared = ls.filter((l) => programsUsing(l.part_id).length > 1).length; return { label, values: [shared, ls.length - shared] } }),
  }
}

/** The "Action items" form of the data-viz slot: the rows that explain the metric, grouped by the zoom level. */
export function vizActions(zoom: Zoom, metric: Metric, rows: ActionRow[]): Array<{ group: string; items: ActionRow[] }> {
  const kinds = metric === 'timeline' ? ['dangerous-case', 'open-test'] : ['surrogate', 'estimated', 'no-match']
  const pick = rows.filter((r) => kinds.includes(r.kind))
  const sorted = metric === 'price' ? [...pick].sort((a, b) => b.price - a.price) : pick
  const key = (r: ActionRow) => (zoom === 'program' ? r.program : zoom === 'part' ? r.part : r.hw)
  const m = new Map<string, ActionRow[]>()
  sorted.forEach((r) => { const k = key(r); m.set(k, [...(m.get(k) ?? []), r]) })
  return [...m].map(([group, items]) => ({ group, items }))
}
