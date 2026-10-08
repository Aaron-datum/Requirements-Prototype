import type { GeometricEngine } from '../../domain/types'
import { candidatesFor, pairSimilarity } from '../../fixtures/derive-bom'
import { delay } from '../latency'

/**
 * StubId: matching-engine (surrogate half; the search half is searchEngine.ts). OWNER: Phase 5 (BOM).
 * Uses the dataset's other_candidates and surrogate_breakdown where they exist, a literal duplicate for carried-over lines and
 * hash-seeded production parts otherwise. Same input, same ranking. The logic lives in fixtures/derive-bom.ts so tests and the
 * screens share it; this file only adapts it to the GeometricEngine contract.
 */
export const surrogateEngineStub: Pick<GeometricEngine, 'findSurrogateCandidates' | 'scorePairSimilarity'> = {
  findSurrogateCandidates: async (part, opts) => {
    const id = 'part_id' in part ? part.part_id : part.id
    const subsystem = 'subsystem' in part ? part.subsystem : ''
    const ranked = candidatesFor({ part_id: id, subsystem }, Math.max(opts.limit, 1))
    const filtered = opts.programs?.length ? ranked.filter((c) => opts.programs!.includes(c.programId)) : ranked
    return delay(filtered.slice(0, opts.limit).map((c) => ({ partId: c.partId, matchPct: c.matchPct, breakdown: c.breakdown })))
  },
  scorePairSimilarity: async (a, b) => delay(pairSimilarity(a, b)),
}
