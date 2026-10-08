import type { CostModelService } from '../../domain/types'
// OWNER: Phase 5 (BOM). StubId: cost-model.
export const costStub: CostModelService = {
  route: async () => ({ models: [], why: [] }),
  estimate: async () => ({ lines: [], landed: 0, rangePct: 0 }),
}
