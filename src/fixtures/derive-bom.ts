/**
 * BOM and cost view models over the Civic dataset (Phase 5). Pure functions: no React, no Date.now(), no Math.random().
 * Extends the derive layer (derive.ts) without editing it. Fake data that the dataset lacks lives in extras/bom/.
 *
 * What is simulated here (and where the screens mark it): the intake package (doc-extraction), the assembly tree and CAD flags
 * (cad-parser), candidate lists and breakdowns for lines the dataset does not describe (matching-engine), the six canonical
 * cost lines and their trace inputs (cost-model), and sourcing alternates (cost-model).
 */
import type { MatchQuality, Part, RfqFile, Supplier, SurrogateBreakdown, TraceInput } from '../domain/types'
import { ACTIVE_PROGRAM, bomLines, costByPart, partById, programById, programShort, requirements, supplierById, suppliers } from './civic'
import { bomKpis, programsUsing, round2, siBomRows, type BomRow } from './derive'
import costJson from './extras/bom/costExtras.json'
import intakeJson from './extras/bom/intake.json'
import {
  CEILING_CAP, COST_LINES, CONFIRMED_AS, DECAY_PTS_PER_MONTH, ESTIMATED_RAW, EXTRACTED_REQUIREMENTS_FULL, FAILED_RAW, NO_CAD_CAP, NO_MATCH_RAW, PRICE_DATE,
  QUOTE_SOURCE_RAW, REGION_LOGISTICS, SOURCES, SURROGATE_RAW, TIER_ORDER, modelFamily, rangePctFor, regionKey, toolingFor,
  type CostLineKey, type CostParams, type ModelFamily,
} from './extras/bom/rules'
import { SIMILARITY_DIMENSIONS } from './semantics'
import { hashInt, hashSeed, mulberry32 } from './rng'

/* ================================ 01 Intake ================================ */

export type RouteId = 'cad-bom' | 'requirements' | 'columns' | 'kept'
/** Clicking a Routed-to pill cycles through these (docs/01: CAD → BOM, Requirements, Columns, Kept on file). */
export const ROUTE_CYCLE: RouteId[] = ['cad-bom', 'requirements', 'columns', 'kept']
export const nextRoute = (r: string): RouteId => ROUTE_CYCLE[(ROUTE_CYCLE.indexOf(r as RouteId) + 1) % ROUTE_CYCLE.length]!

export interface PackageFile extends RfqFile {
  id: string
  kind: 'cad-assembly' | 'cad-reference' | 'document' | 'bom-template' | 'other'
  subassemblies?: number; parts?: number; referenceBodies?: number; testDefinitions?: number; columns?: number
}
interface IntakeJson {
  rfqId: string; title: string; received: string; due: string; builtOff: string; files: PackageFile[]
  requirementCounts: { inScopeAtFullExtract: number; olderDocuments: number }
  templateColumns: { matched: Array<{ header: string; key: string }>; toConfirm: Array<{ header: string; suggestedKey: string; note: string }>; custom: Array<{ header: string; values: string[] }> }
  referenceBodies: Array<{ id: string; name: string; subassembly: string }>
  failedLineId: string; searchFailedReason: string
}
export const INTAKE = intakeJson as unknown as IntakeJson
export const intakePackage = (): PackageFile[] => INTAKE.files.map((f) => ({ ...f }))
export const INTAKE_META = { rfqId: INTAKE.rfqId, title: INTAKE.title, received: INTAKE.received, due: INTAKE.due, builtOff: INTAKE.builtOff }

export type RouteMap = Record<string, RouteId>
const routeOf = (f: PackageFile, routes: RouteMap): RouteId => routes[f.id] ?? (f.route as RouteId)
export const routedFiles = (routes: RouteMap = {}) => INTAKE.files.map((f) => ({ file: f, route: routeOf(f, routes) }))

export interface TrackCounts {
  cad: { files: number; subassemblies: number; parts: number; referenceBodies: number }
  docs: { documents: number; requirements: number; testDefinitions: number }
  template: { routed: boolean; total: number; matched: number; toConfirm: number; custom: number }
  assemblyRouted: boolean
  kept: number
}
/** Track counts recompute whenever a route changes (docs/01: intake). */
export function trackCounts(routes: RouteMap = {}): TrackCounts {
  const rf = routedFiles(routes)
  const on = (r: RouteId) => rf.filter((x) => x.route === r).map((x) => x.file)
  const cad = on('cad-bom'), docs = on('requirements'), tpl = on('columns').filter((f) => f.kind === 'bom-template')
  const t = INTAKE.templateColumns
  return {
    cad: { files: cad.length, subassemblies: sum(cad, (f) => f.subassemblies ?? 0), parts: sum(cad, (f) => f.parts ?? 0), referenceBodies: sum(cad, (f) => f.referenceBodies ?? 0) },
    docs: { documents: docs.length, requirements: sum(docs, (f) => f.requirementCount ?? 0), testDefinitions: sum(docs, (f) => f.testDefinitions ?? 0) },
    template: { routed: tpl.length > 0, total: tpl.length ? t.matched.length + t.toConfirm.length + t.custom.length : 0, matched: tpl.length ? t.matched.length : 0, toConfirm: tpl.length ? t.toConfirm.length : 0, custom: tpl.length ? t.custom.length : 0 },
    assemblyRouted: cad.some((f) => f.kind === 'cad-assembly'),
    kept: on('kept').length,
  }
}

/** D-09: extracted vs in scope for this BOM (the reduction is scoping to the parts in the BOM). The 571 is the older document set. */
export function requirementScope(routes: RouteMap = {}) {
  const extracted = trackCounts(routes).docs.requirements
  const inScope = Math.round((extracted * INTAKE.requirementCounts.inScopeAtFullExtract) / EXTRACTED_REQUIREMENTS_FULL)
  const traced = requirements.length
  return { extracted, inScope, traced, olderDocuments: INTAKE.requirementCounts.olderDocuments }
}

export const templateColumns = () => INTAKE.templateColumns
/** Custom and confirmed template columns shown in BOM review. Values are illustrative (template column mapping is a stub). */
export function templateColumnValue(columnHeader: string, rowId: string): string {
  const custom = INTAKE.templateColumns.custom.find((c) => c.header === columnHeader)
  if (custom) return custom.values[hashInt(`${columnHeader}:${rowId}`, 0, custom.values.length - 1)]!
  return `T-${hashInt(`${columnHeader}:${rowId}`, 100, 999)}`
}

/* ============================== 02 Assembly tree ============================ */

