import type { RouteObject } from 'react-router-dom'
import { Placeholder } from '../../Placeholder'
// OWNER: Phase 5 (BOM + cost). Steps 01 intake, 02 tree, 03 review, 03b compare parts, 03d cost, 04 composition.
export const bomRoutes: RouteObject[] = [
  { path: 'create/bom', element: <Placeholder title="BOM Creation" phase="Phase 5" /> },
  { path: 'create/bom/:step', element: <Placeholder title="BOM Creation" phase="Phase 5" /> },
]
