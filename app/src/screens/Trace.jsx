import { useMemo, useState } from 'react'
import { go, useRoute } from '../router'
import { useStore } from '../store'
import TableShell from '../components/TableShell'
import { Badge, Btn, DrivenBy, Owner, Result, Severity, SourceTag, Stamp, TextStatus } from '../components/ui'
import { SCOPE, progShort, requirements } from '../data'
import { RES_LABEL } from './Carryover'

// Requirements taxonomy decision (open item 2b): subfolders, matching the BOM's pattern — default grouping is
// Subsystem. Category / Sub-category are derived hierarchy-carrying columns in the spirit of the Adient taxonomy,
// and the grouping can be switched in Manage.
const SAFETY = /burst|containment|overspeed/i
const subCat = (r) => (/fatigue|durability|torsional|thermal/i.test(r.title) ? 'Fatigue / lifecycle' : /accuracy|linearity|flow|response|surge|effectiveness|dwell/i.test(r.title) ? 'Performance' : SAFETY.test(r.title) ? 'Robustness' : 'Sealing / leakage')
const category = (r) => (SAFETY.test(r.title) ? 'Safety' : 'Functional')

const statusOf = (r, st) => (st.carry[r.req_id] ? RES_LABEL[st.carry[r.req_id].kind] : r.evState === 'Open' ? 'Open' : r.evState === 'Carried' ? 'Carried' : 'Verified')
const STATUS_TONE = { Verified: 'pass', Carried: 'info', Open: 'warn', 'Evidence linked': 'pass', 'Moved to Gap': 'neutral' }

export default function Trace() {
  const { query } = useRoute()
  const { state, decide, decideMany } = useStore()
  const [sel, setSel] = useState(query.req || null)
  const [drawer, setDrawer] = useState(false)
  const q = sel && requirements.find((r) => r.req_id === sel)
  const open = requirements.filter((r) => r.flagged && !state.carry[r.req_id]).length

  const columns = useMemo(() => [
    { key: 'title', label: 'Requirement', group: 'Identity', pinned: true, type: 'text', get: (r) => r.title + ' ' + r.req_id,
      render: (r) => <div><div>{r.title}</div><div className="mono muted">{r.req_id} · {r.linked_part_id}</div></div> },
    { key: 'subsystem', label: 'Subsystem', group: 'Taxonomy', type: 'enum', visible: false, get: (r) => r.subsystem },
    { key: 'category', label: 'Category', group: 'Taxonomy', type: 'enum', visible: false, get: category },
    { key: 'subcat', label: 'Sub-category', group: 'Taxonomy', type: 'enum', visible: false, get: subCat },
    { key: 'source', label: 'Source', group: 'Identity', type: 'enum', get: (r) => r.source_type, render: (r) => <span className="row"><SourceTag v={r.source_type} /><span className="muted">{r.citation.split(' / ')[0]}</span></span> },
    { key: 'text', label: 'Text', group: 'Change', type: 'enum', get: (r) => r.text_status, render: (r) => <TextStatus v={r.text_status} /> },
    { key: 'driven', label: 'Driven by', group: 'Change', type: 'enum', get: (r) => r.driven_by_status, render: (r) => <DrivenBy status={r.driven_by_status} conf={r.driven_by_confidence} /> },
    { key: 'conf', label: 'Driven-by %', group: 'Change', type: 'range', align: 'right', visible: false, get: (r) => r.driven_by_confidence, render: (r) => <span className="num">{r.driven_by_confidence ?? 'n/a'}</span> },
    { key: 'danger', label: 'Dangerous case', group: 'Change', type: 'enum', visible: false, get: (r) => (r.dangerous ? 'Yes' : 'No') },
    { key: 'test', label: 'Test', group: 'Evidence', type: 'enum', get: (r) => r.proposedTest.test_id, render: (r) => <span className="mono">{r.proposedTest.test_id}</span> },
    { key: 'status', label: 'Status', group: 'Evidence', type: 'enum', get: (r) => statusOf(r, state), render: (r) => <Badge tone={STATUS_TONE[statusOf(r, state)]}>{statusOf(r, state)}</Badge> },
    { key: 'hops', label: 'Carryover', group: 'Evidence', type: 'range', align: 'right', get: (r) => new Set(r.events.map((e) => e.program_id)).size, render: (r) => <span className="num">{r.events.length ? new Set(r.events.map((e) => e.program_id)).size + ' prog' : '—'}</span> },
    { key: 'severity', label: 'Severity', group: 'Action', type: 'enum', get: (r) => r.severity, render: (r) => <Severity v={r.severity} /> },
    { key: 'owner', label: 'Owner', group: 'Action', type: 'enum', get: (r) => state.owners[r.req_id] || r.owner, render: (r) => <Owner v={state.owners[r.req_id] || r.owner} /> },
    { key: 'due', label: 'Due', group: 'Action', type: 'none', visible: false, get: () => SCOPE.due, render: () => <span className="mono muted">{SCOPE.due}</span> },
  ], [state])

  return (
    <div className="fill">
      <div className="row" style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-default)' }}>
        <div className="grow"><h1 className="h1">Requirement trace</h1><div className="sec">Scope · Civic Si 1.5T · {SCOPE.rfq} · {SCOPE.bomName}</div></div>
        <Btn onClick={() => go('/carryover')}>Carryover Review · {open} open</Btn>
      </div>
      <div className="stage" style={{ minHeight: 0 }}>
        <TableShell id="trace" columns={columns} rows={requirements} rowId={(r) => r.req_id} selectedId={sel} onSelect={setSel}
          rowClass={(r) => (r.dangerous ? 'danger' : '')}
          groupOptions={[{ key: 'subsystem', label: 'Subsystem', get: (r) => r.subsystem }, { key: 'category', label: 'Category', get: category }, { key: 'source', label: 'Source', get: (r) => r.source_type }]}
          folderMeta={(rs) => `${rs.filter((r) => r.dangerous).length ? rs.filter((r) => r.dangerous).length + ' dangerous · ' : ''}${rs.filter((r) => r.flagged).length} open`}
          toolbar={<span className="row"><Badge tone="fail">Dangerous case</Badge><span className="muted">Text unchanged, driver changed — highlighted on every row</span></span>} />
        {q && <ReqPanel r={q} onClose={() => setSel(null)} drawer={drawer} setDrawer={setDrawer} />}
      </div>
      <ChainDrawer r={q} open={drawer} setOpen={setDrawer} />
    </div>
  )
}

