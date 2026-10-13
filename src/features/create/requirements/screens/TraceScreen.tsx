import { ChevronLeft, ChevronRight, Network } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuditList } from '../../../../components/audit/Audit'
import { BottomDrawer, SidePanel } from '../../../../components/panels/Panels'
import { Stub } from '../../../../components/stub/Stub'
import { TableShell } from '../../../../components/table/TableShell'
import type { ColumnDef, FilterState } from '../../../../components/table/types'
import type { TableModel } from '../../../../components/table/useTableModel'
import { useBreadcrumbs } from '../../../../components/shell/useBreadcrumbs'
import { Badge, Button, IconButton, LinkButton } from '../../../../components/ui'
import { RFQ_ID, testById } from '../../../../fixtures/civic'
import { chainHops, sharingInterface, type ReqView } from '../../../../fixtures/derive-requirements'
import { REQ_STATE } from '../../../../fixtures/semantics'
import { useService } from '../../../../services/context'
import { RecordedNote, useReqActions } from '../actions'
import {
  AssociatedTest, ClauseSection, ConfidencePair, ConformancePill, DrivenByCell, ReqTitle, ScreenHeader, Section, SeverityBadge, SourceCell, Stepper, TextBadge, VocabBadge,
} from '../components/shared'
import { stepHref, useParam, useReqModel } from '../model'
import { useReqVocab } from '../vocab'
import s from '../req.module.css'

/** Saved views (config): a view is a filter state on the table's own columns. */
const SAVED_VIEWS: Array<{ name: string; filters: FilterState }> = [
  { name: 'All requirements', filters: {} },
  { name: 'Look twice', filters: { text: { values: [REQ_STATE.unchanged] }, driven: { values: [REQ_STATE.changed] } } },
  { name: 'Needs a test', filters: { test: { values: ['no-test', 'scope-unclear'] } } },
]