export interface TreeRow { id: string; name: string; partNumber: string; subassembly: string; kind: 'part' | 'reference' | 'manual'; bomLineId: string | null; baseHasCad: boolean; quantity: number }
export interface ManualLine { id: string; name: string; partNumber: string; subassembly: string; quantity: number }
export interface TreeState { included: Record<string, boolean>; manual: ManualLine[]; cadAttached: Record<string, boolean> }
export const emptyTreeState = (): TreeState => ({ included: {}, manual: [], cadAttached: {} })

const datasetRows = siBomRows()
export const SUBASSEMBLY_ORDER: string[] = [...new Set(datasetRows.map((r) => r.subassembly))]

/** All parsed parts: the 56 dataset lines (Has CAD) plus the two reference bodies (excluded automatically). */
export function parsedParts(): TreeRow[] {
  return SUBASSEMBLY_ORDER.flatMap((sub) => [
    ...datasetRows.filter((r) => r.subassembly === sub).map((r): TreeRow => ({ id: r.bom_line_id, name: r.name, partNumber: r.part_id, subassembly: sub, kind: 'part', bomLineId: r.bom_line_id, baseHasCad: true, quantity: r.quantity })),
    ...INTAKE.referenceBodies.filter((b) => b.subassembly === sub).map((b): TreeRow => ({ id: b.id, name: b.name, partNumber: b.id, subassembly: sub, kind: 'reference', bomLineId: null, baseHasCad: false, quantity: 1 })),
  ])
}
export const isIncluded = (r: TreeRow, s: TreeState): boolean => (r.kind === 'manual' ? true : s.included[r.id] ?? r.kind === 'part')
export const hasCadFlag = (r: TreeRow, s: TreeState): boolean => r.baseHasCad || !!s.cadAttached[r.id]

export function treeGroups(s: TreeState): Array<{ name: string; rows: TreeRow[] }> {
  const parts = parsedParts()
  const manual: TreeRow[] = s.manual.map((m) => ({ id: m.id, name: m.name, partNumber: m.partNumber, subassembly: m.subassembly, kind: 'manual', bomLineId: null, baseHasCad: false, quantity: m.quantity }))
  return SUBASSEMBLY_ORDER.map((name) => ({ name, rows: [...parts.filter((p) => p.subassembly === name), ...manual.filter((m) => m.subassembly === name)] }))
}

export interface TreeSummary { lines: number; parts: number; selected: number; excludedByYou: number; referenceExcluded: number; referenceIncluded: number; manual: number; noCad: number; subassemblies: number }
export function treeSummary(s: TreeState): TreeSummary {
  const parts = parsedParts()
  const real = parts.filter((p) => p.kind === 'part'), refs = parts.filter((p) => p.kind === 'reference')
  const selected = real.filter((p) => isIncluded(p, s)).length
  const referenceIncluded = refs.filter((p) => isIncluded(p, s)).length
  const all = treeGroups(s).flatMap((g) => g.rows).filter((r) => isIncluded(r, s))
  return {
    lines: selected + referenceIncluded + s.manual.length, parts: parts.length, selected, excludedByYou: real.length - selected,
    referenceExcluded: refs.length - referenceIncluded, referenceIncluded, manual: s.manual.length, noCad: all.filter((r) => !hasCadFlag(r, s)).length, subassemblies: SUBASSEMBLY_ORDER.length,
  }
}

/* ============================ Matching (stub logic) ========================= */

const DIM_KEYS = SIMILARITY_DIMENSIONS.map((d) => d.key)
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)))
const FULL: SurrogateBreakdown = { geometry: 100, manufacture_complexity: 100, material: 100, supplier_location: 100, order_of_magnitude: 100 }

/** Hash-seeded five-metric breakdown around a total. The total sits below the mean of the five (D-20: weighting undefined, fixture totals win). */
export function seededBreakdown(seed: string, total: number): SurrogateBreakdown {
  const rng = mulberry32(`breakdown:${seed}`)
  const mean = total / 0.93
  const raw = DIM_KEYS.map((_, i) => clamp(mean + (rng() - 0.5) * 36 + (i === 2 || i === 3 ? 14 : 0)))
  return Object.fromEntries(DIM_KEYS.map((k, i) => [k, raw[i]!])) as unknown as SurrogateBreakdown
}

export interface Candidate { partId: string; programId: string; matchPct: number; breakdown: SurrogateBreakdown }
const siLineByPart = (partId: string) => datasetRows.find((r) => r.part_id === partId)
const productionLine = (partId: string) => bomLines.find((l) => l.part_id === partId && l.program_id !== ACTIVE_PROGRAM)
const productionProgram = (partId: string): string => productionLine(partId)?.program_id ?? 'PGM-CIV-LX'

/**
 * Ranked candidates for a part: the dataset's `other_candidates` and `surrogate_breakdown` where they exist, a literal duplicate for
 * carried-over lines, hash-seeded production parts of the same subsystem otherwise. Same input, same ranking.
 */
export function candidatesFor(part: { part_id: string; subsystem: string }, limit = 5): Candidate[] {
  const si = siLineByPart(part.part_id)
  if (si) {
    if (si.other_candidates.length) {
      return si.other_candidates.slice(0, limit).map((c, i) => ({ partId: c.part_id, programId: c.program_id, matchPct: c.match_pct, breakdown: i === 0 && si.surrogate_breakdown ? si.surrogate_breakdown : seededBreakdown(`${part.part_id}>${c.part_id}`, c.match_pct) }))
    }
    if (si.match_type === 'duplicate') return [{ partId: part.part_id, programId: productionProgram(part.part_id), matchPct: 100, breakdown: { ...FULL } }]
    return []
  }
  const rng = mulberry32(`cands:${part.part_id}`)
  const pool = [...new Set(bomLines.filter((l) => l.program_id !== ACTIVE_PROGRAM && partById[l.part_id]?.subsystem === part.subsystem).map((l) => l.part_id))].filter((id) => id !== part.part_id)
  const picked = pool.map((id) => ({ id, s: rng() })).sort((a, b) => b.s - a.s).slice(0, Math.max(1, limit))
  const pcts = picked.map(() => hashInt(`${part.part_id}:${rng()}`, 52, 92)).sort((a, b) => b - a)
  return picked.map((p, i) => ({ partId: p.id, programId: productionProgram(p.id), matchPct: pcts[i]!, breakdown: seededBreakdown(`${part.part_id}>${p.id}`, pcts[i]!) }))
}

