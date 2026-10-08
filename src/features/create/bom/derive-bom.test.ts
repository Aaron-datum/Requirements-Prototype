import { describe, expect, it } from 'vitest'
import { buildAppConfig } from '../../../config/appConfig'
import { costEstimates } from '../../../fixtures/civic'
import { siBomRows } from '../../../fixtures/derive'
import {
  bomRollup, buildBomRows, candidatesFor, capTier, compareMetrics, composition, costRiskBand, drivingRequirements, emptyTreeState, estimateModelFor, fanBands, hasSeededCost, lineMode, maturityForModel,
  nextRoute, pairSimilarity, plmRecord, requirementScope, routingFor, routingInputOf, sourcingOptions, trackCounts, treeSummary, type BomContext, type BomViewRow,
} from '../../../fixtures/derive-bom'
import { COST_LINES, rangePctFor } from '../../../fixtures/extras/bom/rules'
import { gateStub } from '../../../services/stubs/gate'
import { surrogateEngineStub } from '../../../services/stubs/surrogateEngine'
import { costStub } from '../../../services/stubs/cost'
import { docsStub } from '../../../services/stubs/docs'
import { partById } from '../../../fixtures/civic'

const cfg = buildAppConfig()
const ctx = (over: Partial<BomContext> = {}): BomContext => ({
  tree: emptyTreeState(), assemblyRouted: true, searched: true, failedRetried: true, decisionFor: () => undefined, thresholds: cfg.thresholds, ...over,
})
const count = (rows: BomViewRow[]) => rows.reduce<Record<string, number>>((m, r) => { m[r.certainty] = (m[r.certainty] ?? 0) + 1; return m }, {})
const modeOf = (r: BomViewRow) => lineMode(r.certainty, (c) => gateStub.decide(c), cfg.matchRules.noSimilarityTypes)

describe('01 intake', () => {
  it('track counts recompute from routes (docs/01)', () => {
    const d = trackCounts()
    expect(d.cad).toMatchObject({ subassemblies: 9, parts: 58, referenceBodies: 2 })
    expect(d.docs).toMatchObject({ documents: 3, requirements: 244 })
    expect(d.template).toEqual({ routed: true, total: 21, matched: 13, toConfirm: 5, custom: 3 })
    const sorToKept = trackCounts({ 'f-sor': 'kept' })
    expect(sorToKept.docs).toMatchObject({ documents: 2, requirements: 96 })
    expect(trackCounts({ 'f-cad-asm': 'kept' }).assemblyRouted).toBe(false)
  })
  it('template-column matching activates only when the template file is routed to Columns (v2 off-by-one fixed: routes are keyed by file id)', () => {
    expect(trackCounts().template.routed).toBe(true)
    expect(trackCounts({ 'f-bom-template': 'kept' }).template).toMatchObject({ routed: false, total: 0 })
    expect(trackCounts({ 'f-photos': 'columns' }).template.routed).toBe(true) // a non-template file routed to Columns does not activate it, the template stays routed
    expect(trackCounts({ 'f-bom-template': 'kept', 'f-photos': 'columns' }).template.routed).toBe(false)
  })
  it('route pills cycle CAD to BOM, Requirements, Columns, Kept on file', () => {
    expect(['cad-bom', 'requirements', 'columns', 'kept'].map(nextRoute)).toEqual(['requirements', 'columns', 'kept', 'cad-bom'])
  })
  it('reconciles 244 extracted with 98 in scope (D-09)', () => {
    expect(requirementScope()).toMatchObject({ extracted: 244, inScope: 98, traced: 16, olderDocuments: 571 })
    expect(requirementScope({ 'f-sor': 'kept' }).extracted).toBe(96)
  })
  it('doc-extraction stub lists the package', async () => {
    const files = await docsStub.listPackage('RFQ-26-0512')
    expect(files).toHaveLength(8)
    expect(await docsStub.countRequirements('RFQ-26-0512')).toEqual({ extracted: 244, implicated: 98 })
  })
})

