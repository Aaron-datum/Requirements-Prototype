import type { RouteObject } from 'react-router-dom'
import { Placeholder } from '../Placeholder'
// OWNER: Phase 4 (catalogue).
export const catalogueRoutes: RouteObject[] = [
  { path: 'catalogue', element: <Placeholder title="Parts Catalogue" phase="Phase 4" /> },
  { path: 'catalogue/compare', element: <Placeholder title="Catalogue compare" phase="Phase 4" /> },
  { path: 'catalogue/:nodeId', element: <Placeholder title="Parts Catalogue" phase="Phase 4" /> },
]
