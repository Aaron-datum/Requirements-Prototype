import { buildAppConfig } from '../../config/appConfig'
import type { TestMatcher } from '../../domain/types'
import { linkByReq } from '../../fixtures/civic'
import { testCandidates } from '../../fixtures/derive-requirements'
import { useAppStore } from '../../stores/appStore'
import { delay } from '../latency'

// OWNER: Phase 6 (requirements). StubId: test-matcher.
/** Static mappings from requirement_test_links.json plus the alternates in extras. Candidates below the test-match floor (config) are dropped. */
export const testsStub: TestMatcher = {
  proposeTests: (reqId) => {
    const link = linkByReq[reqId]
    if (!link) return delay([])
    const floor = buildAppConfig(useAppStore.getState().tenantId).thresholds.testMatchFloor
    return delay(testCandidates({ req_id: reqId, link }, floor))
  },
}
