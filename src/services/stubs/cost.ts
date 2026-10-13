import type { CostModelService } from '../../domain/types'
import { costByPart, partById } from '../../fixtures/civic'
import { estimateModelFor, routingFor, type RoutingInput } from '../../fixtures/derive-bom'
import { delay } from '../latency'

/**
 * StubId: cost-model. OWNER: Phase 5 (BOM). Three models for each part (the dataset's suggested model, its next best and a parametric
 * fallback), six canonical cost lines from cost_estimates.json plus the extras in fixtures/extras/bom (a derived, labelled estimate
 * for every other part). The screens call the same pure functions through hooks when they already hold the line (certainty, CAD flag).
 */
const inputFor = (partId: string): RoutingInput => {
  const part = partById[partId]
  if (!part) throw new Error(`Unknown part ${partId}`)
  const seeded = costByPart[partId]
  return { part, certainty: seeded ? 'Surrogate' : 'Actual', hasCad: true, matchPct: null, basisPartId: null, unitPrice: part.base_price_usd || null, priceSource: 'Supplier quote', supplierId: part.supplier_id, region: '' }
}
export const costStub: CostModelService = {
  route: async (partId) => {
    const r = routingFor(inputFor(partId))
    return delay({ models: r.models.map((m) => ({ name: m.name, score: m.score })), why: r.why })
  },
  estimate: async (partId, model, opts) => {
    const e = estimateModelFor(partId, inputFor(partId), { model, surrogatePartId: opts?.surrogatePartId, supplierId: opts?.supplierId })
    return delay({ lines: e.lines.map((l) => ({ line: l.line, amount: l.amount, confidence: l.confidence, trace: l.trace })), landed: e.landed, rangePct: e.rangePct })
  },
}
