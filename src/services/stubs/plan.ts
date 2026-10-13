import type { PlanService } from '../../domain/types'
import { REQUIREMENTS_SCOPE } from '../../fixtures/extras/requirements/interfaces'
import { delay } from '../latency'

/** StubId: plan-service. Hard-coded plan ID. Export and Open in PLM stay inert, and say why. */
export const PLAN_ID = REQUIREMENTS_SCOPE.planId
export const PLAN_INERT = {
  exportTdm: 'Export TDM is inert in the prototype: there is no TDM writer behind the plan service.',
  openInPlm: 'Open in PLM is inert in the prototype: no PLM connector is attached and nothing is written back.',
} as const
export const planStub: PlanService = {
  create: () => delay({ planId: PLAN_ID }),
}