describe('02 assembly tree', () => {
  it('default summary: 56 lines from 58 parts, references excluded', () => {
    expect(treeSummary(emptyTreeState())).toMatchObject({ lines: 56, parts: 58, selected: 56, excludedByYou: 0, referenceExcluded: 2, manual: 0, noCad: 0 })
  })
  it('including a reference body or adding a manual line creates a No CAD line; attaching CAD flips it', () => {
    const s = { ...emptyTreeState(), included: { 'REF-ENV-01': true }, manual: [{ id: 'MAN-01', name: 'Bracket', partNumber: 'MAN-01', subassembly: 'Fuel System', quantity: 2 }] }
    expect(treeSummary(s)).toMatchObject({ lines: 58, manual: 1, noCad: 2, referenceExcluded: 1 })
    expect(treeSummary({ ...s, cadAttached: { 'MAN-01': true, 'REF-ENV-01': true } }).noCad).toBe(0)
  })
  it('excluding a part removes its line from the BOM', () => {
    const rows = buildBomRows(ctx({ tree: { ...emptyTreeState(), included: { 'BOML-0111': false } } }))
    expect(rows).toHaveLength(55)
    expect(treeSummary({ ...emptyTreeState(), included: { 'BOML-0111': false } })).toMatchObject({ lines: 55, excludedByYou: 1 })
  })
})

describe('03 BOM review', () => {
  it('Si BOM: 56 lines; after the simulated search one line is Search failed, retry restores the dataset spread', () => {
    const first = buildBomRows(ctx({ failedRetried: false }))
    expect(first).toHaveLength(56)
    expect(count(first)).toEqual({ Actual: 40, Surrogate: 13, Estimated: 1, 'No match': 1, 'Search failed': 1 })
    const retried = buildBomRows(ctx())
    expect(count(retried)).toEqual({ Actual: 41, Surrogate: 13, Estimated: 1, 'No match': 1 })
  })
  it('before the search the BOM is blank: no certainty, no price', () => {
    const rows = buildBomRows(ctx({ searched: false }))
    expect(rows).toHaveLength(56)
    expect(rows.every((r) => r.state === 'pending' && r.certainty === '' && r.unitPrice === null)).toBe(true)
  })
  it('KPIs are derived: total matches the dataset, reuse rate and counts follow the effective rows', () => {
    const types = cfg.vocabularies.find((v) => v.id === 'dataType')!.values.map((v) => v.raw)
    const kpiCfg = { reuseTypes: types.filter((t) => gateStub.decide(t) !== 'ask-human'), riskTypes: types.filter((t) => gateStub.decide(t) === 'ask-human'), riskSeverities: ['Critical', 'High'] }
    const k = bomRollup(buildBomRows(ctx()), kpiCfg)
    expect(k.firstOrderCost).toBeCloseTo(4071.36, 2)
    expect(k.pricedLines).toBe(56)
    expect(k.reusePct).toBe(Math.round((54 / 56) * 100))
    const failing = bomRollup(buildBomRows(ctx({ failedRetried: false })), kpiCfg)
    expect(failing.pricedLines).toBe(55)
    expect(failing.firstOrderCost).toBeLessThan(k.firstOrderCost)
    expect(failing.certaintyCounts['Search failed']).toBe(1)
  })
  it('a recorded select-surrogate decision updates the line (Confirmed surrogate, chosen part)', () => {
    const rows = buildBomRows(ctx({ decisionFor: (id) => (id === 'BOML-0166' ? { value: 'TC-404-B', at: '2026-10-08T10:00:00Z', by: 'Aaron Keller' } : undefined) }))
    const r = rows.find((x) => x.id === 'BOML-0166')!
    expect(r).toMatchObject({ certainty: 'Surrogate', confirmed: true, manualMatch: true, similarTo: { partId: 'TC-404-B' }, confirmedBy: 'Aaron Keller' })
    expect(r.matchPct).not.toBeNull()
  })
  it('No CAD caps certainty at Estimated', () => {
    expect(capTier('Actual', false)).toBe('Estimated')
    expect(capTier('Surrogate', false)).toBe('Estimated')
    expect(capTier('No match', false)).toBe('No match')
    expect(capTier('Actual', true)).toBe('Actual')
    const withManual = buildBomRows(ctx({ tree: { ...emptyTreeState(), manual: [{ id: 'MAN-01', name: 'Bracket', partNumber: 'MAN-01', subassembly: 'Fuel System', quantity: 1 }] } }))
    expect(withManual).toHaveLength(57)
    expect(withManual.find((r) => r.id === 'MAN-01')!.certainty).toBe('Estimated')
    const attached = buildBomRows(ctx({ tree: { ...emptyTreeState(), manual: [{ id: 'MAN-01', name: 'Bracket', partNumber: 'MAN-01', subassembly: 'Fuel System', quantity: 1 }], cadAttached: { 'MAN-01': true } } }))
    expect(attached.find((r) => r.id === 'MAN-01')!.hasCad).toBe(true)
  })
  it('the autonomy gate decides what the agent may do per line mode', () => {
    expect(modeOf({ certainty: 'Actual' } as BomViewRow)).toBe('carry')
    expect(modeOf({ certainty: 'Surrogate' } as BomViewRow)).toBe('propose')
    expect(modeOf({ certainty: 'Estimated' } as BomViewRow)).toBe('estimate')
    expect(modeOf({ certainty: 'No match' } as BomViewRow)).toBe('unresolved')
    expect(modeOf({ certainty: 'Search failed' } as BomViewRow)).toBe('unresolved')
    expect(modeOf({ certainty: '' } as BomViewRow)).toBe('pending')
  })
  it('cost risk widens when a source is disconnected', () => {
    const rows = buildBomRows(ctx())
    const on = costRiskBand(rows, modeOf, { sap: true, lme: true, ecb: true })
    const off = costRiskBand(rows, modeOf, { sap: false, lme: true, ecb: true })
    expect(off.pct).toBeGreaterThan(on.pct)
    expect(on.pct).toBeGreaterThan(0)
  })
  it('PLM record is keyed by schema field keys', () => {
    const r = buildBomRows(ctx())[0]!
    expect(Object.keys(plmRecord(r))).toEqual(expect.arrayContaining(['program', 'modelYear', 'releaseStatus', 'calcWeight']))
  })
})