/** Pair score for any two part ids. Uses the dataset where it describes the pair, hash-seeded otherwise. */
export function pairSimilarity(a: string, b: string): { matchPct: number; breakdown: SurrogateBreakdown } {
  if (a === b) return { matchPct: 100, breakdown: { ...FULL } }
  const hit = (x: string, y: string) => {
    const si = siLineByPart(x)
    const i = si?.other_candidates.findIndex((c) => c.part_id === y) ?? -1
    if (si && i >= 0) { const c = si.other_candidates[i]!; return { matchPct: c.match_pct, breakdown: i === 0 && si.surrogate_breakdown ? si.surrogate_breakdown : seededBreakdown(`${x}>${y}`, c.match_pct) } }
    return null
  }
  const known = hit(a, b) ?? hit(b, a)
  if (known) return known
  const same = (partById[a]?.subsystem ?? 'a') === (partById[b]?.subsystem ?? 'b')
  const pct = same ? hashInt(`pair:${[a, b].sort().join('|')}`, 46, 88) : hashInt(`pair:${[a, b].sort().join('|')}`, 18, 44)
  return { matchPct: pct, breakdown: seededBreakdown([a, b].sort().join('>'), pct) }
}

/* ============================== 03 BOM review ============================== */

export type LineMode = 'pending' | 'carry' | 'propose' | 'estimate' | 'unresolved'
/** What kind of row this is, decided by the autonomy gate and config (never by comparing a status string in a screen). */
export function lineMode(certainty: string, decide: (c: string) => 'carry-forward' | 'propose' | 'ask-human', noSimilarityTypes: string[]): LineMode {
  if (!certainty) return 'pending'
  if (noSimilarityTypes.includes(certainty)) return 'unresolved'
  const d = decide(certainty)
  return d === 'carry-forward' ? 'carry' : d === 'propose' ? 'propose' : 'estimate'
}

export interface BomViewRow {
  id: string
  origin: 'dataset' | 'manual' | 'reference'
  base: BomRow | null
  part: Part
  supplierRec: Supplier
  name: string; partNumber: string; quantity: number; subassembly: string
  state: 'pending' | 'ready' | 'failed'
  certainty: string
  matchPct: number | null
  breakdown: SurrogateBreakdown | null
  similarTo: { partId: string; programId: string } | null
  candidates: Candidate[]
  confirmed: boolean; confirmedBy?: string; confirmedAt?: string
  /** The chosen surrogate is not the engine's top candidate (picked in the Search area or by hand): provenance is manual. */
  manualMatch: boolean
  unitPrice: number | null
  extPrice: number
  priceSource: string; currency: string
  supplier: string; region: string; method: string; material: string; tooling: string; cx: string
  leadWeeks: number; weightKg: number; hasCad: boolean
  requirementIds: string[]
  provenance: string; carryNote: string | null; matchType: BomRow['match_type']
  capped: boolean
}

export interface BomContext {
  tree: TreeState
  assemblyRouted: boolean
  searched: boolean
  failedRetried: boolean
  decisionFor: (lineId: string) => { value: string; at: string; by: string } | undefined
  thresholds: { surrogateFloor: number; estimatedFloor: number }
}

/** Cap a tier at NO_CAD_CAP when the line has no CAD (docs/01: "No CAD caps certainty at Estimated"). */
export function capTier(tier: string, hasCad: boolean): string {
  if (hasCad) return tier
  const rank = (t: string) => { const i = TIER_ORDER.indexOf(t as (typeof TIER_ORDER)[number]); return i < 0 ? TIER_ORDER.length : i }
  return rank(tier) < rank(NO_CAD_CAP) ? NO_CAD_CAP : tier
}

const NO_SUPPLIER: Supplier = { supplier_id: 'SUP-TBD', name: 'To be sourced', region: '—', category: '—' }

function synthPart(id: string, name: string, subassembly: string): Part {
  return { part_id: id, name, subsystem: subassembly, material: 'To be defined', manufacture_method: 'To be defined', complexity: 'Med', weight_kg: round2(0.3 + (hashSeed(id) % 40) / 10), base_price_usd: 0, lead_time_wk: 8 + (hashSeed(id) % 6), supplier_id: NO_SUPPLIER.supplier_id }
}

function tierFor(pct: number, th: BomContext['thresholds']): string {
  return pct >= th.surrogateFloor ? SURROGATE_RAW : pct >= th.estimatedFloor ? ESTIMATED_RAW : NO_MATCH_RAW
}

/** Everything BOM review shows, derived from the dataset plus the user's state (tree, search, decisions). */
export function buildBomRows(ctx: BomContext): BomViewRow[] {
  if (!ctx.assemblyRouted) return []
  const rows: BomViewRow[] = []
  for (const g of treeGroups(ctx.tree)) {
    for (const t of g.rows) {
      if (!isIncluded(t, ctx.tree)) continue
      rows.push(t.kind === 'part' ? datasetRow(t, ctx) : synthRow(t, ctx))
    }
  }
  return rows
}

function datasetRow(t: TreeRow, ctx: BomContext): BomViewRow {
  const base = datasetRows.find((r) => r.bom_line_id === t.bomLineId)!
  const part = base.part
  const cands = candidatesFor(part, 5)
  const decision = ctx.decisionFor(base.bom_line_id)
  const failed = ctx.searched && !ctx.failedRetried && base.bom_line_id === INTAKE.failedLineId && !decision
  const common = {
    id: base.bom_line_id, origin: 'dataset' as const, base, part, supplierRec: base.supplier, name: base.name, partNumber: base.part_id, quantity: base.quantity, subassembly: base.subassembly,
    method: part.manufacture_method, material: part.material, tooling: toolingFor(part.manufacture_method), cx: part.complexity, leadWeeks: part.lead_time_wk, weightKg: part.weight_kg, hasCad: true,
    requirementIds: base.requirementIds, carryNote: base.carry_note, matchType: base.match_type, candidates: cands, capped: false,
  }
  if (!ctx.searched) {
    return { ...common, state: 'pending', certainty: '', matchPct: null, breakdown: null, similarTo: null, confirmed: false, manualMatch: false, unitPrice: null, extPrice: 0, priceSource: '', currency: '', supplier: '', region: '', provenance: 'Search not run', }
  }
  if (decision) {
    const top = cands[0]
    const pair = pairSimilarity(base.part_id, decision.value)
    const prod = productionLine(decision.value)
    const manualMatch = !top || top.partId !== decision.value
    const unitPrice = manualMatch && prod ? prod.unit_price_usd : base.unit_price_usd
    return {
      ...common, state: 'ready', certainty: CONFIRMED_AS, matchPct: pair.matchPct, breakdown: manualMatch ? pair.breakdown : top!.breakdown, similarTo: { partId: decision.value, programId: productionProgram(decision.value) },
      confirmed: true, confirmedBy: decision.by, confirmedAt: decision.at, manualMatch, unitPrice, extPrice: round2(unitPrice * base.quantity),
      priceSource: base.price_source, currency: base.currency, supplier: base.supplier.name, region: base.region,
      provenance: manualMatch ? `Confirmed surrogate (manual) — ${decision.value}` : base.provenance,
    }
  }
  if (failed) {
    return { ...common, state: 'failed', certainty: FAILED_RAW, matchPct: null, breakdown: null, similarTo: null, confirmed: false, manualMatch: false, unitPrice: null, extPrice: 0, priceSource: '', currency: base.currency, supplier: base.supplier.name, region: base.region, provenance: INTAKE.searchFailedReason }
  }
  const top = cands[0]
  return {
    ...common, state: 'ready', certainty: base.certainty, matchPct: base.surrogate_match_pct, breakdown: base.surrogate_breakdown, similarTo: top ? { partId: top.partId, programId: top.programId } : null,
    confirmed: false, manualMatch: false, unitPrice: base.unit_price_usd, extPrice: base.extPrice, priceSource: base.price_source, currency: base.currency, supplier: base.supplier.name, region: base.region, provenance: base.provenance,
  }
}

