import type { GeometricEngine } from '../../domain/types'
// OWNER: Phase 2/3 (search). runSearch + deriveMeasurement. StubId: matching-engine.
export const searchEngineStub: Pick<GeometricEngine, 'runSearch' | 'deriveMeasurement'> = {
  runSearch: async () => [],
  deriveMeasurement: async () => 'manual-required',
}