describe('matching-engine stub (surrogate half)', () => {
  it('reproduces the dataset tiers from the config thresholds', () => {
    siBomRows().filter((r) => r.certainty !== 'Actual').forEach((r) => {
      const top = candidatesFor(r.part, 1)[0]
      if (!top) { expect(r.certainty).toBe('No match'); return }
      const tier = top.matchPct >= cfg.thresholds.surrogateFloor ? 'Surrogate' : top.matchPct >= cfg.thresholds.estimatedFloor ? 'Estimated' : 'No match'
      expect(tier).toBe(r.certainty)
    })
  })
  it('uses the dataset breakdown and candidates, deterministically', async () => {
    const line = siBomRows().find((r) => r.bom_line_id === 'BOML-0153')!
    const a = await surrogateEngineStub.findSurrogateCandidates(line.part, { limit: 3 })
    const b = await surrogateEngineStub.findSurrogateCandidates(line.part, { limit: 3 })
    expect(a).toEqual(b)
    expect(a[0]).toMatchObject({ partId: 'TC-408-A', matchPct: 95, breakdown: line.surrogate_breakdown })
    expect((await surrogateEngineStub.scorePairSimilarity('TC-408-C', 'TC-408-A')).matchPct).toBe(95)
    const hashed = pairSimilarity('TC-408-C', 'BLK-101')
    expect(hashed).toEqual(pairSimilarity('BLK-101', 'TC-408-C'))
    expect(hashed.matchPct).toBeGreaterThanOrEqual(0)
  })
  it('breakdown has the five dimensions, all within 0 to 100', () => {
    const c = candidatesFor({ part_id: 'MAN-77', subsystem: 'Fuel System' }, 3)
    expect(c.length).toBeGreaterThan(0)
    c.forEach((x) => Object.values(x.breakdown).forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100) }))
    expect(c[0]!.matchPct).toBeGreaterThanOrEqual(c[c.length - 1]!.matchPct)
  })
})

describe('03b compare', () => {
  it('computes the number of alignment constraints and deterministic metrics', () => {
    const m = compareMetrics('TC-404-C', 'TC-404-B', partById['TC-404-C']!, partById['TC-404-B']!)
    expect(m.constraints.length).toBeGreaterThanOrEqual(3)
    expect(m).toEqual(compareMetrics('TC-404-C', 'TC-404-B', partById['TC-404-C']!, partById['TC-404-B']!))
    expect(m.materialIdentical).toBe(true)
    expect(m.massDeltaG).toBe(400)
  })
  it('requirements driving part selection come from the derive layer', () => {
    const reqs = drivingRequirements(partById['TC-404-C']!, partById['TC-404-B']!)
    expect(reqs.map((r) => r.reqId)).toEqual(['REC-20001'])
    expect(drivingRequirements(partById['BLK-101']!, partById['BLK-101']!)).toEqual([])
  })
})

