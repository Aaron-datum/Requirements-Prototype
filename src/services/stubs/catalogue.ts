import type { CatalogueService } from '../../domain/types'
// OWNER: Phase 4 (catalogue). StubId: search-index. Facet counts are computed from rows, not typed.
export const catalogueStub: CatalogueService = {
  tree: () => [],
  query: () => ({ rows: [], facetCounts: {} }),
}