/** 06c Requirement trace: the full table, a panel, and an independent bottom drawer with the full carryover chain. */
export function TraceScreen() {
  const m = useReqModel()
  const docs = useService('docs')
  const vocab = useReqVocab()
  const [sel, setSel] = useParam('req')
  const [drawer, setDrawer] = useState(true)
  const [extracted, setExtracted] = useState(0)
  const [shown, setShown] = useState<number | null>(null)
  const modelRef = useRef<TableModel<ReqView> | null>(null)
  const lastShown = useRef<number | null>(null)
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: RFQ_ID }, { label: 'Requirement trace' }])
  useEffect(() => { let live = true; void docs.countRequirements(RFQ_ID).then((c) => live && setExtracted(c.extracted)); return () => { live = false } }, [docs])

  const selected = m.byId.get(sel ?? '') ?? null
  const severityOrder = m.config.vocabularies.find((v) => v.id === 'severity')?.values.map((v) => v.raw)
  const total = m.rows.length
  const onModel = (t: TableModel<ReqView>) => {
    modelRef.current = t
    if (lastShown.current !== t.sorted.length) { lastShown.current = t.sorted.length; queueMicrotask(() => setShown(t.sorted.length)) }
  }

  const columns: Array<ColumnDef<ReqView>> = [
    { key: 'title', label: 'Requirement', group: 'Requirement', pinned: true, filter: 'text-search', get: (r) => `${r.title} ${r.req_id} ${r.linked_part_id}`, render: (r) => <ReqTitle r={r} />, width: 260 },
    { key: 'subsystem', label: 'Subsystem', group: 'Taxonomy', filter: 'multi-tag', defaultVisible: false, get: (r) => r.subsystem },
    { key: 'part', label: 'Linked part', group: 'Taxonomy', filter: 'multi-search', defaultVisible: false, get: (r) => r.linked_part_id, render: (r) => <span className="data">{r.linked_part_id}</span> },
    { key: 'source', label: 'Source', group: 'Requirement', filter: 'multi-tag', get: (r) => r.source_type, label_of: (x) => vocab.label('sourceType', x), render: (r) => <SourceCell r={r} /> },
    { key: 'text', label: 'Text', group: 'Change', filter: 'multi-tag', get: (r) => r.text_status, label_of: (x) => vocab.label('textStatus', x), render: (r) => <TextBadge state={r.text_status} /> },
    { key: 'driven', label: 'Driven by', group: 'Change', filter: 'multi-tag', get: (r) => r.driven.state, label_of: (x) => vocab.label('textStatus', x), render: (r) => <DrivenByCell r={r} /> },
    { key: 'confidence', label: 'Confidence', group: 'Change', filter: 'multi-tag', defaultVisible: false, get: (r) => (r.driven.confirmed ? 'confirmed' : 'computed'), label_of: (x) => vocab.label('confidenceKind', x), render: (r) => <VocabBadge vocab="confidenceKind" raw={r.driven.confirmed ? 'confirmed' : 'computed'} /> },
    { key: 'test', label: 'Test', group: 'Evidence', filter: 'multi-tag', get: (r) => r.testStatus, label_of: (x) => vocab.label('testStatus', x),
      render: (r) => <div className={s.cell}><span className={s.id}>{r.chosenTestId}</span><span><VocabBadge vocab="testStatus" raw={r.testStatus} /></span></div> },
    { key: 'status', label: 'Status', group: 'Evidence', filter: 'multi-tag', get: (r) => r.conformance, label_of: (x) => vocab.label('conformanceState', x), render: (r) => <ConformancePill raw={r.conformance} /> },
    { key: 'carryover', label: 'Carryover', group: 'Evidence', filter: 'range-units', unit: 'hops', get: (r) => r.hops,
      render: (r) => r.chain.length === 0 ? <span className="muted">No chain</span> : <div className={s.cell}><span className="data">{r.hops} {r.hops === 1 ? 'hop' : 'hops'}</span>{r.ifaceDeltas > 0 && <span className="data muted" title={`${r.ifaceDeltas} interface change${r.ifaceDeltas === 1 ? '' : 's'} in the chain`}>{r.ifaceDeltas} iface Δ</span>}</div> },
    { key: 'owner', label: 'Owner', group: 'Action', filter: 'multi-tag', get: (r) => r.ownerShort, render: (r) => <span>{r.ownerShort}</span> },
    { key: 'severity', label: 'Severity', group: 'Action', filter: 'level-seg', order: severityOrder, label_of: (x) => vocab.label('severity', x), get: (r) => r.severity, render: (r) => <SeverityBadge value={r.severity} /> },
  ]

  return (
    <div className={s.screen}>
      <Stepper current="06c-trace" counts={{ '06-carryover': m.stats.needDecision }} />
      <ScreenHeader title="Requirement trace"
        sub={<><Badge tone="outline">Scope · Civic Si 1.5T · {RFQ_ID}</Badge> <span className="data" data-testid="in-scope">{shown ?? total} of {total} in scope</span>
          <Stub id="doc-extraction" note="Counts from the intake package"><span className="muted"> · scoped to the parts in this BOM{extracted > 0 ? `, out of ${extracted} requirements extracted from the RFQ package` : ''}</span></Stub></>}
        actions={<><Link to={stepHref('06-carryover')}><Button>Carryover Review · {m.stats.needDecision} open</Button></Link></>} />
      <div className={s.workspace}>
        <TableShell id="trace" noun="requirements" columns={columns} rows={m.rows} rowId={(r) => r.req_id} selectedId={selected?.req_id} onSelect={setSel} urlSync onModel={onModel}
          rowTone={(r) => (r.rowDanger ? 'danger' : undefined)}
          toolbar={<span className="row" role="group" aria-label="Saved views">{SAVED_VIEWS.map((v) => <LinkButton key={v.name} onClick={() => modelRef.current?.setFilters(v.filters)}>{v.name}</LinkButton>)}</span>} />
        <SidePanel defaultWidth={380} title={selected ? selected.req_id : 'Requirement'} subtitle={selected?.title} badge={selected ? <ConformancePill raw={selected.conformance} /> : undefined}
          onClose={selected ? () => setSel(null) : undefined} empty={selected ? undefined : <>Select a requirement. Rows marked Driver changed are dangerous cases: the text is Unchanged but the driver has Changed.</>}
          footer={selected ? <TraceActions r={selected} rows={m.rows} /> : undefined}>
          {selected && <TracePanel r={selected} openDrawer={() => setDrawer(true)} />}
        </SidePanel>
      </div>
      <ChainDrawer r={selected} open={drawer} onToggle={setDrawer} />
    </div>
  )
}

