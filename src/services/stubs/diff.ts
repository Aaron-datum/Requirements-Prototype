import type { DiffEngine } from '../../domain/types'
import { requirementById } from '../../fixtures/civic'
import { KEYS } from '../../fixtures/derive-requirements'
import { DELTA_BY_REQ, INTERFACE_BY_REQ } from '../../fixtures/extras/requirements/interfaces'
import { useLedger } from '../../stores/ledgerStore'

// OWNER: Phase 6 (requirements). StubId: diff-engine.
/** Lookup from the requirement statuses in the dataset. The interface comes from extras; confirmation comes from the ledger. */
export const diffStub: DiffEngine = {
  textDelta: (reqId) => ({ state: requirementById[reqId]?.text_status ?? 'Unchanged', delta: DELTA_BY_REQ[reqId] }),
  drivenBy: (reqId) => {
    const r = requirementById[reqId]
    const iface = INTERFACE_BY_REQ[reqId]
    return {
      interface: iface?.label ?? '',
      state: r?.driven_by_status ?? 'Unchanged',
      score: r?.driven_by_confidence ?? null,
      confirmed: !!iface && !!useLedger.getState().decisions[KEYS.iface(iface.id)],
    }
  },
}
