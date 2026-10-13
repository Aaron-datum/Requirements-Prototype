import { Navigate, useParams } from 'react-router-dom'
import { stepHref } from './model'
import { CarryoverScreen } from './screens/CarryoverScreen'
import { ImpactScreen } from './screens/ImpactScreen'
import { TraceScreen } from './screens/TraceScreen'
import { LanesScreen } from './screens/LanesScreen'
import { TestDetailScreen } from './screens/TestDetailScreen'
import { ApproveScreen } from './screens/ApproveScreen'
import { MappingScreen } from './screens/MappingScreen'

/** One route, `/create/requirements/:step`, switches the screen. Every selection is a query parameter, so every state is a URL. */
export function RequirementsApp() {
  const { step } = useParams()
  switch (step) {
    case '05-mapping': return <MappingScreen />
    case '06-carryover': return <CarryoverScreen />
    case '06b-impact': return <ImpactScreen />
    case '06c-trace': return <TraceScreen />
    case '03c-trace': return <LanesScreen />
    case 'test': return <TestDetailScreen />
    case '07-approve': return <ApproveScreen />
    default: return <Navigate to={stepHref('05-mapping')} replace />
  }
}
