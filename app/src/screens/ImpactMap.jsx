import { useMemo, useState } from 'react'
import { go, back } from '../router'
import { Badge, Btn, PageHead, Seg, Severity } from '../components/ui'
import { SCOPE, partById, programUsage, progShort, programById, requirements, reqById, reqsForTest, siBomByPart } from '../data'

const KIND = { REQ: 'Requirement', DOC: 'Document', PRT: 'Part', TST: 'Test', PLN: 'Plan' }

// Build the typed node graph around one requirement. dir: 'up' = it depends on, 'down' = depends on it.
export function buildGraph(r, plan = 'Test plan') {
  const nodes = [{ id: r.req_id, kind: 'REQ', name: r.title, hop: 0, dir: 'self', meta: `${r.req_id} · ${r.text_status} text`, prog: 'Si' }]
  const edges = []
  const add = (n, from, rel) => { nodes.push(n); edges.push({ from, to: n.id, rel }) }
  const docId = 'DOC:' + r.citation.split(' / ')[0]
  add({ id: docId, kind: 'DOC', name: r.citation.split(' / ')[0], hop: 1, dir: 'up', meta: r.source_type + ' source', prog: 'Si' }, r.req_id, 'depends')
  add({ id: 'PRT:' + r.linked_part_id, kind: 'PRT', name: r.part.name, hop: 1, dir: 'up', meta: `${r.linked_part_id} · ${r.bomLine?.certainty ?? ''}`, prog: 'Si' }, r.req_id, 'depends')
  const t = r.ev.test
  add({ id: 'TST:' + t.test_id, kind: 'TST', name: t.name, hop: 1, dir: 'down', meta: `${t.test_id} · ${r.ev.siRun?.result ?? 'no Si run'}`, prog: 'Si' }, r.req_id, 'depends')
  add({ id: 'PLN', kind: 'PLN', name: plan + ' ' + SCOPE.planId, hop: 1, dir: 'down', meta: SCOPE.gate, prog: 'Si' }, 'TST:' + t.test_id, 'depends')
  // hop 2
  const cand = r.bomLine?.other_candidates?.[0]
  if (cand) add({ id: 'PRT:' + cand.part_id, kind: 'PRT', name: partById[cand.part_id].name, hop: 2, dir: 'up', meta: `${cand.part_id} · ${progShort(cand.program_id)} surrogate source`, prog: progShort(cand.program_id) }, 'PRT:' + r.linked_part_id, 'donates')
  if (r.ev.source) add({ id: 'TST:' + r.ev.source.run_id, kind: 'TST', name: `Run ${r.ev.source.run_id}`, hop: 2, dir: 'up', meta: `${progShort(r.ev.source.program_id)} · ${r.ev.source.date} · ${r.ev.source.result}`, prog: progShort(r.ev.source.program_id) }, 'TST:' + t.test_id, 'donates')
  reqsForTest(t.test_id).filter((x) => x.req_id !== r.req_id).forEach((x) =>
    add({ id: x.req_id, kind: 'REQ', name: x.title, hop: 2, dir: 'down', meta: `${x.req_id} · shares ${t.test_id}`, prog: 'Si' }, 'TST:' + t.test_id, 'depends'))
  requirements.filter((x) => x.linked_part_id === r.linked_part_id && x.req_id !== r.req_id).forEach((x) =>
    add({ id: x.req_id, kind: 'REQ', name: x.title, hop: 2, dir: 'down', meta: `${x.req_id} · same part`, prog: 'Si' }, 'PRT:' + r.linked_part_id, 'depends'))
  programUsage(r.linked_part_id).filter((p) => p !== 'PGM-CIV-SI').forEach((p) =>
    add({ id: 'PGM:' + p, kind: 'PLN', name: programById[p].name + ' BOM', hop: 2, dir: 'down', meta: 'same part_id in production', prog: progShort(p) }, 'PRT:' + r.linked_part_id, 'depends'))
  return { nodes: nodes.filter((n, i, a) => a.findIndex((m) => m.id === n.id) === i), edges }
}

const SCENARIOS = {
  part: ['Part design changes', 'The part the requirement traces to is redesigned.'],
  evidence: ['Evidence is re-run', 'The linked test is run again and the result changes.'],
  text: ['Requirement text changes', 'The clause itself is revised by the OEM.'],
}

