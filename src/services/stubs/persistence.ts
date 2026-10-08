import type { PersistenceService } from '../../domain/types'
import { now } from '../../lib/clock'
import { useLedger } from '../../stores/ledgerStore'
import { useProjectStore, type SavedItem } from '../../stores/projectStore'
import { toastSuccess } from '../../stores/toastStore'

/** StubId: persistence. In-memory. Save adds to the visible Project tree and shows a success toast. reset() restores everything. */
let seq = 0
export const persistenceStub: PersistenceService = {
  async save(kind, value) {
    const v = value as Partial<SavedItem> & { title?: string }
    const id = `${kind}-${++seq}`
    const item: SavedItem = { id, kind, title: v.title ?? `Saved ${kind}`, href: v.href, projectId: v.projectId ?? 'p-civic-si', meta: v.meta, at: now() }
    useProjectStore.getState().add(kind, item)
    toastSuccess(`${kind === 'view' ? 'View' : kind === 'search' ? 'Search' : 'Item'} saved: ${item.title}`)
    return { id }
  },
  reset() {
    useProjectStore.getState().reset()
    useLedger.getState().reset()
  },
}
