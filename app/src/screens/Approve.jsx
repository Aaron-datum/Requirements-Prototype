import { useState } from 'react'
import { go } from '../router'
import { useStore } from '../store'
import { Badge, Btn, Owner, PageHead, Severity } from '../components/ui'
import { SCOPE, requirements } from '../data'

// Shared with the dashboard so both read the same plan numbers.
export function planSummary(st) {
  const carried = requirements.filter((r) => !r.flagged || st.carry[r.req_id]?.kind === 'linked' || st.carry[r.req_id]?.kind === 'transfer')
  const accepted = requirements.filter((r) => !r.autoAccept && st.mapping[r.req_id] === 'accepted')
  const undecided = requirements.filter((r) => !r.autoAccept && !st.mapping[r.req_id])
  const gap = requirements.filter((r) => st.carry[r.req_id]?.kind === 'gap')
  const open = requirements.filter((r) => r.flagged && !st.carry[r.req_id])
  const tests = new Map()
  accepted.forEach((r) => { const t = tests.get(r.proposedTest.test_id) || { test: r.proposedTest, reqs: [], parts: new Set() }; t.reqs.push(r); t.parts.add(r.linked_part_id); tests.set(r.proposedTest.test_id, t) })
  return { carried, accepted, undecided, gap, open, tests: [...tests.values()] }
}

function tdmCsv(st) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const state = (r) => (st.carry[r.req_id]?.kind === 'gap' ? 'Gap' : r.flagged && !st.carry[r.req_id] ? 'Undetermined' : r.evState === 'Verified' && !st.carry[r.req_id] ? 'No Gap' : 'Evaluated Elsewhere')
  const rows = [['Conformance State', 'Requirement ID', 'Requirement Title', 'Requirement Description', 'Source', 'Test Method', 'Severity', 'Owner']]
  requirements.forEach((r) => rows.push([state(r), r.req_id, r.title, r.requirement_text, r.citation, r.proposedTest.test_id + ' ' + r.proposedTest.name, r.severity, st.owners[r.req_id] || r.owner]))
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

export default function Approve() {
  const { state, decide } = useStore()
  const [ack, setAck] = useState(false)
  const s = planSummary(state)
  const label = state.planLabel
  const done = state.approval.plan
  const needAck = s.open.length > 0
  const exportTdm = () => {
    const url = URL.createObjectURL(new Blob([tdmCsv(state)], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `${SCOPE.planId}-tdm.csv` })
    a.click(); URL.revokeObjectURL(url)
  }
  return (
    <div className="page">
      <PageHead title={done ? `${label} created` : `Approve and create ${label.toLowerCase()}`}
        sub={<><span className="mono">{SCOPE.planId}</span> · {done ? <>approved by {done.by} {done.ts.slice(0, 10)}</> : 'draft'} · everything below is committed in one record</>}>
        <Btn onClick={exportTdm}>Export TDM</Btn>
        <Btn disabled title="PLM integration is out of scope for this prototype">Open in PLM</Btn>
        {done ? <Btn onClick={() => decide('approval', 'plan', undefined, `Withdrew ${label.toLowerCase()} approval`, SCOPE.planId)}>Withdraw Approval</Btn>
          : <Btn primary disabled={(needAck && !ack)} onClick={() => decide('approval', 'plan', { by: SCOPE.user, ts: new Date().toISOString() }, `Approved ${label.toLowerCase()}`, SCOPE.planId)}>Approve and create {label.toLowerCase()}</Btn>}
      </PageHead>
      <div className="sec">Civic Si 1.5T · MY2026 · {SCOPE.gate} · {SCOPE.rfq}</div>
      {s.undecided.length > 0 && !done && <div className="banner warn" role="alert">{s.undecided.length} requirement → test mappings are still undecided. <a onClick={() => go('/mapping')}>Review mapping</a></div>}
      <div className="grid g4">
        <div className="card"><div className="caps">Carried over · evidence linked</div><div className="stat">{s.carried.length}</div><div className="muted">requirements closed by existing test reports</div></div>
        <div className="card"><div className="caps">Routed to new tests</div><div className="stat">{s.accepted.length}</div><div className="muted">requirements across {s.tests.length} tests</div></div>
        <div className="card"><div className="caps">Moved to gap</div><div className="stat">{s.gap.length}</div><div className="muted">recorded as a gap in the plan</div></div>
        <div className="card"><div className="caps">Still open</div><div className="stat">{s.open.length}</div><div className="muted">stay Undetermined and carry an owner</div></div>
      </div>
      <section className="card" style={{ padding: 0 }}>
        <div style={{ padding: 12 }}><span className="h3">New tests</span> <span className="muted">reviewed mappings + requirements moved to Gap</span></div>
        <table className="tbl"><thead><tr><th>Test</th><th>BOM lines</th><th className="num">Requirements</th></tr></thead><tbody>
          {s.tests.length === 0 && <tr><td colSpan={3} className="muted">No mappings accepted yet.</td></tr>}
          {s.tests.map((t) => <tr key={t.test.test_id}><td><div>{t.test.name}</div><div className="mono muted">{t.test.test_id}</div></td><td className="mono">{[...t.parts].join(', ')}</td><td className="num">{t.reqs.length}</td></tr>)}
        </tbody></table>
        <div className="muted" style={{ padding: 12 }}>+ auto-accepted mappings covering {requirements.filter((r) => r.autoAccept).length} requirements</div>
      </section>
      <section className="card" style={{ padding: 0 }}>
        <div style={{ padding: 12 }}><span className="h3">Still open</span></div>
        <table className="tbl"><thead><tr><th>Requirement</th><th>Severity</th><th>Owner</th><th>Due</th></tr></thead><tbody>
          {s.open.length === 0 && <tr><td colSpan={4} className="muted">Nothing open — every flagged requirement has a decision.</td></tr>}
          {s.open.map((r) => <tr key={r.req_id} className="rowhover" onClick={() => go('/carryover?req=' + r.req_id)}><td><div>{r.title}</div><div className="mono muted">{r.req_id} · {r.linked_part_id}</div></td><td><Severity v={r.severity} /></td><td><Owner v={state.owners[r.req_id] || r.owner} /></td><td className="mono">{SCOPE.due}</td></tr>)}
        </tbody></table>
      </section>
      <section className="card"><dl className="kv">
        <dt>{label} name</dt><dd>Civic Si 1.5T — DV</dd><dt>Gate</dt><dd>{SCOPE.gate}</dd><dt>Owner</dt><dd>{SCOPE.user}</dd><dt>Source BOM</dt><dd>{SCOPE.bomId}</dd><dt>Requirement sources</dt><dd>{SCOPE.sources}</dd></dl></section>
      {!done && needAck && <label className="row"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />I've reviewed the {s.open.length} open requirements. They stay Undetermined in the {label.toLowerCase()} with an owner.</label>}
      {done && <div className="banner" role="status"><Badge tone="pass">Approved</Badge> {label} {SCOPE.planId} was created by {done.by}.</div>}
    </div>
  )
}