function synthRow(t: TreeRow, ctx: BomContext): BomViewRow {
  const hasCad = hasCadFlag(t, ctx.tree)
  const part = synthPart(t.partNumber, t.name, t.subassembly)
  const decision = ctx.decisionFor(t.id)
  const cands = candidatesFor({ part_id: `${t.partNumber}${hasCad ? ':cad' : ''}`, subsystem: t.subassembly }, 3)
  const top = cands[0]
  const common = {
    id: t.id, origin: t.kind === 'manual' ? 'manual' as const : 'reference' as const, base: null, part, supplierRec: NO_SUPPLIER, name: t.name, partNumber: t.partNumber, quantity: t.quantity, subassembly: t.subassembly,
    method: 'To be defined', material: 'To be defined', tooling: '—', cx: part.complexity, leadWeeks: part.lead_time_wk, weightKg: part.weight_kg, hasCad, requirementIds: [], carryNote: null, matchType: null, candidates: cands,
  }
  if (!ctx.searched) return { ...common, state: 'pending', certainty: '', matchPct: null, breakdown: null, similarTo: null, confirmed: false, manualMatch: false, unitPrice: null, extPrice: 0, priceSource: '', currency: '', supplier: '', region: '', provenance: 'Search not run', capped: false }
  const unit = round2(18 + (hashSeed(`price:${t.id}`) % 7800) / 100)
  const rawTier = top ? tierFor(top.matchPct, ctx.thresholds) : NO_MATCH_RAW
  const tier = capTier(decision ? CONFIRMED_AS : rawTier, hasCad)
  const capped = tier !== rawTier && !decision
  const pair = decision ? pairSimilarity(part.part_id, decision.value) : null
  return {
    ...common, state: 'ready', certainty: tier, matchPct: pair?.matchPct ?? top?.matchPct ?? null, breakdown: pair?.breakdown ?? top?.breakdown ?? null,
    similarTo: decision ? { partId: decision.value, programId: productionProgram(decision.value) } : top ? { partId: top.partId, programId: top.programId } : null,
    confirmed: !!decision, confirmedBy: decision?.by, confirmedAt: decision?.at, manualMatch: !!decision, unitPrice: unit, extPrice: round2(unit * t.quantity),
    priceSource: 'Surrogate-derived estimate', currency: 'USD', supplier: NO_SUPPLIER.name, region: '—',
    provenance: capped ? 'Estimated. No CAD caps certainty at Estimated.' : decision ? `Confirmed surrogate (manual) — ${decision.value}` : `Surrogate match — ${top?.matchPct}% vs. ${top?.partId}`, capped,
  }
}

/** The dataset-shaped row bomKpis expects, from the effective view row (overrides, caps and failures applied). */
export function toBomRow(r: BomViewRow): BomRow {
  const unit = r.unitPrice ?? 0
  return {
    bom_line_id: r.id, program_id: ACTIVE_PROGRAM, part_id: r.partNumber, subassembly: r.subassembly, quantity: r.quantity, unit_price_usd: unit, currency: r.currency || 'USD', price_source: r.priceSource,
    supplier_id: r.supplierRec.supplier_id, region: r.region, certainty: r.certainty, surrogate_match_pct: r.matchPct, surrogate_breakdown: r.breakdown, provenance: r.provenance,
    other_candidates: r.candidates.map((c) => ({ part_id: c.partId, program_id: c.programId, match_pct: c.matchPct })), carry_note: r.carryNote, match_type: r.matchType,
    part: r.part, supplier: r.supplierRec, name: r.name, extPrice: round2(unit * r.quantity), requirementIds: r.requirementIds,
  }
}

export interface KpiConfig { reuseTypes: string[]; riskTypes: string[]; riskSeverities: string[] }
export function bomRollup(rows: BomViewRow[], cfg: KpiConfig) {
  return bomKpis(rows.map(toBomRow), cfg)
}

/** Line confidence (0 to 100) used for the cost-risk band. Quote sources that are cached lose points. */
export function lineConfidence(r: BomViewRow, mode: LineMode, quoteCached: boolean): number {
  switch (mode) {
    case 'carry': return quoteCached && r.priceSource === QUOTE_SOURCE_RAW ? 85 : 95
    case 'propose': return r.confirmed ? Math.min(95, (r.matchPct ?? 60) + 6) : (r.matchPct ?? 60)
    case 'estimate': return costConfidenceFor(r)
    default: return 40
  }
}
/** Spend-weighted range of the BOM total, widened by disconnected sources. Formula returned for the tooltip. */
export function costRiskBand(rows: BomViewRow[], modeOf: (r: BomViewRow) => LineMode, connected: Record<string, boolean>) {
  const priced = rows.filter((r) => r.unitPrice != null && r.unitPrice > 0)
  const total = sum(priced, (r) => r.extPrice)
  const cached = connected.sap === false
  const weighted = total ? sum(priced, (r) => r.extPrice * rangePctFor(lineConfidence(r, modeOf(r), cached))) / total : 0
  const penalty = sum(SOURCES.filter((s) => connected[s.id] === false), (s) => s.widensRiskBy)
  const pct = Math.round((weighted + penalty) * 10) / 10
  return {
    pct, weightedPct: Math.round(weighted * 10) / 10, penalty,
    formula: `Spend-weighted range per line (±5% at confidence 90 or above, ±9.4% at 80 or above, otherwise ±15%) = ±${weighted.toFixed(1)}%${penalty ? `, plus ${penalty.toFixed(1)} points for disconnected sources` : ''}.`,
  }
}

