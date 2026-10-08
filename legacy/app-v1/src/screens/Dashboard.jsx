import { useMemo, useState } from 'react'
import { go } from '../router'
import { useStore } from '../store'
import { Badge, Btn, Certainty, Meter, Owner, PageHead, Seg, Severity } from '../components/ui'
import {
  ACTIVE, SCOPE, SEVERITY_ORDER, SUBASSEMBLIES, bomLines, money, programById, programUsage, progShort, requirements, runsForTest, siBom, sum, tests,
} from '../data'
import { planSummary } from './Approve'

// One shell, two scopes (projects-dashboard-lofi-brief): Project overview vs Output overview (one BOM).
// Five bands: action boxes · status bar · data-viz slot · overflow table.

function actionItems(scope, st) {
  const items = []
  if (scope === 'Project') {
    requirements.filter((r) => r.flagged && !st.carry[r.req_id]).forEach((r) =>
      items.push({ id: r.req_id, type: 'Requirement', title: r.title, sev: r.severity, owner: st.owners[r.req_id] || r.owner, status: r.dangerous ? 'Dangerous case' : r.bucket === 'undetermined' ? 'Undetermined' : 'Evaluated elsewhere', to: '/carryover?req=' + r.req_id, risky: r.dangerous || r.severity === 'Critical' }))
    requirements.filter((r) => !r.autoAccept && !st.mapping[r.req_id]).forEach((r) =>
      items.push({ id: 'M-' + r.req_id, type: 'Mapping', title: `${r.req_id} → ${r.proposedTest.test_id}`, sev: r.severity, owner: st.owners[r.req_id] || r.owner, status: 'Awaiting review', to: '/mapping' }))
  }
  siBom.filter((l) => (l.certainty === 'Surrogate' && !st.surrogate[l.bom_line_id]) || l.certainty === 'Estimated' || l.certainty === 'No match').forEach((l) =>
    items.push({ id: l.bom_line_id, type: 'BOM line', title: `${l.name} · ${l.part_id}`, sev: l.certainty === 'No match' ? 'High' : l.certainty === 'Estimated' ? 'High' : 'Medium', owner: programById[ACTIVE].owner, status: l.certainty === 'Surrogate' ? `Surrogate ${l.surrogate_match_pct}% · unconfirmed` : l.certainty, to: '/bom', risky: l.certainty !== 'Surrogate' }))
  return items
}

function useSeries(zoom, metric) {
  return useMemo(() => {
    const groupsFor = {
      Program: () => ['PGM-CIV-LX', 'PGM-CIV-SPT', 'PGM-CIV-SI'].map((p) => [progShort(p), bomLines.filter((l) => l.program_id === p)]),
      Part: () => [...siBom].sort((a, b) => b.ext_price - a.ext_price).slice(0, 10).map((l) => [l.name, [l]]),
      Hardware: () => SUBASSEMBLIES.map((s) => [s, siBom.filter((l) => l.subassembly === s)]),
    }[zoom]()
    if (metric === 'Certainty') return { unit: 'lines', stacked: ['Actual', 'Surrogate', 'Estimated', 'No match'], rows: groupsFor.map(([label, ls]) => ({ label, parts: ['Actual', 'Surrogate', 'Estimated', 'No match'].map((k) => ls.filter((l) => l.certainty === k).length) })) }
    if (metric === 'Price') return { unit: 'USD', stacked: ['Spend'], rows: groupsFor.map(([label, ls]) => ({ label, parts: [Math.round(sum(ls, (l) => l.ext_price))] })) }
    if (metric === 'Diversity') return { unit: '% shared across programs', stacked: ['Shared part_id'], rows: groupsFor.map(([label, ls]) => ({ label, parts: [Math.round((ls.filter((l) => programUsage(l.part_id).length > 1).length / ls.length) * 100)] })) }
    return { unit: 'weeks (max lead time)', stacked: ['Lead time'], rows: groupsFor.map(([label, ls]) => ({ label, parts: [Math.max(...ls.map((l) => l.part.lead_time_wk))] })) }
  }, [zoom, metric])
}
const FILLS = ['var(--status-pass-fg)', 'var(--accent)', 'var(--status-warn-fg)', 'var(--status-fail-fg)']

