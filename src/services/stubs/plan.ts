import type { PlanService } from '../../domain/types'
import { delay } from '../latency'
/** StubId: plan-service. Hard-coded plan ID. Export and Open in PLM stay inert. */
export const PLAN_ID = 'TP-CIV26-0007'
export const planStub: PlanService = {
  create: () => delay({ planId: PLAN_ID }),
}