describe('03d cost estimate', () => {
  const row = (partId: string) => buildBomRows(ctx()).find((r) => r.partNumber === partId)!
  it('has seeded estimates for the five dataset parts and totals equal the dataset three-line sum', () => {
    costEstimates.forEach((c) => {
      expect(hasSeededCost(c.part_id)).toBe(true)
      const e = estimateModelFor(c.part_id, routingInputOf(row(c.part_id)), {})
      expect(e.lines.map((l) => l.line)).toEqual(COST_LINES.map((l) => l.label))
      expect(e.landed).toBeCloseTo(c.cost_breakdown.reduce((s, l) => s + l.amount_usd, 0), 2)
      expect(e.seeded).toBe(true)
    })
  })
  it('range rule: 5 percent at 90 or above, 9.4 at 80 or above, otherwise 15', () => {
    expect([95, 90, 89.9, 85, 80, 79, 40].map(rangePctFor)).toEqual([5, 5, 9.4, 9.4, 9.4, 15, 15])
  })
  it('other parts get a derived estimate with one canonical structure', () => {
    const e = estimateModelFor('BLK-101', routingInputOf(row('BLK-101')), {})
    expect(e.seeded).toBe(false)
    expect(e.lines).toHaveLength(6)
    expect(e.landed).toBeCloseTo(row('BLK-101').unitPrice!, 1)
  })
  it('routing: score, status and three models, with confidence ceilings per model', () => {
    const r = routingFor(routingInputOf(row('TC-404-C')))
    expect(r.models).toHaveLength(3)
    expect(r.models[0]).toMatchObject({ score: 68 })
    expect(r.statusRaw).toBe('Suggested - not yet confirmed')
    const m = maturityForModel(r, r.models[0]!.name)
    expect(['Surrogate', 'Estimated', 'Actual']).toContain(m.ceiling)
  })
  it('switching model, surrogate or supplier changes the lines deterministically and respects the ceiling', () => {
    const inp = routingInputOf(row('TC-404-C'))
    const base = estimateModelFor('TC-404-C', inp, {})
    const alt = estimateModelFor('TC-404-C', inp, { model: 'Forging estimate' })
    expect(alt.landed).not.toBe(base.landed)
    expect(alt).toEqual(estimateModelFor('TC-404-C', inp, { model: 'Forging estimate' }))
    alt.lines.forEach((l) => expect(l.confidence).toBeLessThanOrEqual(72))
    expect(estimateModelFor('TC-404-C', inp, { supplierId: 'SUP-004' }).landed).not.toBe(base.landed)
    expect(estimateModelFor('TC-404-C', inp, { surrogatePartId: 'TC-404-A' }).landed).not.toBe(base.landed)
  })
  it('trace inputs carry value, source, freshness and tag; assumed inputs are counted', () => {
    const e = estimateModelFor('INT-510-C', routingInputOf(row('INT-510-C')), {})
    e.lines.forEach((l) => l.trace.forEach((t) => { expect(t.value).toBeTruthy(); expect(t.source).toBeTruthy(); expect(t.freshness).toBeTruthy() }))
    expect(e.lines.reduce((s, l) => s + l.assumedCount, 0)).toBeGreaterThan(0)
  })
  it('sourcing options: current supplier plus alternates, read-only', () => {
    const r = row('TC-404-C')
    const e = estimateModelFor('TC-404-C', routingInputOf(r), {})
    const opts = sourcingOptions(routingInputOf(r), e.landed, r.certainty, e.landedConfidence)
    expect(opts).toHaveLength(3)
    expect(opts.filter((o) => o.current)).toHaveLength(1)
    expect(fanBands(e.landed, e.rangePct)[0]!.pct).toBe(e.rangePct)
    expect(fanBands(e.landed, e.rangePct).at(-1)!.pct).toBe(15)
  })
  it('cost-model stub returns routing and estimate through the service contract', async () => {
    const r = await costStub.route('TC-404-C', 'PGM-CIV-SI')
    expect(r.models).toHaveLength(3)
    const est = await costStub.estimate('TC-404-C', r.models[0]!.name)
    expect(est.lines).toHaveLength(6)
    expect(est.landed).toBeGreaterThan(0)
  })
})

describe('04 composition', () => {
  it('buckets by match type and certainty', () => {
    const rows = buildBomRows(ctx())
    const c = composition(rows, cfg.matchRules.noSimilarityTypes)
    expect(c.carryover).toHaveLength(41)
    expect(c.new).toHaveLength(14)
    expect(c.uncertain).toHaveLength(1)
    expect(c.carryover.length + c.new.length + c.uncertain.length).toBe(56)
    const failed = composition(buildBomRows(ctx({ failedRetried: false })), cfg.matchRules.noSimilarityTypes)
    expect(failed.uncertain).toHaveLength(2)
  })
})
