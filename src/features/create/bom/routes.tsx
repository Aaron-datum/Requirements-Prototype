import type { RouteObject } from 'react-router-dom'
import { BomEntry, BomFlow } from './BomFlow'
import { SimulatedSearch } from './SimulatedSearch'

// OWNER: Phase 5 (BOM + cost). Steps 01 intake, 02 tree, 03 review, 03b compare parts, 03d cost, 04 composition.
// Deep links: /create/bom/03-review?line=<bom_line_id>&tab=similarity, /create/bom/03b-compare?line=..&cand=<part>, /create/bom/03d-cost?part=<part>.
export const bomRoutes: RouteObject[] = [
  { path: 'create/bom', element: <BomEntry /> },
  { path: 'create/bom/:step', element: <BomFlow /> },
  // Test-only stand-in for the Search area's decision action (see SimulatedSearch.tsx).
  { path: 'dev/bom-decision', element: <SimulatedSearch /> },
]