export interface UncertaintyDriver { name: string; pct: number; note: string }
/** FX, price source, tariff and material index (docs/01: 03 Costing). Deterministic per line; the roll-up is root-sum-square. */
export function uncertaintyDrivers(r: BomViewRow, connected: Record<string, boolean>): { drivers: UncertaintyDriver[]; combinedPct: number } {
  const geo = REGION_LOGISTICS[regionKey(r.region)] ?? { factor: 1, fx: 0, tariff: 0 }
  const cachedQuote = connected.sap === false && r.priceSource === QUOTE_SOURCE_RAW
  const h = hashSeed(`drv:${r.partNumber}`)
  const drivers: UncertaintyDriver[] = [
    { name: 'FX', pct: round1(geo.fx + (connected.ecb === false ? 1.2 : 0)), note: geo.fx ? `${r.region} quotes vs. USD${connected.ecb === false ? ', ECB feed disconnected' : ''}` : 'USD-denominated' },
    { name: 'Price source', pct: round1(r.priceSource === QUOTE_SOURCE_RAW ? (cachedQuote ? 3.4 : 1.4) : 2.8 + (h % 20) / 10), note: cachedQuote ? CACHED_NOTE : r.priceSource || 'Not priced' },
    { name: 'Tariff', pct: round1(geo.tariff), note: `Origin ${r.region || '—'}` },
    { name: 'Material index', pct: round1(1 + (h % 24) / 10 + (connected.lme === false ? 1 : 0)), note: `${r.material} · LME index${connected.lme === false ? ', feed disconnected' : ''}` },
  ]
  return { drivers, combinedPct: round1(Math.sqrt(sum(drivers, (d) => d.pct * d.pct))) }
}
const CACHED_NOTE = 'Cached quote, SAP disconnected'

/** Months since the price date, for the confidence decay line. `nowIso` comes from lib/clock. */
export function priceAgeMonths(nowIso: string): number {
  const [py, pm] = PRICE_DATE.split('-').map(Number) as [number, number]
  const d = new Date(nowIso)
  return Math.max(0, (d.getUTCFullYear() - py) * 12 + (d.getUTCMonth() + 1 - pm))
}
export const confidenceDecay = (months: number): number => Math.round(months * DECAY_PTS_PER_MONTH * 10) / 10

/** The MatchQuality payload for a row. Similarity for propose rows, model confidence for estimate rows, a duplicate chip for carry rows. */
export function qualityOf(r: BomViewRow, mode: LineMode): MatchQuality {
  if (mode === 'pending') return {}
  const provenance: MatchQuality['provenance'] = r.confirmed
    ? { origin: 'confirmed', verifiedBy: r.confirmedBy, verifiedAt: r.confirmedAt, tags: ['Surrogate', r.manualMatch ? 'Manual' : 'Computed'] }
    : r.manualMatch ? { origin: 'manual' } : undefined
  const q: MatchQuality = { dataType: { raw: r.certainty }, provenance }
  if (mode === 'carry') q.duplicate = 'geometric-duplicate'
  if (mode === 'propose' && r.matchPct != null) q.similarity = { percent: r.matchPct }
  if (mode === 'estimate') q.confidence = { score: costConfidenceFor(r), why: ['Cost-model confidence', r.capped ? 'No CAD caps certainty at Estimated' : 'Match below the surrogate floor'] }
  return q
}

/** Cost-model confidence for an estimate-mode line: the landed confidence of its estimate. */
function costConfidenceFor(r: BomViewRow): number {
  const seeded = costByPart[r.partNumber]
  if (seeded) return estimateModelFor(r.partNumber, routingInputOf(r), {}).landedConfidence
  return r.capped ? 55 : 60
}

/* ================================== PLM tab ================================ */

/** A PLM record for the schema-driven field renderer, keyed by FieldDef.key (extra keys are ignored by the active schema). */
export function plmRecord(r: BomViewRow): Record<string, string | number> {
  const h = hashSeed(`plm:${r.partNumber}`)
  const prog = programById[ACTIVE_PROGRAM]!
  const day = String(1 + (h % 27)).padStart(2, '0'), month = String(1 + ((h >> 3) % 9)).padStart(2, '0')
  return {
    program: prog.name, modelYear: `MY${prog.model_year}`, programType: 'ICE', customerGroup: 'North America', region: r.region || '—', productGroup: r.subassembly,
    productLine: r.partNumber.split('-')[0] ?? r.partNumber, calcWeight: r.weightKg, releaseStatus: r.origin === 'dataset' && r.certainty === 'Actual' ? 'Released' : r.origin === 'dataset' ? 'In Review' : 'WIP',
    lifecycleState: r.origin === 'dataset' && r.certainty === 'Actual' ? 'Released' : 'In Work', releasedDate: `2025-${month}-${day}`, supplierLeadTime: r.leadWeeks,
  }
}

/* =============================== 03b Compare parts ========================== */

export interface CompareMetrics {
  matchPct: number; breakdown: SurrogateBreakdown
  volumeCm3: { bomOnly: number; overlap: number; productionOnly: number }
  bboxDelta: { x: number; y: number; z: number }
  maxDeviationMm: number; massDeltaG: number; materialIdentical: boolean
  constraints: Array<{ type: 'coplanar' | 'coaxial' | 'concentric' | 'parallel-planes'; label: string }>
  dofRemaining: number
}
const CONSTRAINT_TYPES = ['coplanar', 'coaxial', 'concentric', 'parallel-planes'] as const
/** Deterministic compare numbers for a pair (stand-in for the alignment solver and overlap engine). N constraints is computed, not typed. */
export function compareMetrics(bomPartId: string, otherPartId: string, bom: Part, other: Part): CompareMetrics {
  const pair = pairSimilarity(bomPartId, otherPartId)
  const rng = mulberry32(`cmp:${bomPartId}>${otherPartId}`)
  const geo = pair.breakdown.geometry
  const volume = Math.max(6, bom.weight_kg * 14 + rng() * 8)
  const overlapPct = Math.min(99.6, 0.55 * geo + 45 * (pair.matchPct / 100))
  const overlap = round1(volume * (overlapPct / 100))
  const n = 3 + hashInt(`n:${bomPartId}>${otherPartId}`, 0, 2)
  const constraints = Array.from({ length: n }, (_, i) => {
    const type = CONSTRAINT_TYPES[hashInt(`c${i}:${bomPartId}>${otherPartId}`, 0, CONSTRAINT_TYPES.length - 1)]!
    return { type, label: `${type === 'coplanar' ? 'Planar face' : type === 'coaxial' ? 'Cylindrical bore' : type === 'concentric' ? 'Circular edge' : 'Parallel face'} ${i + 1}` }
  })
  const dev = round1((100 - geo) / 10 + rng() * 0.8)
  return {
    matchPct: pair.matchPct, breakdown: pair.breakdown,
    volumeCm3: { bomOnly: round1(Math.max(0.1, (volume - overlap) * 0.7)), overlap, productionOnly: round1(Math.max(0.1, (volume - overlap) * 0.3)) },
    bboxDelta: { x: round1((rng() - 0.3) * dev), y: round1((rng() - 0.3) * dev), z: round1((rng() - 0.5) * dev * 0.2) },
    maxDeviationMm: dev, massDeltaG: Math.round((bom.weight_kg - other.weight_kg) * 1000), materialIdentical: bom.material === other.material,
    constraints, dofRemaining: Math.max(0, 6 - constraints.length * 2),
  }
}

