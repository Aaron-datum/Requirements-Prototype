import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuditList } from '../../../../components/audit/Audit'
import { MatchQuality } from '../../../../components/quality/MatchQuality'
import { SidePanel } from '../../../../components/panels/Panels'
import { Stub } from '../../../../components/stub/Stub'
import { TableShell } from '../../../../components/table/TableShell'
import type { ColumnDef } from '../../../../components/table/types'
import { useBreadcrumbs } from '../../../../components/shell/useBreadcrumbs'
import { Badge, Button, LinkButton, SkeletonRows, Tabs, TextInput } from '../../../../components/ui'
import { testById } from '../../../../fixtures/civic'
import { bulkAcceptPlan, type ReqView } from '../../../../fixtures/derive-requirements'
import { REQUIREMENT_RULES } from '../../../../fixtures/extras/requirements/rules'
import type { TestCandidateRow } from '../../../../fixtures/extras/requirements/types'
import { useService } from '../../../../services/context'
import { RecordedNote, useReqActions } from '../actions'
import { BomLineSection, DeltaLine } from '../components/panelParts'
import { ClauseSection, DrivenByCell, ReqTitle, ScreenHeader, Section, SeverityBadge, SourceCell, Stepper, TextBadge, VocabBadge } from '../components/shared'
import { startCollapsed, stepHref, useParam, useReqModel } from '../model'
import { useReqVocab } from '../vocab'
import { useConfig } from '../../../../config/useConfig'
import s from '../req.module.css'

type Tab = 'all' | 'review' | 'decided'

