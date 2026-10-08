import type { RouteObject } from 'react-router-dom'
import { Placeholder } from '../../Placeholder'
// OWNER: Phase 6 (requirements + traceability). Steps 05, 06, 06b, 06c, 03c, test detail, 07.
export const requirementRoutes: RouteObject[] = [
  { path: 'create/requirements/:step', element: <Placeholder title="Requirements and traceability" phase="Phase 6" /> },
]
