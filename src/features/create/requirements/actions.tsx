import { useMemo } from 'react'
import { useConfig } from '../../../config/useConfig'
import { KEYS, type EvidenceProvenance, type ReqView } from '../../../fixtures/derive-requirements'
import { evidenceStore } from '../../../services/stubs/evidence'
import { now } from '../../../lib/clock'
import { useService } from '../../../services/context'
import { Stub } from '../../../components/stub/Stub'
import { useLedger } from '../../../stores/ledgerStore'
import { toastSuccess } from '../../../stores/toastStore'

/** Shown beside actions: the record of a decision is the audit entry, the toast is only the feedback. */
export function RecordedNote() {
  return <Stub id="audit-trail" note="In-memory ledger"><span className="muted">Every decision is written to the audit trail with time and actor.</span></Stub>
}

/**
 * Every decision on screens 05 to 07: write it to the ledger (so counts and other screens update live, across tabs),
 * write an audit entry (time, actor) through the audit service, then toast. Undo writes its own audit entry.
 */
export function useReqActions() {
  const audit = useService('audit')
  const plan = useService('plan')
  const config = useConfig()
  const by = config.currentUser.name
  return useMemo(() => {
    const L = () => useLedger.getState()
    const set = (key: string, value: string) => L().setDecision(key, value, now(), by)
    const rec = (reqId: string, action: string, note?: string) => audit.record({ by, action, subject: { type: 'requirement', id: reqId }, note })
    return {
      accept(r: ReqView) { set(KEYS.map(r.req_id), 'accepted'); set(KEYS.test(r.req_id), r.chosenTestId); rec(r.req_id, 'Accepted test mapping', r.chosenTestId); toastSuccess(`Accepted: ${r.req_id} to ${r.chosenTestId}`) },
      reject(r: ReqView) { set(KEYS.map(r.req_id), 'rejected'); rec(r.req_id, 'Rejected test mapping, test plan needed', r.chosenTestId); toastSuccess(`Rejected: ${r.req_id}, test plan needed`) },
      undoMapping(r: ReqView) { L().clearDecision(KEYS.map(r.req_id)); rec(r.req_id, 'Reopened test mapping'); toastSuccess(`Mapping reopened: ${r.req_id}`) },
      chooseTest(r: ReqView, testId: string) { if (testId === r.chosenTestId) return; set(KEYS.test(r.req_id), testId); rec(r.req_id, 'Changed proposed test', `${r.chosenTestId} to ${testId}`); toastSuccess(`Proposed test for ${r.req_id}: ${testId}`) },
      bulkAccept(list: ReqView[], floor: number) {
        list.forEach((r) => { set(KEYS.map(r.req_id), 'accepted'); set(KEYS.test(r.req_id), r.chosenTestId); rec(r.req_id, 'Accepted test mapping', `bulk accept at ${floor}% or above`) })
        toastSuccess(`Accepted ${list.length} mapping${list.length === 1 ? '' : 's'} at ${floor}% or above`)
      },
      confirmTransfer(reqId: string) { set(KEYS.transfer(reqId), '1') },
      linkEvidence(r: ReqView, recordId: string, provenance: EvidenceProvenance) {
        set(KEYS.carry(r.req_id), JSON.stringify({ kind: 'linked', recordId, provenance })); if (!r.transferConfirmed) set(KEYS.transfer(r.req_id), '1')
        rec(r.req_id, 'Linked evidence', `${recordId} (${provenance}). Applies to this requirement only`); toastSuccess(`Evidence linked: ${r.req_id} to ${recordId}`)
      },
      moveToGap(r: ReqView) { set(KEYS.carry(r.req_id), JSON.stringify({ kind: 'gap' })); rec(r.req_id, 'Moved to Gap'); toastSuccess(`Moved to Gap: ${r.req_id}`) },
      undoCarry(r: ReqView) { L().clearDecision(KEYS.carry(r.req_id)); rec(r.req_id, 'Reopened carryover decision'); toastSuccess(`Reopened: ${r.req_id}`) },
      addCandidate(reqId: string, recordId: string) { set(KEYS.cand(reqId, recordId), '1'); rec(reqId, 'Added evidence candidate (asserted, not computed)', recordId); toastSuccess(`Candidate added: ${recordId}`) },
      upload(reqId: string, fileName: string) {
        const r = evidenceStore.upload({ fileName, by, reqId }); rec(reqId, 'Uploaded proof (asserted, not computed)', `${r.id} ${fileName}`); toastSuccess(`Uploaded: ${fileName}, asserted not computed`); return r
      },
      verifyRecord(reqId: string, recordId: string) { evidenceStore.verify(recordId, by); rec(reqId, 'Verified evidence record', recordId); toastSuccess(`Verified: ${recordId}`) },
      confirmChanged(r: ReqView, sharing: ReqView[]) {
        set(KEYS.iface(r.interfaceId), '1')
        sharing.forEach((x) => rec(x.req_id, 'Confirmed Driven by Changed', `${x.interfaceLabel}. Applies to ${sharing.length} requirement${sharing.length === 1 ? '' : 's'} sharing the interface`))
        toastSuccess(`Confirmed Changed: applies to ${sharing.length}`)
      },
      undoConfirmChanged(r: ReqView) { L().clearDecision(KEYS.iface(r.interfaceId)); rec(r.req_id, 'Cleared Confirm Changed', r.interfaceLabel); toastSuccess(`Confirmation cleared: ${r.interfaceLabel}`) },
      flagForReReview(anchor: string, nodeIds: string[], scenario: string, scenarioLabel: string) {
        nodeIds.forEach((id) => { set(KEYS.flag(id), scenario); audit.record({ by, action: 'Flagged for re-review', subject: { type: 'impact-node', id }, note: `Impact of ${anchor}: ${scenarioLabel}` }) })
        toastSuccess(`${nodeIds.length} item${nodeIds.length === 1 ? '' : 's'} flagged for re-review`)
      },
      async approvePlan(name: string) {
        const { planId } = await plan.create({ name, owners: {} })
        set(KEYS.plan, JSON.stringify({ planId, name }))
        audit.record({ by, action: `Approved and created ${config.planLabel}`, subject: { type: 'plan', id: planId }, note: name })
        toastSuccess(`${config.planLabel} created: ${planId}`)
        return planId
      },
    }
  }, [audit, plan, by, config.planLabel])
}
export type ReqActions = ReturnType<typeof useReqActions>
