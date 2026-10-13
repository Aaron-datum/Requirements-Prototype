import type { RouteObject } from 'react-router-dom'
import { CatalogueLanding, CatalogueNodePage } from './Browse'
import { CompareView } from './CompareView'

// OWNER: Phase 4 (catalogue). /catalogue, /catalogue/:nodeId, /catalogue/compare?a&b&form=dual|table
export const catalogueRoutes: RouteObject[] = [
  { path: 'catalogue', element: <CatalogueLanding /> },
  { path: 'catalogue/compare', element: <CompareView /> },
  { path: 'catalogue/:nodeId', element: <CatalogueNodePage /> },
]