/** 05 Requirement to test mapping: review proposed tests for the requirements that were not auto-accepted. */
export function MappingScreen() {
  const m = useReqModel()
  const act = useReqActions()
  const tests = useService('tests')
  const vocab = useReqVocab()
  const { config } = m
  const [sel, setSel] = useParam('req')
  const [tab, setTab] = useState<Tab>('all')
  const [floor, setFloor] = useState(REQUIREMENT_RULES.bulkAcceptDefault)
  const [cands, setCands] = useState<Record<string, TestCandidateRow[]> | null>(null)
  const [bulkNote, setBulkNote] = useState<string | null>(null)
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: 'RFQ-26-0512' }, { label: 'Requirement to test mapping' }])

  const review = useMemo(() => m.rows.filter((r) => r.needsMapping), [m.rows])
  useEffect(() => {
    let live = true
    void Promise.all(review.map(async (r) => [r.req_id, await tests.proposeTests(r.req_id)] as const)).then((e) => live && setCands(Object.fromEntries(e)))
    return () => { live = false }
  }, [review, tests])

  const decided = review.filter((r) => r.mapping === 'accepted' || r.mapping === 'rejected')
  const rows = tab === 'all' ? review : tab === 'review' ? review.filter((r) => r.mapping === 'proposed') : decided
  const auto = m.rows.filter((r) => r.mapping === 'auto')
  const plan = useMemo(() => bulkAcceptPlan(review, floor, config.matchRules.changedRaw), [review, floor, config.matchRules.changedRaw])
  const held = plan.held.changed.length + plan.held.dangerous.length
  const textCount = (raw: string) => review.filter((r) => r.text_status === raw).length
  const selected = review.find((r) => r.req_id === sel) ?? null
  const severityOrder = config.vocabularies.find((v) => v.id === 'severity')?.values.map((v) => v.raw)

  const columns: Array<ColumnDef<ReqView>> = [
    { key: 'title', label: 'Requirement', group: 'Requirement', pinned: true, filter: 'text-search', get: (r) => `${r.title} ${r.req_id} ${r.linked_part_id}`, render: (r) => <ReqTitle r={r} />, width: 280 },
    { key: 'source', label: 'Source', group: 'Requirement', filter: 'multi-tag', get: (r) => r.source_type, label_of: (x) => vocab.label('sourceType', x), render: (r) => <SourceCell r={r} /> },
    { key: 'text', label: 'Text', group: 'Change', filter: 'multi-tag', get: (r) => r.text_status, label_of: (x) => vocab.label('textStatus', x), render: (r) => <TextBadge state={r.text_status} /> },
    { key: 'driven', label: 'Driven by', group: 'Change', filter: 'multi-tag', get: (r) => r.driven.state, label_of: (x) => vocab.label('textStatus', x), render: (r) => <DrivenByCell r={r} />, defaultVisible: false },
    { key: 'bom', label: 'BOM line', group: 'Part', filter: 'multi-search', get: (r) => r.linked_part_id, render: (r) => <span className="data">{r.linked_part_id}</span> },
    { key: 'test', label: 'Proposed test', group: 'Test', filter: 'multi-search', get: (r) => r.chosenTestId, render: (r) => <div className={s.cell}><span>{testById[r.chosenTestId]?.name}</span><span className={s.id}>{r.chosenTestId}</span></div> },
    { key: 'conf', label: 'Confidence', group: 'Test', filter: 'range-units', unit: '%', align: 'right', get: (r) => r.chosenConfidence, render: (r) => <MatchQuality quality={{ confidence: r.chosenConfidence != null ? { score: r.chosenConfidence, why: cands?.[r.req_id]?.find((c) => c.testId === r.chosenTestId)?.reasoning } : { label: 'No score' } }} /> },
    { key: 'severity', label: 'Severity', group: 'Action', filter: 'level-seg', order: severityOrder, label_of: (x) => vocab.label('severity', x), get: (r) => r.severity, render: (r) => <SeverityBadge value={r.severity} /> },
    { key: 'owner', label: 'Owner', group: 'Action', filter: 'multi-tag', get: (r) => r.ownerShort, render: (r) => <span>{r.ownerShort}</span> },
    { key: 'decision', label: 'Decision', group: 'Action', filter: 'multi-tag', get: (r) => r.mapping, label_of: (x) => vocab.label('mappingState', x), render: (r) => <DecisionCell r={r} /> },
  ]

  const bulk = () => {
    act.bulkAccept(plan.eligible, floor)
    setBulkNote(`Accepted ${plan.eligible.length}. Held back for individual review: ${plan.held.changed.length} Changed or New, ${plan.held.dangerous.length} driver changed, ${plan.held.noScore.length} with no score.`)
  }

  return (
    <div className={s.screen}>
      <Stepper current="05-mapping" counts={{ '05-mapping': review.length - decided.length, '06-carryover': m.stats.needDecision }} />
      <ScreenHeader title="Review requirement to test mapping"
        sub={<>New and changed requirements with no surrogate evidence · {m.rows.length} in scope · <span className="data" data-testid="reviewed-count">Reviewed {decided.length} of {review.length}</span></>}
        actions={<Link to={stepHref('06-carryover')}><Button primary>Continue to Carryover Review</Button></Link>} />
      <div className={s.head} style={{ paddingTop: 'var(--gap-2)', paddingBottom: 'var(--gap-2)', alignItems: 'center' }}>
        <Tabs<Tab> value={tab} onChange={setTab} label="Mapping filter" tabs={[{ key: 'all', label: 'All', count: review.length }, { key: 'review', label: 'Needs review', count: review.length - decided.length }, { key: 'decided', label: 'Decided', count: decided.length }]} />
        <span className="secondary">Text · New {textCount('New')} · Changed {textCount('Changed')}</span>
        <span className="right row" title="Bulk accept never takes a Changed or New requirement, a dangerous case, or a row without a score">
          <label className="secondary" htmlFor="bulk-floor">Accept all at or above</label>
          <TextInput id="bulk-floor" type="number" min={0} max={100} value={floor} style={{ width: 72 }} onChange={(e) => setFloor(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
          <Button disabled={plan.eligible.length === 0} onClick={bulk} aria-label={`Accept all at or above ${floor} percent`}>Accept all ≥ {floor}%</Button>
        </span>
      </div>
      <div className="row wrap secondary" style={{ padding: 'var(--gap-1) var(--gap-4)', gap: 'var(--gap-4)' }}>
        <span data-testid="auto-accepted">{auto.length} mapped at ≥ {config.thresholds.autoAcceptAt}% and accepted automatically. <Link to={stepHref('06c-trace')}>See them in the trace</Link></span>
        <span role="status" data-testid="bulk-preview">At {floor}% or above, {plan.eligible.length} can be accepted in bulk. {held} Changed or driver-changed and {plan.held.noScore.length} unscored rows need individual review.{bulkNote ? <b> {bulkNote}</b> : null}</span>
      </div>
      <div className={s.workspace}>
        {cands == null ? <div style={{ flex: 1 }}><SkeletonRows rows={8} label="Loading proposed tests" /></div> : (
          <Stub id="test-matcher" note="Static mappings from requirement_test_links.json, floor from config">
            <TableShell sidebarCollapsed={startCollapsed()} id="map" noun="requirements" columns={columns} rows={rows} rowId={(r) => r.req_id} selectedId={selected?.req_id} onSelect={setSel}
              rowTone={(r) => (r.rowDanger ? 'danger' : undefined)} empty={{ title: 'No requirements in this tab.' }} />
          </Stub>
        )}
        <SidePanel defaultWidth={360} title={selected ? selected.req_id : 'Requirement'} subtitle={selected?.linked_part_id} badge={selected ? <TextBadge state={selected.text_status} /> : undefined}
          onClose={selected ? () => setSel(null) : undefined} empty={selected ? undefined : <>Select a requirement to see its clause and candidate tests.</>}
          footer={selected ? <MappingFooter r={selected} /> : undefined}>
          {selected && <MappingPanel r={selected} cands={cands?.[selected.req_id] ?? []} />}
        </SidePanel>
      </div>
    </div>
  )
}

function DecisionCell({ r }: { r: ReqView }) {
  const act = useReqActions()
  if (r.mapping === 'proposed') {
    return <span className="row"><Button size="sm" aria-label={`Accept ${r.req_id}`} onClick={() => act.accept(r)}>Accept</Button><Button size="sm" aria-label={`Reject ${r.req_id}`} onClick={() => act.reject(r)}>Reject</Button></span>
  }
  return <span className="row"><VocabBadge vocab="mappingState" raw={r.mapping} /><LinkButton aria-label={`Undo ${r.req_id}`} onClick={() => act.undoMapping(r)}>Undo</LinkButton></span>
}

function MappingFooter({ r }: { r: ReqView }) {
  const act = useReqActions()
  return r.mapping === 'proposed'
    ? <><Button primary onClick={() => act.accept(r)}>Accept mapping</Button><Button onClick={() => act.reject(r)}>Reject</Button></>
    : <><VocabBadge vocab="mappingState" raw={r.mapping} /><LinkButton onClick={() => act.undoMapping(r)}>Undo</LinkButton></>
}

/** Panel order (docs/01): clause, source and citation, delta line, BOM line, Why this test, candidate tests. */
function MappingPanel({ r, cands }: { r: ReqView; cands: TestCandidateRow[] }) {
  const act = useReqActions()
  const floor = useConfig().thresholds.testMatchFloor
  const chosen = cands.find((c) => c.testId === r.chosenTestId) ?? cands[0]
  const conf = r.chosenConfidence
  return (
    <>
      <ClauseSection r={r} />
      <DeltaLine r={r} />
      {r.rowDanger && <div className={`${s.banner} ${s.bannerFail}`}>Driver changed. Text is unchanged; what it traces to has changed.</div>}
      <BomLineSection r={r} />
      <Section title="Why this test" right={<Badge tone="outline" title="The confidence and the candidate percent are the same figure">AI-inferred · <span className="data">{conf != null ? `${conf}%` : 'n/a'}</span></Badge>}>
        <div className="row wrap">{chosen?.tags.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}</div>
        <ul style={{ margin: 0, paddingLeft: 'var(--gap-4)' }}>{chosen?.reasoning.map((x) => <li key={x}>{x}</li>)}</ul>
      </Section>
      <Section title={`Candidate tests · ${cands.length}`}>
        {cands.map((c) => {
          const t = testById[c.testId]
          const on = c.testId === r.chosenTestId
          return (
            <div key={c.testId} className={`${s.card} ${on ? s.cardSel : ''}`} data-testid="candidate">
              <label className={s.pick}>
                <input type="radio" name={`cand-${r.req_id}`} checked={on} disabled={r.mapping === 'accepted'} onChange={() => act.chooseTest(r, c.testId)} aria-label={`Use ${t?.name} as the proposed test`} />
                <span className="grow col" style={{ gap: 2 }}><span className={s.strong}>{t?.name}</span><span className={s.id}>{c.testId} · {t?.standard}</span></span>
                <span className="data">{c.confidence != null ? `${c.confidence}%` : 'n/a'}</span>
              </label>
              <span className="row"><Link to={stepHref('test', `test=${c.testId}&from=${r.req_id}&back=05-mapping`)}>View Test</Link>{on && <Badge tone="info">Proposed</Badge>}</span>
            </div>
          )
        })}
        <span className="muted">Candidates below the test-match floor ({floor}%) are not offered.</span>
      </Section>
      <Section title="Decision history"><AuditList subject={{ type: 'requirement', id: r.req_id }} limit={3} emptyText="No decision yet." /><RecordedNote /></Section>
    </>
  )
}
