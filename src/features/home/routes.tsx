import type { RouteObject } from 'react-router-dom'
import { HomePage } from './HomePage'

// OWNER: Phase 7 (home + projects). Home / Launchpad.
export const homeRoutes: RouteObject[] = [{ index: true, element: <HomePage /> }]