function affected(r, g, sc) {
  const out = []
  const push = (n, flag, reason) => out.push({ n, flag, reason })
  g.nodes.filter((n) => n.id !== r.req_id).forEach((n) => {
    const k = n.kind, two = n.hop === 2
    if (sc === 'part') {
      if (n.id.startsWith('TST:') && !two) push(n, 'RE-REVIEW', 'Test result was measured on the old design — it may no longer apply.')
      else if (n.kind === 'REQ') push(n, n.meta.includes('same part') ? 'RE-REVIEW' : 'CHECK', n.meta.includes('same part') ? 'Traces to the same part, so the design change reaches it directly.' : 'Relies on the same test result — confirm the margin still holds.')
      else if (n.id === 'PLN') push(n, 'CHECK', 'The plan will need re-approval if its test set changes.')
      else if (n.id.startsWith('PGM:')) push(n, 'CHECK', 'Same part is in production here — two hops out, confirm it is not shared.')
    } else if (sc === 'evidence') {
      if (n.kind === 'REQ') push(n, r.evState === 'Carried' || n.meta.includes('shares') ? 'RE-REVIEW' : 'CHECK', 'Relies on the result being superseded.')
      else if (n.id === 'PLN') push(n, 'CHECK', 'Carried / closed counts on the plan will change.')
      else if (n.id.startsWith('TST:') && two) push(n, 'CHECK', 'Original evidence donor — confirm it still stands behind the carryover.')
    } else {
      if (n.id.startsWith('TST:') && !two) push(n, 'RE-REVIEW', 'The test was chosen for the old clause wording.')
      else if (n.kind === 'DOC') push(n, 'CHECK', 'Citation will need to point at the revised section.')
      else if (n.id === 'PLN') push(n, 'CHECK', 'Plan content depends on this mapping.')
      else if (n.kind === 'REQ' && n.meta.includes('shares')) push(n, 'CHECK', 'Shares the test — confirm it still covers both clauses.')
    }
  })
  return out
}