function VizSlot() {
  const [zoom, setZoom] = useState('Program')
  const [metric, setMetric] = useState('Certainty')
  const [form, setForm] = useState('Chart')
  const s = useSeries(zoom, metric)
  const max = Math.max(...s.rows.map((r) => sum(r.parts, (x) => x)), 1)
  return (
    <section className="card col" aria-label="Data visualisation">
      <div className="row wrap">
        <span className="h3 grow">{metric} by {zoom.toLowerCase()}</span>
        <Seg value={zoom} onChange={setZoom} options={[['Program', 'Program'], ['Part', 'Part'], ['Hardware', 'Hardware (subassembly)']]} />
        <Seg value={metric} onChange={setMetric} options={['Certainty', 'Price', 'Diversity', 'Timeline']} />
        <Seg value={form} onChange={setForm} options={['Chart', 'Table']} />
      </div>
      {form === 'Chart' ? (
        <>
          <div className="col" style={{ gap: 6 }}>
            {s.rows.map((r) => (
              <div key={r.label} className="row">
                <span style={{ width: 170 }} className="trunc" title={r.label}>{r.label}</span>
                <div className="row grow" style={{ gap: 1, height: 18 }}>
                  {r.parts.map((v, i) => v > 0 && <div key={i} title={`${s.stacked[i]}: ${v}`} style={{ width: `${(v / max) * 100}%`, background: FILLS[i % 4], height: '100%', borderRadius: 2, minWidth: 2 }} />)}
                </div>
                <span className="mono" style={{ width: 130, textAlign: 'right', whiteSpace: 'nowrap' }}>{r.parts.join(' / ')}</span>
              </div>))}
          </div>
          <div className="row wrap muted">{s.stacked.map((k, i) => <span key={k} className="row" style={{ gap: 4 }}><i style={{ width: 10, height: 10, background: FILLS[i % 4], borderRadius: 2, display: 'inline-block' }} />{k}</span>)}<span className="right">unit: {s.unit}</span></div>
        </>
      ) : (
        <table className="tbl"><thead><tr><th>{zoom}</th>{s.stacked.map((k) => <th key={k} className="num">{k}</th>)}</tr></thead><tbody>
          {s.rows.map((r) => <tr key={r.label}><td>{r.label}</td>{r.parts.map((v, i) => <td key={i} className="num">{v}</td>)}</tr>)}
        </tbody></table>
      )}
    </section>
  )
}

function ActionBox({ title, tone, items, empty, action, to, render }) {
  return (
    <section className="card col">
      <div className="row"><span className="h3 grow">{title}</span><Badge tone={tone}>{items.length}</Badge></div>
      <div className="col" style={{ gap: 0, minHeight: 130 }}>
        {items.length === 0 && <span className="muted">{empty}</span>}
        {items.slice(0, 4).map((it, i) => (<div key={it.id || i} className="act-item">{render(it)}</div>))}
        {items.length > 4 && <span className="muted" style={{ paddingTop: 6 }}>+ {items.length - 4} more in the table below</span>}
      </div>
      <Btn primary onClick={() => go(to)}>{action}</Btn>
    </section>
  )
}

