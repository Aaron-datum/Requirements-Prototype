import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuditList } from '../../../../components/audit/Audit'
import { Stub } from '../../../../components/stub/Stub'
import { useBreadcrumbs } from '../../../../components/shell/useBreadcrumbs'
import { Button, Checkbox, EmptyState, TextInput } from '../../../../components/ui'
import { RFQ_ID, testById } from '../../../../fixtures/civic'
import { REQUIREMENTS_SCOPE } from '../../../../fixtures/extras/requirements/interfaces'
import { useService } from '../../../../services/context'
import { PLAN_INERT } from '../../../../services/stubs/plan'
import { RecordedNote, useReqActions } from '../actions'
import { ScreenHeader, SeverityBadge, Stepper, VocabBadge } from '../components/shared'
import { stepHref, useReqModel } from '../model'
import { useReqVocab } from '../vocab'
import s from '../req.module.css'

/** 07 Approve and create the plan: one receipt, one acknowledgement, one approval. Every count is derived from the decisions on 05 and 06. */
export function ApproveScreen() {
  const m = useReqModel()
  const act = useReqActions()
  const plan = useService('plan')
  const vocab = useReqVocab()
  const { config, summary: sum, decisions } = m
  const label = config.planLabel
  const created = decisions.plan
  const [name, setName] = useState(`DV ${label} · ${REQUIREMENTS_SCOPE.programName} ${REQUIREMENTS_SCOPE.modelYear}`)
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: RFQ_ID }, { label: `Approve and create ${label}` }])
  const open = sum.open.length
  const approve = async () => { setBusy(true); await act.approvePlan(name.trim() || label, plan.create); setBusy(false) }

  return (
    <div className={s.screen}>
      <Stepper current="07-approve" counts={{ '06-carryover': m.stats.needDecision }} />
      <ScreenHeader title={created ? `${label} created` : `Approve and create ${label}`}
        sub={<>{REQUIREMENTS_SCOPE.programName} · {REQUIREMENTS_SCOPE.modelYear} · {REQUIREMENTS_SCOPE.gate} · everything below is committed in one record</>} />
      <div className={s.scroll}><div className={s.page}>
        <div className={s.tiles}>
          <div className={s.tile} data-testid="tile-carried"><span className="text-label-caps">Carried over · evidence linked</span><span className={s.stat}>{sum.carried.length}</span><span className="secondary">requirements closed by existing test reports</span></div>
          <div className={s.tile} data-testid="tile-routed"><span className="text-label-caps">Routed to new tests</span><span className={s.stat}>{sum.routed.length}</span><span className="secondary">requirements across {sum.tests.length} test{sum.tests.length === 1 ? '' : 's'}</span></div>
          <div className={`${s.tile} ${open > 0 ? s.tileWarn : ''}`} data-testid="tile-open"><span className="text-label-caps">Still open</span><span className={s.stat}>{open}</span><span className="secondary">stay Undetermined and carry an owner</span></div>
        </div>
        <div className="row wrap" style={{ alignItems: 'flex-start', gap: 'var(--gap-4)' }}>
          <div className="col grow" style={{ gap: 'var(--gap-4)', minWidth: 320 }}>
            <section className={s.list} aria-label="New tests"><div className={s.listHead}><span className="grow">New tests</span><span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>reviewed mappings + requirements moved to Gap</span></div>
              <table className={s.table}><thead><tr><th>Test</th><th>BOM lines</th><th className={s.num}>Requirements</th></tr></thead><tbody>
                {sum.tests.length === 0 && <tr><td colSpan={3} className="muted">No mappings accepted yet.</td></tr>}
                {sum.tests.map((t) => (
                  <tr key={t.testId} data-testid="new-test-row"><td><div>{testById[t.testId]?.name}</div><div className={s.id}>{t.testId}</div></td><td className="data">{t.partIds.join(', ')}</td><td className={s.num}>{t.reqs.length}</td></tr>
                ))}
              </tbody></table>
              <div className="muted" style={{ padding: 'var(--gap-3) var(--gap-4)', borderTop: '1px solid var(--border-default)' }} data-testid="auto-line">+ auto-accepted mappings covering {sum.autoReqs.length} requirements in {sum.autoTests} tests</div>
            </section>
            <section className={s.list} aria-label="Still open"><div className={s.listHead}><span className="grow">Still open</span><span className="data" data-testid="open-count">{open}</span></div>
              {open === 0 && <EmptyState title="Nothing is open.">All requirements are carried over or routed.</EmptyState>}
              {sum.open.map(({ req, reasons }) => (
                <Link key={req.req_id} to={reasons.includes('evidence') ? stepHref('06-carryover', `req=${req.req_id}`) : stepHref('05-mapping', `req=${req.req_id}`)} className={s.item} style={{ color: 'inherit', textDecoration: 'none' }} data-testid="open-row" data-req={req.req_id}>
                  <span className={s.cell} style={{ flex: 1 }}>
                    <span>{req.title}</span>
                    <span className="row wrap"><span className={s.id}>{req.req_id} · {req.linked_part_id}</span>{reasons.map((x) => <VocabBadge key={x} vocab="openReason" raw={x} />)}</span>
                  </span>
                  <span className="col" style={{ alignItems: 'flex-end', gap: 2 }}><SeverityBadge value={req.severity} /><span className="secondary" data-testid="open-owner">{req.ownerShort}</span><span className="data muted">due {req.due}</span></span>
                </Link>
              ))}
            </section>
          </div>
          <div className="col" style={{ flex: '0 0 380px', maxWidth: '100%', gap: 'var(--gap-3)' }}>
            {created ? (
              <Stub id="plan-service" note="Hard-coded plan ID. Export and Open in PLM are inert">
                <section className={s.card} data-testid="created">
                  <span className="text-section">{label} created</span>
                  <dl className={s.kv}><dt>Plan ID</dt><dd data-testid="plan-id">{created.planId}</dd><dt>Name</dt><dd>{created.name}</dd><dt>Approved by</dt><dd>{created.by}</dd><dt>At</dt><dd>{created.at.slice(0, 16).replace('T', ' ')}</dd></dl>
                  <span className={s.secHead}>Audit</span>
                  <AuditList subject={{ type: 'plan', id: created.planId }} limit={3} />
                  <div className="row wrap">
                    <span title={PLAN_INERT.exportTdm}><Button disabled aria-describedby="plan-inert">Export TDM</Button></span>
                    <span title={PLAN_INERT.openInPlm}><Button disabled aria-describedby="plan-inert">Open in PLM</Button></span>
                  </div>
                  <span className="muted" id="plan-inert">Export TDM and Open in PLM are not connected.</span>
                </section>
              </Stub>
            ) : (
              <section className={s.card}>
                <label className="col" style={{ gap: 4 }}><span className="text-label-caps">{label} name</span><TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label={`${label} name`} /></label>
                <dl className={s.kv}>
                  <dt>Gate</dt><dd>{REQUIREMENTS_SCOPE.gate}</dd><dt>Owner</dt><dd>{REQUIREMENTS_SCOPE.planOwner.split(' (')[0]}</dd>
                  <dt>Source BOM</dt><dd>{REQUIREMENTS_SCOPE.bomId}</dd><dt>Requirement sources</dt><dd>{REQUIREMENTS_SCOPE.sources}</dd>
                </dl>
                <Checkbox checked={ack} onChange={setAck} label={<span style={{ whiteSpace: 'normal' }}>{open > 0 ? `I've reviewed the ${open} open requirements. They stay Undetermined in the ${label} with an owner.` : `I've reviewed this receipt. No requirement stays open.`}</span>} />
                <Button primary size="lg" disabled={!ack || busy} onClick={() => void approve()}>Approve and Create {label}</Button>
                <RecordedNote />
              </section>
            )}
            {sum.open.some((x) => x.reasons.includes('unreviewed')) && !created && <span className="muted">{vocab.label('openReason', 'unreviewed')} rows can still be reviewed on <Link to={stepHref('05-mapping')}>Test mapping</Link>.</span>}
          </div>
        </div>
      </div></div>
    </div>
  )
}
