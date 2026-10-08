import type { GeometricEngine } from '../../domain/types'
// OWNER: Phase 5 (BOM). findSurrogateCandidates + scorePairSimilarity. StubId: matching-engine.
export const surrogateEngineStub: Pick<GeometricEngine, 'findSurrogateCandidates' | 'scorePairSimilarity'> = {
  findSurrogateCandidates: async () => [],
  scorePairSimilarity: async () => ({ matchPct: 0, breakdown: { geometry: 0, manufacture_complexity: 0, material: 0, supplier_location: 0, order_of_magnitude: 0 } }),
}