function ReqPanel({ r, onClose, setDrawer }) {
  const { state, decide, decideMany } = useStore()
  const run = r.ev.siRun
  const sibs = requirements.filter((x) => x.driven_by_status === 'Changed' && x.subsystem === r.subsystem && !state.changed[x.req_id])
  const confirmed = state.changed[r.req_id]
  const owner = state.owners[r.req_id] || r.owner
  const owners = [...new Set(requirements.map((x) => x.owner))]
  return (
    <aside className="panel" aria-label="Requirement detail">
      <div className="hd"><div className="grow"><div className="mono muted">{r.req_id}</div><div className="h3">{r.title}</div></div>
        <Badge tone={STATUS_TONE[statusOf(r, state)]}>{statusOf(r, state)}</Badge><Btn size="sm" className="ghost" onClick={onClose} aria-label="Close panel">✕</Btn></div>
      <div className="bd">
        {r.dangerous && <div className="banner fail"><b>Dangerous case.</b> Text is unchanged but the driver changed. {r.notes}</div>}
        <div className="col"><span className="caps">Requirement</span><span>{r.requirement_text}</span>
          <span className="row wrap"><SourceTag v={r.source_type} /><span className="muted">{r.citation}</span><TextStatus v={r.text_status} /></span></div>
        <div className="col"><span className="caps">Driven by</span><DrivenBy status={r.driven_by_status} conf={r.driven_by_confidence} />{!r.dangerous && <span className="muted">{r.notes}</span>}</div>
        <div className="col"><span className="caps">Action</span>
          <dl className="kv"><dt>Severity</dt><dd><Severity v={r.severity} /></dd><dt>Owner</dt><dd><select value={owner} onChange={(e) => decide('owners', r.req_id, e.target.value, 'Reassigned owner', `${r.req_id} → ${e.target.value.split(' (')[0]}`)}>{owners.map((o) => <option key={o}>{o}</option>)}</select></dd><dt>Due</dt><dd className="mono">{SCOPE.due} <span className="muted">· inherited from scope</span></dd></dl></div>
        <div className="col"><span className="caps">Where it comes from</span>
          {r.events.length ? r.events.slice(0, 3).map((e, i) => <div key={i} className="row" style={{ alignItems: 'flex-start' }}><span className="mono muted" style={{ width: 76 }}>{e.date}</span><span>{e.event} · {progShort(e.program_id)}</span></div>) : <span className="muted">New to this program — no carryover history.</span>}
          {r.events.length > 0 && <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => setDrawer(true)}>Full carryover chain</button>}</div>
        <div className="col"><span className="caps">Associated test</span>
          <div className="card tight col" style={{ gap: 2 }}><b>{r.ev.test.name}</b><span className="mono muted">{run ? `${run.run_id} · ${run.samples ? run.samples + ' samples · ' : ''}${run.result}` : 'No Si run'}</span>
            {run && <span><Result v={run.result} /></span>}
            <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => go('/test/' + r.ev.test.test_id + '?from=' + r.req_id)}>View Test</button></div></div>
        <hr className="hr" />
        <div className="row wrap">
          {r.driven_by_status === 'Changed' && (confirmed
            ? <><Badge tone="pass">Confirmed changed</Badge><Btn size="sm" onClick={() => decide('changed', r.req_id, undefined, 'Cleared Confirm Changed', r.req_id)}>Undo</Btn></>
            : <Btn primary onClick={() => decideMany('changed', sibs.map((x) => x.req_id), 'confirmed', `Confirmed changed (${sibs.length})`, `${r.req_id} + ${sibs.length - 1} sharing ${r.subsystem}`)}>Confirm Changed · applies to {sibs.length}</Btn>)}
          <Btn onClick={() => go('/impact/' + r.req_id)}>Impact Map</Btn>
          {r.flagged && !state.carry[r.req_id] && <Btn onClick={() => go('/carryover?req=' + r.req_id)}>Resolve</Btn>}
        </div>
        <Stamp audit={state.audit} match={(a) => a.target.includes(r.req_id)} />
      </div>
    </aside>
  )
}

function ChainDrawer({ r, open, setOpen }) {
  if (!r) return null
  return (
    <div className={`drawer ${open ? '' : 'closed'}`}>
      <div className="row" style={{ padding: '8px 16px', height: 36, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <span aria-hidden>{open ? '▾' : '▴'}</span><span className="h3">Full carryover chain</span><span className="muted">{r.req_id} · {r.events.length} events</span></div>
      {open && <div className="chain">
        {r.events.length === 0 && <span className="muted">No chain — new requirement.</span>}
        {r.events.map((e, i) => (
          <div className="hop" key={i}><div className="row"><span className="mono muted">{e.date}</span><Badge tone={/changed|Flagged/.test(e.event) ? 'warn' : /Test run|Carried/.test(e.event) ? 'pass' : 'neutral'}>{e.event}</Badge></div>
            <div className="muted">{progShort(e.program_id)}</div><div>{e.note}</div></div>))}
      </div>}
    </div>
  )
}