export interface DrivingRequirement { reqId: string; title: string; sourceType: string; citation: string; attribute: string; bomValue: string; productionValue: string; textStatus: string; drivenByStatus: string; severity: string }
const ATTRIBUTES: Array<{ label: string; get: (p: Part) => string }> = [
  { label: 'Material', get: (p) => p.material }, { label: 'Process', get: (p) => p.manufacture_method }, { label: 'Mass', get: (p) => `${p.weight_kg} kg` },
  { label: 'Complexity', get: (p) => p.complexity }, { label: 'Lead time', get: (p) => `${p.lead_time_wk} wk` },
]
/** "Requirements driving part selection": requirements linked to the line's part, with the attribute they constrain compared across the pair. */
export function drivingRequirements(bom: Part, other: Part): DrivingRequirement[] {
  return requirements.filter((r) => r.linked_part_id === bom.part_id).map((r) => {
    const a = ATTRIBUTES[hashInt(`attr:${r.req_id}`, 0, ATTRIBUTES.length - 1)]!
    return { reqId: r.req_id, title: r.title, sourceType: r.source_type, citation: r.citation, attribute: a.label, bomValue: a.get(bom), productionValue: a.get(other), textStatus: r.text_status, drivenByStatus: r.driven_by_status, severity: r.severity }
  })
}

/* ============================== 04 Composition ============================== */

export type BucketId = 'new' | 'carryover' | 'uncertain'
/**
 * Bucket assignment (documented in docs/decisions/bom.md): a line is Uncertain when its certainty carries no similarity percentage
 * (No match, Search failed); otherwise Carryover when its match_type is a duplicate; otherwise New (surrogates, estimates, manual lines).
 */
export function bucketOf(r: BomViewRow, noSimilarityTypes: string[]): BucketId {
  if (noSimilarityTypes.includes(r.certainty)) return 'uncertain'
  if (r.matchType === 'duplicate' && !r.confirmed) return 'carryover'
  return 'new'
}
export const requirementCountFor = (r: BomViewRow): number => r.requirementIds.length
export function composition(rows: BomViewRow[], noSimilarityTypes: string[]): Record<BucketId, BomViewRow[]> {
  const out: Record<BucketId, BomViewRow[]> = { new: [], carryover: [], uncertain: [] }
  rows.forEach((r) => out[bucketOf(r, noSimilarityTypes)].push(r))
  return out
}

/* ================================ 03d Cost =================================== */

export interface CostLineModel { key: CostLineKey; line: string; amount: number; confidence: number; formula: string; trace: TraceInput[]; assumedCount: number }
export interface EstimateModel {
  partId: string; seeded: boolean; modelName: string; family: ModelFamily; lines: CostLineModel[]; landed: number; landedConfidence: number; rangePct: number
  low: number; high: number; datasetLines: string | null; features: string[]; params: CostParams; basisPartId: string | null; bomUnitPrice: number | null; varianceToBomPct: number | null
}
export interface RoutingInput { part: Part; certainty: string; hasCad: boolean; matchPct: number | null; basisPartId: string | null; unitPrice: number | null; priceSource: string; supplierId: string; region: string }
export const routingInputOf = (r: BomViewRow): RoutingInput => ({ part: r.part, certainty: r.certainty, hasCad: r.hasCad, matchPct: r.matchPct, basisPartId: r.similarTo?.partId ?? null, unitPrice: r.unitPrice, priceSource: r.priceSource, supplierId: r.supplierRec.supplier_id, region: r.region })

interface CostExtra { amounts: number[]; confidence: number[]; datasetLines: string; params: CostParams; alternates: { model: string; supplierIds: string[] } }
const COST_EXTRAS = (costJson as unknown as { parts: Record<string, CostExtra> }).parts
export const hasSeededCost = (partId: string): boolean => !!costByPart[partId] && !!COST_EXTRAS[partId]

export interface Routing {
  seeded: boolean; modelName: string; nextBest: string; statusRaw: string
  models: Array<{ name: string; score: number; family: ModelFamily }>
  why: Array<{ tag: string; note: string }>
  maturity: { cad3d: string; drawing2d: string; materialSpec: string }
}
const MAT = { Have: 'Have', Via: 'Via surrogate', Missing: 'Missing' }
export function routingFor(inp: RoutingInput): Routing {
  const seeded = costByPart[inp.part.part_id]
  if (seeded) {
    const top = seeded.routing_score
    const rest = 100 - top
    const m1 = seeded.suggested_model, m2 = seeded.next_best_alternative, m3 = 'Parametric estimate by weight and process class'
    return {
      seeded: true, modelName: m1, nextBest: m2, statusRaw: seeded.routing_status,
      models: [{ name: m1, score: top, family: modelFamily(m1) }, { name: m2, score: Math.round(rest * 0.6), family: modelFamily(m2) }, { name: m3, score: Math.round(rest * 0.28), family: modelFamily(m3) }],
      why: seeded.why_this_model, maturity: { cad3d: seeded.input_maturity['3d_cad'], drawing2d: seeded.input_maturity['2d_drawing'], materialSpec: seeded.input_maturity.material_spec },
    }
  }
  const carry = inp.certainty === 'Actual'
  const score = carry ? 92 : inp.matchPct != null ? inp.matchPct : 48
  const m1 = carry ? 'Supplier quote on file (production part)' : `Should-cost: ${inp.part.manufacture_method.toLowerCase()}`
  const m2 = inp.basisPartId ? `Supplier-quoted analog (${inp.basisPartId}) scaled` : 'Parametric estimate by weight and process class'
  const m3 = 'Parametric estimate by weight and process class'
  return {
    seeded: false, modelName: m1, nextBest: m2, statusRaw: carry ? 'Supplier quote on file' : 'Suggested - not yet confirmed',
    models: [{ name: m1, score, family: modelFamily(m1) }, { name: m2, score: Math.round((100 - score) * 0.6), family: modelFamily(m2) }, { name: m3, score: Math.round((100 - score) * 0.28), family: modelFamily(m3) }],
    why: [
      { tag: 'PLM', note: `${inp.part.manufacture_method}, ${inp.part.material}.` },
      { tag: carry ? 'RFQ' : 'Surrogate', note: carry ? 'Carried over from a production part with a supplier quote on file.' : inp.basisPartId ? `Anchored to ${inp.basisPartId} at ${inp.matchPct ?? '—'}% match.` : 'No usable match; weight and process class only.' },
    ],
    maturity: { cad3d: inp.hasCad ? MAT.Have : MAT.Missing, drawing2d: carry ? MAT.Have : MAT.Via, materialSpec: MAT.Have },
  }
}

