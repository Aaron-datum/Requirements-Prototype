import type { DocExtraction } from '../../domain/types'
import { INTAKE, intakePackage, requirementScope } from '../../fixtures/derive-bom'
import { delay } from '../latency'

/** StubId: doc-extraction. OWNER: Phase 5 (BOM). Static package list with detected types, counts and routes (fixtures/extras/bom/intake.json). */
export const docsStub: DocExtraction = {
  listPackage: async (rfqId) => delay(rfqId === INTAKE.rfqId ? intakePackage() : []),
  countRequirements: async (rfqId) => {
    const s = requirementScope()
    return delay(rfqId === INTAKE.rfqId ? { extracted: s.extracted, implicated: s.inScope } : { extracted: 0, implicated: 0 })
  },
}
