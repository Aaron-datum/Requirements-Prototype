import type { RouteObject } from 'react-router-dom'
import { Placeholder } from '../Placeholder'
// OWNER: Phase 7 (projects dashboard + output overview).
export const projectRoutes: RouteObject[] = [
  { path: 'projects', element: <Placeholder title="Projects dashboard" phase="Phase 7" /> },
  { path: 'projects/:id', element: <Placeholder title="Project overview" phase="Phase 7" /> },
  { path: 'projects/:id/outputs', element: <Placeholder title="Outputs" phase="Phase 7" /> },
  { path: 'projects/:id/outputs/:outputId', element: <Placeholder title="Output overview" phase="Phase 7" /> },
  { path: 'projects/:id/configurations', element: <Placeholder title="Configurations" phase="Phase 7" /> },
]
