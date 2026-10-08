import type { DiffEngine } from '../../domain/types'
// OWNER: Phase 6 (requirements). StubId: diff-engine.
export const diffStub: DiffEngine = {
  textDelta: () => ({ state: 'Unchanged' }),
  drivenBy: () => ({ interface: '', state: 'Unchanged', score: null, confirmed: false }),
}
