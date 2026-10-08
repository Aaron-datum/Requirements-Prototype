import type { RouteObject } from 'react-router-dom'
import { Placeholder } from '../Placeholder'
// OWNER: Phases 2 and 3 (search). New Search, Files, Define, Results, Compare.
export const searchRoutes: RouteObject[] = [
  { path: 'search/new', element: <Placeholder title="New Search" phase="Phase 2" /> },
  { path: 'search/files', element: <Placeholder title="Files" phase="Phase 2" /> },
  { path: 'search/define', element: <Placeholder title="Define" phase="Phase 2" /> },
  { path: 'search/results', element: <Placeholder title="Results" phase="Phase 3" /> },
  { path: 'search/compare', element: <Placeholder title="Compare" phase="Phase 3" /> },
]