/** Input maturity per model: what each input reads for this model, and its confidence ceiling (docs/01: 03d). */
export function maturityForModel(routing: Routing, modelName: string) {
  const fam = modelFamily(modelName)
  const read = (needed: boolean, v: string) => (needed ? v : 'Not needed')
  return { cad3d: read(fam.needs.cad3d, routing.maturity.cad3d), drawing2d: read(fam.needs.drawing2d, routing.maturity.drawing2d), materialSpec: read(fam.needs.materialSpec, routing.maturity.materialSpec), ceiling: fam.ceiling, ceilingCap: CEILING_CAP[fam.ceiling] ?? 100 }
}

function derivedParams(part: Part, unit: number): CostParams {
  const h = (k: string) => hashInt(`${part.part_id}:${k}`, 0, 1000)
  return {
    massKg: part.weight_kg, materialSpec: part.material, materialPricePerKg: round2(3 + (h('mp') % 60) / 4), scrapPct: 6 + (h('sc') % 8), cycleMin: 6 + (h('cy') % 24), machineRate: `€${48 + (h('mr') % 28)}/h`, yieldPct: 88 + (h('y') % 9),
    toolingCost: 60000 + (h('tc') % 300) * 1000, lifetimeVolume: 150000, surfaceDm2: round1(part.weight_kg * 3 + 1), ohPct: 12 + (h('oh') % 6), freight: round2(unit * 0.02), dutyPct: 2.5, plant: supplierById[part.supplier_id]?.name ?? 'Supplier plant', faces: `${3 + (h('fc') % 9)} machined faces, ${1 + (h('th') % 6)} tapped holes`,
  }
}
const DERIVED_SHARES = [0.34, 0.3, 0.1, 0.06, 0.12, 0.08]

const money = (n: number): string => `$${n.toFixed(2)}`
const fmtInt = (n: number): string => n.toLocaleString('en-US')
function traceFor(key: CostLineKey, p: CostParams, amount: number, seeded: boolean, basis: string | null, line: number, partId: string): { trace: TraceInput[] } {
  const live = 'synced 2026-10-01', plm = '2026-08', comp = 'computed'
  const t = (name: string, value: string, source: string, freshness: string, tag: TraceInput['tag']): TraceInput => ({ name, value, source, freshness, tag })
  const assumed = (tag: TraceInput['tag']): TraceInput['tag'] => (seeded && line < 60 ? 'Assumed' : tag)
  const trace: Record<CostLineKey, TraceInput[]> = {
    material: [
      t('Mass', `${p.massKg} kg`, `CAD volume × density · ${partId}`, comp, 'CAD features'),
      t('Material price', `$${p.materialPricePerKg}/kg`, `LME index · ${p.materialSpec}`, live, 'Live feed'),
      t('Scrap allowance', `${p.scrapPct}%`, 'Process default for this family', 'default', 'Assumed'),
    ],
    machining: [
      t('Cycle time', `${p.cycleMin} min`, `${p.faces}${basis ? ` · ${basis}` : ''}`, comp, 'CAD features'),
      t('Machine rate', p.machineRate, `${p.plant} · PLM`, plm, 'PLM or contract'),
      t('Yield', `${p.yieldPct}%`, basis ? `Surrogate ${basis} · PO history` : 'Process default', basis ? '2026-03' : 'default', assumed('PLM or contract')),
    ],
    setup: [
      t('Tooling cost', `$${fmtInt(p.toolingCost)}`, 'Supplier tooling quote', plm, assumed('PLM or contract')),
      t('Lifetime volume', fmtInt(p.lifetimeVolume), 'RFQ commercial terms', '2026-10', 'PLM or contract'),
      t('Setup allocation', money(amount * 0.12), 'Setup time ÷ batch size', comp, 'Computed'),
    ],
    finishing: [
      t('Surface area', `${p.surfaceDm2} dm²`, 'CAD surface area', comp, 'CAD features'),
      t('Finish rate', `$${(amount / Math.max(0.1, p.surfaceDm2)).toFixed(2)}/dm²`, 'Finish spec default', 'default', 'Assumed'),
    ],
    overhead: [
      t('Overhead rate', `${p.ohPct}%`, `${p.plant} · contract`, plm, 'PLM or contract'),
      t('Margin', '8%', 'Quoting policy default', 'default', 'Assumed'),
    ],
    logistics: [
      t('Freight', money(p.freight), 'Lane rate index', live, 'Live feed'),
      t('Duty rate', `${p.dutyPct}%`, 'Tariff schedule', live, 'Live feed'),
      t('Incoterm', 'FCA', 'RFQ commercial terms', '2026-10', 'PLM or contract'),
    ],
  }
  return { trace: trace[key] }
}

function baseLines(inp: RoutingInput): { amounts: number[]; confidence: number[]; params: CostParams; seeded: boolean; datasetLines: string | null } {
  const ex = COST_EXTRAS[inp.part.part_id]
  if (ex && costByPart[inp.part.part_id]) return { amounts: ex.amounts, confidence: ex.confidence, params: ex.params, seeded: true, datasetLines: ex.datasetLines }
  const unit = inp.unitPrice ?? Math.max(10, inp.part.base_price_usd || 40)
  const tierConf = inp.certainty === 'Actual' ? 94 : inp.matchPct != null && inp.certainty === SURROGATE_RAW ? Math.min(90, inp.matchPct) : inp.certainty === ESTIMATED_RAW ? 62 : 50
  const amounts = DERIVED_SHARES.map((s) => round2(unit * s))
  amounts[5] = round2(unit - sum(amounts.slice(0, 5), (n) => n))
  return { amounts, confidence: COST_LINES.map((_, i) => clamp(tierConf + [2, -4, -8, -3, 0, 4][i]!)), params: derivedParams(inp.part, unit), seeded: false, datasetLines: null }
}

export interface EstimateVariant { model?: string; surrogatePartId?: string; supplierId?: string }

