import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useBreadcrumbs } from '../../../components/shell/useBreadcrumbs'
import { AssemblyTree } from './AssemblyTree'
import { BomReview } from './BomReview'
import { Compare } from './Compare'
import { Composition } from './Composition'
import { CostEstimate } from './CostEstimate'
import { Intake } from './Intake'
import { PipelineStepper } from './PipelineStepper'
import { STEP_TITLE, isStepKey, type StepKey } from './bomConfig'
import { useBomStore } from './bomStore'
import s from './bom.module.css'

/** /create/bom redirects to the step the user was last on. */
export function BomEntry() {
  const last = useBomStore((st) => st.lastStep)
  return <Navigate to={`/create/bom/${isStepKey(last) ? last : '01-intake'}`} replace />
}

const SCREENS: Record<StepKey, () => JSX.Element> = {
  '01-intake': Intake, '02-tree': AssemblyTree, '03-review': BomReview, '03b-compare': Compare, '03d-cost': CostEstimate, '04-composition': Composition,
}

/** The BOM creation pipeline: stepper plus the screen for the :step route param. */
export function BomFlow() {
  const { step } = useParams()
  const key = isStepKey(step) ? step : null
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: 'BOM Creation', to: '/create/bom' }, { label: key ? STEP_TITLE[key] : 'BOM Creation' }])
  useEffect(() => { if (key) useBomStore.getState().setLastStep(key) }, [key])
  if (!key) return <Navigate to="/create/bom/01-intake" replace />
  const Screen = SCREENS[key]
  return (
    <div className={s.flow} data-testid="bom-flow" data-step={key}>
      <PipelineStepper current={key} />
      <div className={s.stage}><Screen /></div>
    </div>
  )
}
