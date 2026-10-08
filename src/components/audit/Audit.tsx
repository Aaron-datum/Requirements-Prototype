import { Check } from 'lucide-react'
import { useConfig, useVocab } from '../../config/useConfig'
import { useService } from '../../services/context'
import type { ApprovalState, AuditEntry } from '../../domain/types'
import { useLedger } from '../../stores/ledgerStore'
import { toastSuccess } from '../../stores/toastStore'
import { Stub } from '../stub/Stub'
import { Badge, Button } from '../ui'
import s from './Audit.module.css'

export const formatAt = (iso: string): string => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`

/** One audit entry. The audit trail is the record; the toast is only the feedback. */
export function AuditEntryRow({ entry }: { entry: AuditEntry }) {
  return (
    <div className={s.entry} data-testid="audit-entry">
      <span className="data muted">{formatAt(entry.at)}</span>
      <span className={s.by}>{entry.by}</span>
      <span className="grow">{entry.action}{entry.note ? <span className="muted"> · {entry.note}</span> : null}</span>
      <span className="data muted">{entry.subject.type}:{entry.subject.id}</span>
    </div>
  )
}

/** Audit list for a subject (or everything). Reads the ledger so it updates live and across tabs. */
export function AuditList({ subject, limit = 8, emptyText = 'No audit entries yet.' }: { subject?: { type: string; id: string }; limit?: number; emptyText?: string }) {
  const all = useLedger((l) => l.audit)
  const rows = (subject ? all.filter((a) => a.subject.type === subject.type && a.subject.id === subject.id) : all).slice(0, limit)
  return (
    <Stub id="audit-trail" note="In-memory ledger">
      <div className={s.list}>{rows.length ? rows.map((e) => <AuditEntryRow key={e.id} entry={e} />) : <div className="muted">{emptyText}</div>}</div>
    </Stub>
  )
}

/**
 * Status badge plus a Confirm action for the workflow approval lifecycle (config: matchRules.approval).
 * Confirming changes the status to the confirmed value, writes an audit entry (time, actor) and shows a success toast.
 */
export function ApprovalButton({ approval, subject, label, onConfirmed }: {
  approval: ApprovalState | undefined; subject: { type: string; id: string }; label?: string; onConfirmed?: (next: ApprovalState) => void
}) {
  const config = useConfig()
  const vocab = useVocab()
  const audit = useService('audit')
  const status = approval?.status
  if (!status) return null
  const resolved = vocab.resolve('workflowApproval', status)
  const pending = status === config.matchRules.approval.pendingRaw
  const confirm = () => {
    const entry = audit.record({ by: config.currentUser.name, action: `Confirmed ${label ?? 'decision'}`, subject })
    toastSuccess(`${resolved.label === status ? 'Confirmed' : vocab.resolve('workflowApproval', config.matchRules.approval.confirmedRaw).label}: ${label ?? subject.id}`)
    onConfirmed?.({ status: config.matchRules.approval.confirmedRaw, audit: [entry, ...(approval?.audit ?? [])] })
  }
  return (
    <span className={s.approval}>
      <Badge tone={resolved.tone}>{!pending && <Check size={12} aria-hidden />}{resolved.label}</Badge>
      {pending && <Button size="sm" onClick={confirm}>Confirm</Button>}
    </span>
  )
}