export default function Dashboard() {
  const { state } = useStore()
  const [scope, setScope] = useState('Project')
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const items = actionItems(scope, state)
  const sorted = [...items].sort((a, b) => SEVERITY_ORDER[a.sev] - SEVERITY_ORDER[b.sev])
  const urgent = sorted.filter((i) => i.risky)
  const review = sorted.filter((i) => !i.risky)
  const plan = planSummary(state)
  const approved = state.approval.plan
  const steps = [
    ['RFQ intake', true], ['Assembly tree', true], ['BOM review', siBom.every((l) => l.certainty !== 'Surrogate' || state.surrogate[l.bom_line_id])],
    ['Mapping', plan.undecided.length === 0], ['Carryover', plan.open.length === 0], ['Approve', !!approved],
  ]
  const done = steps.filter(([, d]) => d).length
  const recent = state.audit.slice(0, 4)
  const rows = sorted.filter((i) => (type === 'All' || i.type === type) && (i.title + i.owner + i.status).toLowerCase().includes(q.toLowerCase()))
  const total = sum(siBom, (l) => l.ext_price)

  return (
    <div className="page" style={{ flex: 1 }}>
      <PageHead title={scope === 'Project' ? 'Project overview' : 'Output overview'}
        sub={scope === 'Project' ? <>Civic Si 1.5T · {SCOPE.rfq} · due {SCOPE.due} · what needs doing, who owns it, where the data came from</> : <>{SCOPE.bomName} · {SCOPE.bomId} · this one deliverable’s own status</>}>
        <Seg value={scope} onChange={setScope} options={[['Project', 'Project overview'], ['Output', 'Output overview · BOM']]} />
      </PageHead>

      <div className="grid g3">
        <ActionBox title="Urgent / risky action items" tone="fail" items={urgent} empty="Nothing urgent. All risky items have a decision." action={scope === 'Project' ? 'Review Carryover' : 'Open BOM Review'} to={scope === 'Project' ? '/carryover' : '/bom'}
          render={(i) => <><Severity v={i.sev} /><span className="grow col" style={{ gap: 0 }}><span className="trunc">{i.title}</span><span className="muted">{i.status} · <Owner v={i.owner} /></span></span></>} />
        <ActionBox title="Review items" tone="warn" items={review} empty="Nothing waiting for review." action={scope === 'Project' ? 'Review Mapping' : 'Resolve Surrogates'} to={scope === 'Project' ? '/mapping' : '/bom'}
          render={(i) => <><Badge tone="outline">{i.type}</Badge><span className="grow col" style={{ gap: 0 }}><span className="trunc">{i.title}</span><span className="muted">{i.status}</span></span></>} />
        <ActionBox title="Where you left off" tone="info" items={recent} empty="No activity yet. Start at RFQ intake." action={recent.length ? 'Continue' : 'Start at RFQ Intake'} to={recent.length ? (plan.open.length ? '/carryover' : '/approve') : '/intake'}
          render={(a) => <span className="grow col" style={{ gap: 0 }}><span className="trunc">{a.action}</span><span className="muted trunc">{a.target} · {a.user} · {new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>} />
      </div>

      <div className="statusbar" aria-label="Status">
        <div className="col" style={{ gap: 2 }}><span className="caps">Summary</span>
          <span>{scope === 'Project' ? <>{siBom.length} BOM lines · {requirements.length} requirements · {tests.length} tests</> : <>{money(total, 0)} first-order · {siBom.filter((l) => l.certainty === 'Actual').length} carryover lines</>}</span></div>
        <div className="sep-v" />
        <div className="col grow" style={{ gap: 2, minWidth: 220 }}><span className="caps">Progress · {done}/{steps.length}</span>
          <div className="row"><Meter pct={(done / steps.length) * 100} tone="info" /><span className="mono">{Math.round((done / steps.length) * 100)}%</span></div>
          <span className="muted wrap">{steps.map(([n, d]) => (d ? '✓ ' : '○ ') + n).join(' · ')}</span></div>
        <div className="sep-v" />
        <div className="col" style={{ gap: 2 }}><span className="caps">Connections</span><span>SAP S/4HANA · LME · ECB rates · PLM (offline)</span></div>
      </div>

      <VizSlot />

      <section className="card" style={{ padding: 0 }}>
        <div className="row wrap" style={{ padding: 12 }}>
          <span className="h3">All open items</span><span className="muted">{rows.length} of {items.length}</span>
          <div className="right row"><input type="search" placeholder="Filter items, owners, status…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter items" />
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Item type">{['All', 'Requirement', 'Mapping', 'BOM line'].map((t) => <option key={t}>{t}</option>)}</select></div>
        </div>
        <table className="tbl"><thead><tr><th>Item</th><th>Type</th><th>Severity</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>
          {rows.length === 0 && <tr><td colSpan={6}><div className="empty">No items match.</div></td></tr>}
          {rows.map((i) => <tr key={i.id} className="rowhover" onClick={() => go(i.to)}><td>{i.title}</td><td><Badge tone="outline">{i.type}</Badge></td><td><Severity v={i.sev} /></td><td><Owner v={i.owner} /></td><td className="mono">{SCOPE.due}</td><td>{i.status}</td></tr>)}
        </tbody></table>
      </section>
    </div>
  )
}
