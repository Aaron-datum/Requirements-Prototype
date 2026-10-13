import { Navigate, useParams } from 'react-router-dom'
import { stepHref } from './model'
import { CarryoverScreen } from './screens/CarryoverScreen'
import { MappingScreen } from './screens/MappingScreen'

/** One route, `/create/requirements/:step`, switches the screen. Every selection is a query parameter, so every state is a URL. */
export function RequirementsApp() {
  const { step } = useParams()
  switch (step) {
    case '05-mapping': return <MappingScreen />
    case '06-carryover': return <CarryoverScreen />
    default: return <Navigate to={stepHref('05-mapping')} replace />
  }
}