export default function ImpactMap({ reqId }) {
  const r = reqById[reqId] || requirements.find((x) => x.dangerous) || requirements[0]
  const [hops, setHops] = useState(2)
  const [dir, setDir] = useState('Both')
  const [sc, setSc] = useState('part')
  const [sel, setSel] = useState(null)
  const g = useMemo(() => buildGraph(r), [r])
  const vis = g.nodes.filter((n) => n.hop <= hops && (dir === 'Both' || n.dir === 'self' || (dir === 'Trace Back' ? n.dir === 'up' : n.dir === 'down')))
  const visIds = new Set(vis.map((n) => n.id))
  const aff = affected(r, g, sc).filter((a) => visIds.has(a.n.id))
  const rr = aff.filter((a) => a.flag === 'RE-REVIEW').length
  const progs = new Set(aff.map((a) => a.n.prog)).size

  // radial layout: upstream on the left, downstream on the right, hop rings out from the anchor
  const W = 640, H = 460, cx = W / 2, cy = H / 2
  const pos = {}
  ;[1, 2].forEach((h) => ['up', 'down'].forEach((d) => {
    const ns = vis.filter((n) => n.hop === h && n.dir === d)
    ns.forEach((n, i) => {
      const spread = Math.min(Math.PI * 0.8, 0.55 * (ns.length + 1))
      const a = ns.length === 1 ? 0 : -spread / 2 + (spread * i) / (ns.length - 1)
      const rad = h === 1 ? 130 : 235
      pos[n.id] = [cx + (d === 'up' ? -1 : 1) * Math.cos(a) * rad * 1.15, cy + Math.sin(a) * rad * 0.9]
    })
  }))
  pos[r.req_id] = [cx, cy]
  const selN = vis.find((n) => n.id === sel) || vis[0]

  return (
    <div className="stage">
      <div className="fill" style={{ overflow: 'auto', padding: '16px 24px' }}>
        <PageHead title="Impact map" sub={<>{r.req_id} · {vis.length} linked records</>}><Btn onClick={back}>Back</Btn></PageHead>
        <div className="row wrap" style={{ margin: '12px 0' }}>
          <span className="muted">Hop depth</span><Seg value={hops} onChange={setHops} options={[[1, '1'], [2, '2']]} />
          <span className="muted">Direction</span><Seg value={dir} onChange={setDir} options={['Both', 'Trace Back', 'Trace Forward']} />
          <span className="right muted">UPSTREAM ← → DOWNSTREAM</span>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 560, display: 'block' }} role="img" aria-label="Dependency graph">
            {[130 * 1.15, 235 * 1.15].map((rad, i) => i < hops && <ellipse key={i} cx={cx} cy={cy} rx={rad} ry={rad * 0.78} fill="none" stroke="var(--border-default)" strokeDasharray="3 4" />)}
            {g.edges.filter((e) => visIds.has(e.from) && visIds.has(e.to)).map((e, i) => (
              <line key={i} x1={pos[e.from][0]} y1={pos[e.from][1]} x2={pos[e.to][0]} y2={pos[e.to][1]} stroke="var(--fg-muted)" strokeWidth="1.2" strokeDasharray={e.rel === 'donates' ? '5 4' : undefined} />))}
            {vis.map((n) => {
              const [x, y] = pos[n.id]
              const hit = aff.find((a) => a.n.id === n.id)
              const on = selN?.id === n.id
              return (
                <g key={n.id} transform={`translate(${x - 62},${y - 20})`} onClick={() => setSel(n.id)} style={{ cursor: 'pointer' }} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(n.id)}>
                  <rect width="124" height="40" rx="5" fill="var(--bg-card)" stroke={on ? 'var(--border-selected)' : hit?.flag === 'RE-REVIEW' ? 'var(--status-fail-fg)' : 'var(--border-strong)'} strokeWidth={on || hit ? 2 : 1} />
                  <text x="8" y="14" className="mono" style={{ fontSize: 9 }}>{n.kind}{hit ? ` · ${hit.flag}` : ''}</text>
                  <text x="8" y="30" style={{ fontSize: 10.5, fill: 'var(--fg-primary)' }}>{n.name.length > 20 ? n.name.slice(0, 19) + '…' : n.name}</text>
                </g>)
            })}
          </svg>
          <div className="row wrap" style={{ padding: '8px 12px', borderTop: '1px solid var(--border-default)' }}>
            {Object.entries(KIND).map(([k, v]) => <span key={k} className="muted"><b className="mono">{k}</b> {v}</span>)}
            <span className="muted">— solid: depends on, blocks if it fails</span><span className="muted">- - dashed: donates evidence</span><span className="muted">Red outline: needs re-review if the anchor changes</span>
          </div>
        </div>
      </div>
      <aside className="panel" aria-label="Impact detail">
        <div className="hd"><div className="grow"><span className="caps">Impact of</span><div className="h3">{r.req_id} · {r.linked_part_id}</div></div><Severity v={r.severity} /></div>
        <div className="bd">
          <span className="muted">{r.requirement_text}</span>
          <div className="col"><span className="caps">If this changes</span>
            {Object.entries(SCENARIOS).map(([k, [l, note]]) => (
              <label key={k} className={`card tight row ${sc === k ? 'sel' : ''}`} style={{ cursor: 'pointer' }}><input type="radio" name="sc" checked={sc === k} onChange={() => setSc(k)} /><span><b>{l}</b><br /><span className="muted">{note}</span></span></label>))}</div>
          <div className="grid g3"><div className="card tight"><div className="caps">Re-review</div><div className="stat">{rr}</div></div><div className="card tight"><div className="caps">Check</div><div className="stat">{aff.length - rr}</div></div><div className="card tight"><div className="caps">Programs</div><div className="stat">{progs}</div></div></div>
          <div className="col"><span className="caps">Affected downstream</span>
            {aff.length === 0 && <span className="muted">Nothing downstream moves for this change.</span>}
            {aff.sort((a, b) => (a.flag === 'RE-REVIEW' ? 0 : 1) - (b.flag === 'RE-REVIEW' ? 0 : 1)).map((a) => (
              <div key={a.n.id} className="card tight col" style={{ gap: 2, cursor: 'pointer' }} onClick={() => setSel(a.n.id)}>
                <div className="row"><span className="grow trunc">{a.n.name}</span><Badge tone={a.flag === 'RE-REVIEW' ? 'fail' : 'warn'}>{a.flag}</Badge></div>
                <span className="muted">{a.reason}</span></div>))}</div>
          {selN && <div className="col"><span className="caps">Selected</span><div className="card tight col" style={{ gap: 2 }}><b>{selN.name}</b><span className="muted">{KIND[selN.kind]} · {selN.prog} · {selN.meta}</span>
            {selN.kind === 'REQ' && selN.id !== r.req_id && <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => go('/impact/' + selN.id)}>Re-center on {selN.id}</button>}
            {selN.id.startsWith('TST:') && !selN.id.includes('TR-') && <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => go('/test/' + selN.id.slice(4) + '?from=' + r.req_id)}>View Test</button>}</div></div>}
          <Btn onClick={() => go('/trace?req=' + r.req_id)}>Back to trace</Btn>
        </div>
      </aside>
    </div>
  )
}
