import type { CatalogueServiceFull } from '../../domain/catalogue'
import { useService } from '../../services/context'

/**
 * The search-index stub with the catalogue's extra methods (live tree, parse, part lookup). The Services type only knows the
 * minimal CatalogueService from docs/03; the stub in src/services/stubs/catalogue.ts implements the full interface.
 * Every screen that calls this renders <Stub id="search-index">.
 */
export function useCatalogue(): CatalogueServiceFull {
  return useService('catalogue') as CatalogueServiceFull
}