/** The one canonical cost-line structure: six fixed lines and a landed cost, for any part, model, surrogate and supplier. */
export function estimateModelFor(partId: string, inp: RoutingInput, variant: EstimateVariant): EstimateModel {
  const routing = routingFor(inp)
  const modelName = variant.model ?? routing.modelName
  const fam = modelFamily(modelName), baseFam = modelFamily(routing.modelName)
  const base = baseLines(inp)
  const basis = variant.surrogatePartId ?? inp.basisPartId
  const cap = CEILING_CAP[fam.ceiling] ?? 100
  const shapeRatio = COST_LINES.map((_, i) => (variant.model && variant.model !== routing.modelName ? fam.shape[i]! / baseFam.shape[i]! : 1))
  let massRatio = 1, confPenalty = 0
  if (variant.surrogatePartId && variant.surrogatePartId !== inp.basisPartId) {
    const alt = partById[variant.surrogatePartId], cur = inp.basisPartId ? partById[inp.basisPartId] : undefined
    massRatio = alt && cur && cur.weight_kg ? clampRatio(alt.weight_kg / cur.weight_kg) : 1 + (hashInt(`sg:${variant.surrogatePartId}`, -6, 9) / 100)
    const curPct = inp.matchPct ?? 80, altPct = pairSimilarity(inp.part.part_id, variant.surrogatePartId).matchPct
    confPenalty = Math.max(0, Math.round((curPct - altPct) / 2))
  }
  let supplierFactor = 1, logisticsFactor = 1, supplierPenalty = 0
  if (variant.supplierId && variant.supplierId !== inp.supplierId) {
    const s = supplierById[variant.supplierId]
    supplierFactor = 0.93 + hashInt(`sp:${variant.supplierId}:${inp.part.part_id}`, 0, 16) / 100
    logisticsFactor = (REGION_LOGISTICS[regionKey(s?.region ?? '')]?.factor ?? 1) / (REGION_LOGISTICS[regionKey(inp.region)]?.factor ?? 1)
    supplierPenalty = 6
  }
  const lines: CostLineModel[] = COST_LINES.map((def, i) => {
    let amount = base.amounts[i]! * shapeRatio[i]!
    if (i < 2) amount *= massRatio
    amount *= supplierFactor * (i === 5 ? logisticsFactor : 1)
    amount = round2(amount)
    const conf = clamp(Math.min(cap, base.confidence[i]! - confPenalty - supplierPenalty - (variant.model && variant.model !== routing.modelName ? 4 : 0)))
    const tr = traceFor(def.key, base.params, amount, base.seeded, basis, base.confidence[i]!, partId)
    return { key: def.key, line: def.label, amount, confidence: conf, formula: def.formula, trace: tr.trace, assumedCount: tr.trace.filter((x) => x.tag === 'Assumed').length }
  })
  const landed = round2(sum(lines, (l) => l.amount))
  const landedConfidence = Math.round(sum(lines, (l) => l.amount * l.confidence) / (landed || 1))
  const rangePct = rangePctFor(landedConfidence)
  return {
    partId, seeded: base.seeded, modelName, family: fam, lines, landed, landedConfidence, rangePct, low: round2(landed * (1 - rangePct / 100)), high: round2(landed * (1 + rangePct / 100)),
    datasetLines: base.datasetLines, features: featureList(base.params, base.seeded), params: base.params, basisPartId: basis, bomUnitPrice: inp.unitPrice,
    varianceToBomPct: inp.unitPrice ? round1(((landed - inp.unitPrice) / inp.unitPrice) * 100) : null,
  }
}
const clampRatio = (n: number): number => Math.max(0.6, Math.min(1.5, n))

function featureList(p: CostParams, seeded: boolean): string[] {
  return [p.faces, `Surface area ${p.surfaceDm2} dm²`, `Mass ${p.massKg} kg`, `Material ${p.materialSpec}`, seeded ? 'Tolerance class IT8 (assumed, no 2D drawing on some inputs)' : 'Tolerance class from process default']
}

export interface SourcingOption { supplierId: string; supplier: Supplier; current: boolean; landed: number; leadWeeks: number; priceSource: string; certainty: string; confidence: number; factor: number; region: string }
/** Current supplier plus up to two alternates (read-only, D-12). Alternates come from the seeded extras or same-category suppliers. */
export function sourcingOptions(inp: RoutingInput, currentLanded: number, currentCertainty: string, currentConfidence: number): SourcingOption[] {
  const ex = COST_EXTRAS[inp.part.part_id]
  const cur = supplierById[inp.supplierId] ?? NO_SUPPLIER
  let alt = ex?.alternates.supplierIds ?? suppliers.filter((s) => s.category === cur.category && s.supplier_id !== cur.supplier_id).map((s) => s.supplier_id)
  if (alt.length < 2) alt = [...alt, ...suppliers.filter((s) => s.supplier_id !== cur.supplier_id && !alt.includes(s.supplier_id)).sort((a, b) => hashSeed(a.supplier_id + inp.part.part_id) - hashSeed(b.supplier_id + inp.part.part_id)).map((s) => s.supplier_id)]
  const out: SourcingOption[] = [{ supplierId: cur.supplier_id, supplier: cur, current: true, landed: currentLanded, leadWeeks: inp.part.lead_time_wk, priceSource: inp.priceSource, certainty: currentCertainty, confidence: currentConfidence, factor: 1, region: cur.region }]
  alt.filter((id) => id !== cur.supplier_id).slice(0, 2).forEach((id, i) => {
    const s = supplierById[id]!
    const f = 0.93 + hashInt(`sp:${id}:${inp.part.part_id}`, 0, 16) / 100
    const lf = (REGION_LOGISTICS[regionKey(s.region)]?.factor ?? 1) / (REGION_LOGISTICS[regionKey(inp.region)]?.factor ?? 1)
    out.push({ supplierId: id, supplier: s, current: false, landed: round2(currentLanded * f * (0.94 + 0.06 * lf)), leadWeeks: inp.part.lead_time_wk + hashInt(`lt:${id}`, -3, 5), priceSource: 'Surrogate-derived estimate', certainty: i === 0 ? SURROGATE_RAW : ESTIMATED_RAW, confidence: i === 0 ? 80 : 66, factor: f, region: s.region })
  })
  return out
}

/** Price-over-time fan: ± band by horizon (months), widening from the current range towards ±15%. */
export function fanBands(landed: number, rangePct: number): Array<{ months: number; low: number; high: number; pct: number }> {
  return [0, 3, 6, 12, 18, 24].map((m) => { const pct = round1(Math.min(15, rangePct + (15 - rangePct) * (m / 24))); return { months: m, pct, low: round2(landed * (1 - pct / 100)), high: round2(landed * (1 + pct / 100)) } })
}

/** Production price of a part on another program (used when a surrogate is chosen). */
export const productionUnitPrice = (partId: string): number | null => productionLine(partId)?.unit_price_usd ?? null
export { programShort, programsUsing }

/* ================================== helpers ================================= */

function sum<T>(xs: T[], f: (x: T) => number): number { let s = 0; for (const x of xs) s += f(x); return s }
const round1 = (n: number): number => Math.round(n * 10) / 10
