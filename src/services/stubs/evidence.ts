import type { EvidenceEngine } from '../../domain/types'
import { KEYS, readDecisions } from '../../fixtures/derive-requirements'
import { EVIDENCE_RECORDS, toCandidateRows } from '../../fixtures/extras/requirements/evidence'
import type { EvidenceRecord, EvidenceStore } from '../../fixtures/extras/requirements/types'
import { now } from '../../lib/clock'
import { useLedger } from '../../stores/ledgerStore'
import { delay } from '../latency'

// OWNER: Phase 6 (requirements). StubIds: evidence-engine (+ evidence-store for records/uploads).

/** evidence-engine: ranked candidates from the carryover events (static scores in extras). The screen applies the evidence floor. */
export const evidenceStub: EvidenceEngine = {
  candidates: (reqId) => delay(toCandidateRows(reqId).map((c) => ({ recordId: c.recordId, score: c.score, provenance: c.provenance }))),
}

const uploads = (): EvidenceRecord[] => readDecisions(useLedger.getState().decisions).uploads
const withVerified = (r: EvidenceRecord): EvidenceRecord => {
  const v = useLedger.getState().decisions[KEYS.verify(r.id)]
  return v ? { ...r, verifiedBy: v.by, verifiedAt: v.at } : r
}

/**
 * evidence-store: eight hard-coded records. An upload creates an in-memory record (kept in the ledger so it survives a reload and
 * reaches other tabs) flagged origin "user-supplied": asserted, not computed, until a reviewer verifies it. No file is stored.
 */
export const evidenceStore: EvidenceStore = {
  list: () => [...EVIDENCE_RECORDS, ...uploads()].map(withVerified),
  get: (id) => evidenceStore.list().find((r) => r.id === id),
  search(query) {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return evidenceStore.list().filter((r) => [r.id, r.title, r.partId ?? '', r.programLabel, r.date ?? '', r.testId ?? ''].join(' ').toLowerCase().includes(q))
  },
  upload({ fileName, by, reqId }) {
    const id = `UP-${String(uploads().length + 1).padStart(4, '0')}`
    const at = now()
    const record: EvidenceRecord = { id, title: fileName, programLabel: 'User-supplied', partId: null, date: at.slice(0, 10), result: 'Unverified', metric: 'Asserted, not computed', testId: null, origin: 'user-supplied', uploadedBy: by }
    const ledger = useLedger.getState()
    ledger.setDecision(KEYS.evidence(id), JSON.stringify(record), at, by)
    ledger.setDecision(KEYS.cand(reqId, id), '1', at, by)
    return record
  },
  verify(id, by) { useLedger.getState().setDecision(KEYS.verify(id), '1', now(), by) },
}
