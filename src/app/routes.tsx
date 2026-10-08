import type { RouteObject } from 'react-router-dom'
import { AppShell } from '../components/shell/Shell'
import { KitchenSink } from '../dev/KitchenSink'
import { StubLegend } from '../dev/StubLegend'
import { catalogueRoutes } from '../features/catalogue/routes'
import { ComingSoon } from '../features/create/comingSoon'
import { bomRoutes } from '../features/create/bom/routes'
import { requirementRoutes } from '../features/create/requirements/routes'
import { homeRoutes } from '../features/home/routes'
import { projectRoutes } from '../features/projects/routes'
import { searchRoutes } from '../features/search/routes'
import { SettingsPage } from '../features/settings/SettingsPage'

/** Route table. Each feature owns its own routes file; this file only composes them. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      ...homeRoutes,
      ...searchRoutes,
      ...catalogueRoutes,
      ...bomRoutes,
      ...requirementRoutes,
      { path: 'create/coming/:id', element: <ComingSoon /> },
      ...projectRoutes,
      { path: 'settings', element: <SettingsPage /> },
      { path: 'dev/kitchen-sink', element: <KitchenSink /> },
      { path: 'dev/stubs', element: <StubLegend /> },
    ],
  },
]
