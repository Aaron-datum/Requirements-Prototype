import type { RouteObject } from 'react-router-dom'
import { Compare } from './Compare'
import { Define } from './Define'
import { Files } from './Files'
import { NewSearch } from './NewSearch'
import { Results } from './Results'

// OWNER: Phases 2 and 3 (search). New Search, Files, Define, Results, Compare. State lives in the URL (see query.ts).
export const searchRoutes: RouteObject[] = [
  { path: 'search/new', element: <NewSearch /> },
  { path: 'search/files', element: <Files /> },
  { path: 'search/define', element: <Define /> },
  { path: 'search/results', element: <Results /> },
  { path: 'search/compare', element: <Compare /> },
]
