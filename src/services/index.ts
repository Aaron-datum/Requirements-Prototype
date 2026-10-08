import type { Services } from '../domain/types'
import { auditStub } from './stubs/audit'
import { catalogueStub } from './stubs/catalogue'
import { compareStub } from './stubs/compare'
import { costStub } from './stubs/cost'
import { dashboardStub } from './stubs/dashboard'
import { diffStub } from './stubs/diff'
import { docsStub } from './stubs/docs'
import { engineStub } from './stubs/matchingEngine'
import { evidenceStub } from './stubs/evidence'
import { gateStub } from './stubs/gate'
import { impactStub } from './stubs/impact'
import { mappingStub } from './stubs/mapping'
import { persistenceStub } from './stubs/persistence'
import { planStub } from './stubs/plan'
import { plmStub } from './stubs/plm'
import { testsStub } from './stubs/tests'
import { viewerStub } from './stubs/viewer'

/** Build the Services object. Stubs are pure and seeded: the same click always yields the same result. */
export function createServices(): Services {
  return {
    engine: engineStub, viewer: viewerStub, compare: compareStub, catalogue: catalogueStub, plm: plmStub,
    mapping: mappingStub, docs: docsStub, cost: costStub, tests: testsStub, diff: diffStub, evidence: evidenceStub,
    impact: impactStub, gate: gateStub, audit: auditStub, plan: planStub, persistence: persistenceStub, dashboard: dashboardStub,
  }
}