function TracePanel({ r, openDrawer }: { r: ReqView; openDrawer: () => void }) {
  const hops = chainHops(r)
  const conf = r.driven.confirmed
  return (
    <>
      {r.rowDanger && <div className={`${s.banner} ${s.bannerFail}`} role="note">Driver changed: the text is Unchanged but the interface it verifies has Changed.</div>}
      <ClauseSection r={r} />
      <Section title="Driven by">
        <span className={s.strong}>{r.interfaceLabel}</span>
        <div className="row wrap"><DrivenByCell r={r} /></div>
        <span className="secondary">{r.notes}</span>
        <span className="muted">{conf ? `Confirmed by ${conf.by} ${conf.at.slice(0, 10)}.` : 'Computed by Datum, not yet confirmed.'}</span>
        <ConfidencePair r={r} />
      </Section>
      <Section title="Where it comes from">
        {hops.length === 0 ? <span className="muted">New to this program: no carryover history.</span> : (
          <>
            {hops.slice(-3).map((h, i) => <div key={i} className="row" style={{ alignItems: 'flex-start' }}><span className="data muted" style={{ width: 100, flex: 'none', whiteSpace: 'nowrap' }}>{h.date}</span><span>{h.event} · {h.program}{h.warn && <> <Badge tone="warn">{h.warn}</Badge></>}</span></div>)}
            <LinkButton onClick={openDrawer}>{r.hops} hops back · full chain open below</LinkButton>
          </>
        )}
      </Section>
      <AssociatedTest r={r} back="06c-trace" />
      <Section title="Action fields"><dl className={s.kv}><dt>Severity</dt><dd><SeverityBadge value={r.severity} /></dd><dt>Owner</dt><dd>{r.ownerShort}</dd><dt>Due</dt><dd>{r.due} · from scope</dd><dt>Test</dt><dd>{testById[r.chosenTestId]?.name}</dd></dl></Section>
      <Section title="Audit"><AuditList subject={{ type: 'requirement', id: r.req_id }} limit={3} emptyText="No decision yet." /><RecordedNote /></Section>
    </>
  )
}

function TraceActions({ r, rows }: { r: ReqView; rows: ReqView[] }) {
  const act = useReqActions()
  const sharing = sharingInterface(rows, r.interfaceId)
  const changed = r.driven_by_status === REQ_STATE.changed
  return (
    <>
      {changed && (r.driven.confirmed
        ? <><Badge tone="pass">Confirmed Changed</Badge><LinkButton onClick={() => act.undoConfirmChanged(r)}>Undo</LinkButton></>
        : <Button primary onClick={() => act.confirmChanged(r, sharing)}>Confirm Changed · applies to {sharing.length}</Button>)}
      <Link to={stepHref('06b-impact', `req=${r.req_id}&ret=06c-trace`)}><Button><Network size={14} aria-hidden /> Impact Map</Button></Link>
      {r.openCarry && <Link to={stepHref('06-carryover', `req=${r.req_id}`)}><Button>Resolve</Button></Link>}
    </>
  )
}

/** The independent bottom drawer: scrubbable hop cards, warn hops highlighted. Open by default; does not depend on the panel. */
function ChainDrawer({ r, open, onToggle }: { r: ReqView | null; open: boolean; onToggle: (o: boolean) => void }) {
  const hops = r ? chainHops(r) : []
  const box = useRef<HTMLDivElement>(null)
  const scrub = (dx: number) => box.current?.scrollBy({ left: dx, behavior: 'smooth' })
  return (
    <BottomDrawer title="Full carryover chain" meta={r ? `${r.req_id} · ${r.hops} hops · ${hops.length} events` : 'no requirement selected'} open={open} onToggle={onToggle} height={196}>
      {!r ? <div className="muted" style={{ padding: 'var(--gap-3) var(--gap-4)' }}>Select a requirement to see its carryover chain.</div>
        : hops.length === 0 ? <div className="muted" style={{ padding: 'var(--gap-3) var(--gap-4)' }}>No chain: this requirement is new to the program.</div>
        : (
          <div className="row" style={{ alignItems: 'stretch' }}>
            <IconButton label="Scrub chain left" onClick={() => scrub(-260)}><ChevronLeft size={14} /></IconButton>
            <div className={s.chain} ref={box} style={{ flex: 1 }} data-testid="chain">
              {hops.map((h, i) => (
                <div key={i} className={`${s.hop} ${h.warn ? s.hopWarn : ''}`} data-warn={h.warn ?? undefined}>
                  <span className="data muted">{h.date} · {h.program}</span>
                  <span className={s.strong}>{h.event}{h.warn && <> <Badge tone="warn">{h.warn}</Badge></>}</span>
                  <span className="secondary">{h.note}</span>
                </div>
              ))}
            </div>
            <IconButton label="Scrub chain right" onClick={() => scrub(260)}><ChevronRight size={14} /></IconButton>
          </div>
        )}
    </BottomDrawer>
  )
}
