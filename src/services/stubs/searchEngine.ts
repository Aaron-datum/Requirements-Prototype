import type { GeometricEngine } from '../../domain/types'
import { derivedValue } from '../../fixtures/derive-search'
import { generateResults } from '../../fixtures/extras/search/results'
import { delay } from '../latency'

// OWNER: Phase 2/3 (search). runSearch + deriveMeasurement. StubId: matching-engine.
// Deterministic: the same query always yields the same rows (seeded generator in fixtures/extras/search/results.ts).
// Rows are ResultRowX (SearchResultRow plus the data the expansion tabs need); screens narrow with `asResultRows`.
export const searchEngineStub: Pick<GeometricEngine, 'runSearch' | 'deriveMeasurement'> = {
  runSearch: (q) => delay(generateResults(q)),
  deriveMeasurement: (fileId, typeKey, geometryRef) => delay(derivedValue(fileId, typeKey, geometryRef)),
}
