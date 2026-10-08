import type { CompareService } from '../../domain/types'
// OWNER: Phase 3 (search). StubIds: cad-viewer + matching-engine. Deterministic numbers from a hash of the two ids.
export const compareStub: CompareService = {
  inferConstraint: () => 'coplanar',
  computeOverlap: () => ({ queryOnly: 0, overlap: 100, resultOnly: 0, maxDeviationMm: 0, bboxDelta: { x: 0, y: 0, z: 0 }, volumeMatchPct: 100 }),
}
