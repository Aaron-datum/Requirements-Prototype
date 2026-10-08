import type { RouteObject } from 'react-router-dom'
import { ConfigurationsList, OutputsList, ProjectsList } from './Lists'
import { ProjectDashboard } from './ProjectDashboard'

// OWNER: Phase 7 (projects dashboard + output overview).
export const projectRoutes: RouteObject[] = [
  { path: 'projects', element: <ProjectsList /> },
  { path: 'projects/:id', element: <ProjectDashboard scope="project" /> },
  { path: 'projects/:id/outputs', element: <OutputsList /> },
  { path: 'projects/:id/outputs/:outputId', element: <ProjectDashboard scope="output" /> },
  { path: 'projects/:id/configurations', element: <ConfigurationsList /> },
]
