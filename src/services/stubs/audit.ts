import type { AuditEntry, AuditService } from '../../domain/types'
import { now } from '../../lib/clock'
import { useLedger } from '../../stores/ledgerStore'

/** StubId: audit-trail. In-memory list (mirrored across tabs by the ledger store). Every confirm, approve and decision writes one. */
let seq = 0
export const auditStub: AuditService = {
  record(e) {
    const entry: AuditEntry = { ...e, id: `aud-${Date.now().toString(36)}-${++seq}`, at: now() }
    useLedger.getState().addAudit(entry)
    return entry
  },
  list(subject) {
    const all = useLedger.getState().audit
    return subject ? all.filter((a) => a.subject.type === subject.type && a.subject.id === subject.id) : all
  },
}
