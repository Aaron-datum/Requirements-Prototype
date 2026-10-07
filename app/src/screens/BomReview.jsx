import Icon from '../components/Icon'
import { useMemo, useState } from 'react'
import { go } from '../router'
import { useStore } from '../store'
import TableShell from '../components/TableShell'
import { Badge, Btn, Certainty, KV, Meter, PageHead, Stamp, Tabs } from '../components/ui'
import {
  SURROGATE_THRESHOLD, SCOPE, SUBASSEMBLIES, certaintyCounts, costByPart, money, partById, programById, progShort, programUsage, requirements,
  siBom, sum, bomLines,
} from '../data'

export const lineConf = (l, st) =>
  l.certainty === 'Actual' ? 1 : l.certainty === 'Surrogate' ? (st.surrogate[l.bom_line_id] ? 0.95 : l.surrogate_match_pct / 100) : l.certainty === 'Estimated' ? 0.4 : 0.2

const BREAKDOWN = [
  ['geometry', 'Geometry'], ['manufacture_complexity', 'Manufacture complexity'], ['material', 'Material'],
  ['supplier_location', 'Supplier / location'], ['order_of_magnitude', 'Order of magnitude'],
]

// Modeled cost drivers — deterministic per part so the Costing tab is stable between visits.
function drivers(l) {
  const h = [...l.part_id].reduce((a, c) => a + c.charCodeAt(0), 0)
  const foreign = !l.region.startsWith('US')
  return [
    ['FX exposure', foreign ? `${3 + (h % 8)}%` : '0%', foreign ? `${l.currency} quotes vs. USD · ECB 3-mo avg` : 'USD-denominated'],
    ['Price source', l.certainty === 'Actual' ? '±2%' : `±${4 + (h % 7)}%`, l.price_source],
    ['Tariff', foreign ? `${2 + (h % 5)}%` : '0%', `Origin ${l.region}`],
    ['Material index', `${1 + (h % 6)}%`, `${l.part.material} · LME`],
  ]
}

export default function BomReview() {
  const { state, decide } = useStore()
  const [sel, setSel] = useState(null)
  const [tab, setTab] = useState('Summary')
  const [searched, setSearched] = useState(null)
  const line = sel && siBom.find((l) => l.bom_line_id === sel)

  const total = sum(siBom, (l) => l.ext_price)
  const risk = sum(siBom, (l) => l.ext_price * (1 - lineConf(l, state))) / total
  const riskLabel = risk < 0.06 ? 'Low' : risk < 0.14 ? 'Moderate' : 'High'
  const resolved = siBom.filter((l) => l.certainty === 'Actual' || (l.certainty === 'Surrogate' && state.surrogate[l.bom_line_id])).length
  const cc = certaintyCounts()
  const confirmed = Object.keys(state.surrogate).length
  const unresolved = siBom.filter((l) => l.certainty === 'Estimated' || l.certainty === 'No match' || (l.certainty === 'Surrogate' && !state.surrogate[l.bom_line_id])).length

  const columns = useMemo(() => [
    { key: 'name', label: 'Part name', group: 'Identity', pinned: true, type: 'text', get: (r) => r.name + ' ' + r.part_id,
      render: (r) => <div><div>{r.name}</div><div className="mono muted">{r.part_id}</div></div> },
    { key: 'subassembly', label: 'Subassembly', group: 'Identity', type: 'enum', visible: false, get: (r) => r.subassembly },
    { key: 'qty', label: 'Qty', group: 'Cost', type: 'range', align: 'right', get: (r) => r.quantity, render: (r) => <span className="num">{r.quantity}</span> },
    { key: 'unit', label: 'Unit price', group: 'Cost', type: 'range', align: 'right', get: (r) => r.unit_price_usd, render: (r) => <span className="num">{money(r.unit_price_usd)}</span> },
    { key: 'ext', label: 'Extended', group: 'Cost', type: 'range', align: 'right', get: (r) => r.ext_price, render: (r) => <span className="num">{money(r.ext_price)}</span> },
    { key: 'src', label: 'Price source', group: 'Cost', type: 'enum', visible: false, get: (r) => r.price_source },
    { key: 'supplier', label: 'Supplier', group: 'Sourcing', type: 'enum', get: (r) => r.supplier.name },
    { key: 'region', label: 'Region', group: 'Sourcing', type: 'enum', visible: false, get: (r) => r.region },
    { key: 'lead', label: 'Lead (wk)', group: 'Sourcing', type: 'range', align: 'right', visible: false, get: (r) => r.part.lead_time_wk, render: (r) => <span className="num">{r.part.lead_time_wk}</span> },
    { key: 'certainty', label: 'Certainty', group: 'Sourcing', type: 'enum', get: (r) => r.certainty,
      render: (r) => <span className="row"><Certainty v={r.certainty} />{r.certainty === 'Surrogate' && state.surrogate[r.bom_line_id] && <Badge tone="pass">Confirmed</Badge>}</span> },
    { key: 'match', label: 'Match %', group: 'Sourcing', type: 'range', align: 'right', get: (r) => r.surrogate_match_pct, render: (r) => <span className="num">{r.surrogate_match_pct == null ? '—' : r.surrogate_match_pct + '%'}</span> },
    { key: 'used', label: 'Used on', group: 'Sourcing', type: 'enum', get: (r) => programUsage(r.part_id).map(progShort).join(' · '), visible: false },
    { key: 'material', label: 'Material', group: 'Manufacture', type: 'enum', visible: false, get: (r) => r.part.material },
    { key: 'method', label: 'Process', group: 'Manufacture', type: 'enum', visible: false, get: (r) => r.part.manufacture_method },
    { key: 'complexity', label: 'Complexity', group: 'Manufacture', type: 'enum', visible: false, get: (r) => r.part.complexity },
    { key: 'weight', label: 'Weight (kg)', group: 'Manufacture', type: 'range', align: 'right', visible: false, get: (r) => r.part.weight_kg, render: (r) => <span className="num">{r.part.weight_kg}</span> },
    { key: 'reqs', label: 'Reqs', group: 'Identity', type: 'range', align: 'right', get: (r) => requirements.filter((q) => q.linked_part_id === r.part_id).length, render: (r) => <span className="num">{requirements.filter((q) => q.linked_part_id === r.part_id).length}</span> },
  ], [state.surrogate])

  return (
    <div className="fill">
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--border-default)' }} className="col">
        <PageHead title={<>Civic Si 1.5T Engine <Badge tone="info">Quoting · {SCOPE.rfq}</Badge></>}
          sub={<>BOM · {siBom.length} lines · 3 programs · owner {programById['PGM-CIV-SI'].owner}</>}>
          <Btn onClick={() => { setSearched({ n: cc.Surrogate + cc.Estimated }); }}>Re-run Surrogate Search</Btn>
          <Btn primary onClick={() => go('/composition')}>Open Program Composition</Btn>
        </PageHead>
        {searched && <div className="banner" role="status">Surrogate search complete against Civic LX and Sport: {cc.Actual} exact carryovers, {cc.Surrogate} surrogates, {cc.Estimated} estimated, {cc['No match']} no match.</div>}
        <div className="grid g4">
          <div className="card tight"><div className="caps">First-order cost</div><div className="stat">{money(total, 0)}</div><div className="muted">per engine · {siBom.length} lines</div></div>
          <div className="card tight"><div className="caps">Cost risk</div><div className="stat">{riskLabel}</div><div className="muted">{(risk * 100).toFixed(1)}% of spend weighted by certainty</div></div>
          <div className="card tight"><div className="caps">Reuse rate</div><div className="stat">{Math.round((resolved / siBom.length) * 100)}%</div><div className="muted">resolved to a production part · {resolved}/{siBom.length}</div></div>
          <div className="card tight col" style={{ gap: 4 }}><div className="caps">Match certainty</div>
            {Object.entries(cc).map(([k, v]) => <div key={k} className="row"><span style={{ width: 70 }}>{k}</span><Meter pct={(v / siBom.length) * 100} tone={{ Actual: 'pass', Surrogate: 'info', Estimated: 'warn', 'No match': 'fail' }[k]} /><span className="mono" style={{ width: 24, textAlign: 'right' }}>{v}</span></div>)}</div>
        </div>
        <div className="row"><span className="sec">Surrogates confirmed <b className="mono">{confirmed}</b> · Unresolved <b className="mono">{unresolved}</b></span></div>
      </div>
      <div className="stage" style={{ minHeight: 0 }}>
        <TableShell id="bom" columns={columns} card={(r) => ({ img: `./cad-preview-${r.part_id.charCodeAt(r.part_id.length - 1) % 2 ? 2 : 4}.png`, title: r.name, sub: r.part_id, meta: money(r.unit_price_usd), badge: <Certainty v={r.certainty} /> })} rows={siBom} rowId={(r) => r.bom_line_id} selectedId={sel} onSelect={(id) => { setSel(id); setTab('Summary') }}
          groupOptions={[{ key: 'sub', label: 'Subassembly', get: (r) => r.subassembly }]}
          folderMeta={(rs) => money(sum(rs, (r) => r.ext_price)) + ' · ' + rs.filter((r) => r.certainty === 'Actual').length + ' carryover'} />
        {line && <LinePanel line={line} tab={tab} setTab={setTab} onClose={() => setSel(null)} />}
      </div>
    </div>
  )
}

function LinePanel({ line: l, tab, setTab, onClose }) {
  const { state, decide } = useStore()
  const [q, setQ] = useState('')
  const [manual, setManual] = useState(false)
  const reqs = requirements.filter((r) => r.linked_part_id === l.part_id)
  const used = programUsage(l.part_id)
  const confirmed = !!state.surrogate[l.bom_line_id]
  const best = l.other_candidates[0]
  const weak = l.surrogate_match_pct != null && l.surrogate_match_pct < SURROGATE_THRESHOLD
  const est = costByPart[l.part_id]
  const matches = q.length > 1 ? bomLines.filter((b) => b.program_id !== 'PGM-CIV-SI' && (b.part_id + b.name).toLowerCase().includes(q.toLowerCase())).slice(0, 5) : []

  return (
    <aside className="panel" aria-label="BOM line detail">
      <div className="hd">
        <div className="grow"><div className="h3">{l.name}</div><div className="mono muted">{l.part_id} · {l.subassembly}</div></div>
        <Certainty v={l.certainty} /><Btn size="sm" className="ghost icon" onClick={onClose} aria-label="Close panel"><Icon n="x" /></Btn>
      </div>
      <div style={{ padding: '0 16px' }}><Tabs value={tab} tabs={['Summary', 'Similarity', 'Costing', 'PLM']} onChange={setTab} /></div>
      <div className="bd">
        {tab === 'Summary' && (<>
          <div className="col"><span className="caps">At a glance</span>
            <KV rows={[['Supplier', `${l.supplier.name} · ${l.region}`], ['Quantity', l.quantity], ['Program usage', used.map(progShort).join(' · ')], ['Process', l.part.manufacture_method], ['Material', l.part.material]]} /></div>
          <div className="col"><span className="caps">Requirements on this line</span>
            {reqs.length === 0 ? <span className="muted">None linked in this RFQ.</span> : reqs.map((r) => (
              <a key={r.req_id} onClick={() => go('/trace')} className="row"><span className="mono">{r.req_id}</span><span className="grow trunc">{r.title}</span></a>))}
            {reqs[0] && <span className="muted">from {reqs[0].citation}</span>}</div>
          <div className="col"><span className="caps">Cost</span><div className="stat">{money(l.unit_price_usd)}</div><span className="muted">{l.price_source}</span>
            <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => setTab('Costing')}>Open costing detail</button></div>
          <div className="col"><span className="caps">Physical match</span>
            <span>{l.certainty === 'Actual' ? 'Identical part already in production.' : l.surrogate_match_pct != null ? `Closest: ${best?.part_id} · ${l.surrogate_match_pct}%` : 'No equivalent on any program.'}</span>
            <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => setTab('Similarity')}>Open similarity detail</button></div>
        </>)}

        {tab === 'Similarity' && (<>
          {l.certainty === 'No match' && (
            <div className="card tight col"><Badge tone="fail">No match</Badge><span>{l.provenance}</span>
              {l.carry_note && <span className="muted">{l.carry_note}</span>}
              <div className="row"><Btn onClick={() => setManual(true)}>Match manually</Btn><Btn>Request quote</Btn></div></div>)}
          {l.certainty === 'Actual' && (
            <div className="card tight col"><span className="caps">Provenance</span><span>{l.provenance}</span>
              <span className="muted">Identical geometry and material on {used.filter((p) => p !== 'PGM-CIV-SI').map(progShort).join(' · ') || 'no other program'}; differs only in PLM metadata.</span></div>)}
          {l.surrogate_breakdown && (<>
            {weak && <div className="banner warn"><b>Below threshold</b> — {l.surrogate_match_pct}% is under the {SURROGATE_THRESHOLD}% surrogate threshold. Routed to an estimated cost model.</div>}
            <div className="card col">
              <div className="row"><span className="caps">Similar to</span><span className="right mono">{l.surrogate_match_pct}%</span></div>
              <div className="h3">{best ? `${partById[best.part_id].name} · ${best.part_id}` : '—'}</div>
              <span className="muted">{best && programById[best.program_id].name}</span>
              {BREAKDOWN.map(([k, label]) => (
                <div key={k} className="row"><span style={{ width: 150 }}>{label}</span><Meter pct={l.surrogate_breakdown[k]} /><span className="mono" style={{ width: 34, textAlign: 'right' }}>{l.surrogate_breakdown[k]}</span></div>))}
              <div className="row"><Btn onClick={() => go('/bom/compare/' + l.bom_line_id)}>Compare parts</Btn>
                {confirmed ? <Badge tone="pass">Confirmed surrogate</Badge>
                  : <Btn primary disabled={weak} onClick={() => decide('surrogate', l.bom_line_id, 'confirmed', 'Confirmed surrogate', `${l.part_id} ← ${best.part_id}`)}>Accept as surrogate</Btn>}
                {confirmed && <Btn size="sm" onClick={() => decide('surrogate', l.bom_line_id, undefined, 'Cleared surrogate', l.part_id)}>Undo</Btn>}</div>
              {confirmed && <Stamp audit={state.audit} match={(a) => a.action === 'Confirmed surrogate' && a.target.startsWith(l.part_id)} />}
            </div>
            <div className="col"><span className="caps">Provenance</span><span>{l.provenance}</span></div>
            {l.other_candidates.length > 1 && (<div className="col"><span className="caps">Other candidates · {l.other_candidates.length - 1}</span>
              {l.other_candidates.slice(1).map((c) => (<div key={c.part_id + c.program_id} className="card tight row"><span className="grow"><b className="mono">{c.part_id}</b> · {partById[c.part_id].name}<br /><span className="muted">{progShort(c.program_id)}</span></span><span className="mono">{c.match_pct}%</span></div>))}</div>)}
          </>)}
          {manual && <div className="card tight col"><input type="search" placeholder="Search by part number, name, or program…" value={q} onChange={(e) => setQ(e.target.value)} />
            {matches.map((m) => <div key={m.bom_line_id} className="row"><span className="grow">{m.name} <span className="mono muted">{m.part_id} · {progShort(m.program_id)}</span></span>
              <Btn size="sm" onClick={() => { decide('surrogate', l.bom_line_id, 'confirmed', 'Manual match', `${l.part_id} ← ${m.part_id}`); setManual(false) }}>Use</Btn></div>)}
            <span className="muted">Manual matches carry Provenance: manual and no computed similarity score.</span></div>}
        </>)}

        {tab === 'Costing' && (<>
          <div className="col"><div className="stat">{money(l.unit_price_usd)}</div><Certainty v={l.certainty} />
            <span className="muted">Provenance: {l.price_source}</span></div>
          <div className="col"><span className="caps">What drives the uncertainty</span>
            {drivers(l).map(([k, v, note]) => (<div key={k} className="row"><span style={{ width: 110 }}>{k}</span><span className="mono" style={{ width: 40 }}>{v}</span><span className="muted grow trunc">{note}</span></div>))}</div>
          <div className="col"><span className="caps">Where it’s made</span><KV rows={[['Supplier', l.supplier.name], ['Region', l.region], ['Lead time', l.part.lead_time_wk + ' wk']]} /></div>
          {est && <div className="card tight col"><span className="caps">Cost model routing</span><span>{est.suggested_model}</span><span className="muted">Routing score {est.routing_score} · {state.costModel[l.part_id] ? 'Confirmed' : est.routing_status}</span></div>}
          <div className="row"><Btn primary onClick={() => go('/bom/cost/' + l.part_id)}>Open Cost Estimate</Btn><Btn onClick={() => go('/bom/cost/' + l.part_id + '?s=sourcing')}>Compare suppliers</Btn></div>
        </>)}

        {tab === 'PLM' && (<>
          <KV rows={[['Part number', l.part_id], ['Description', l.name], ['Subsystem', l.part.subsystem], ['Material', l.part.material], ['Process', l.part.manufacture_method], ['Complexity', l.part.complexity], ['Weight', l.part.weight_kg + ' kg'], ['Lead time', l.part.lead_time_wk + ' wk'], ['Revision', 'Rev C']]} />
          <Btn disabled title="PLM integration is out of scope for this prototype">Open in PLM</Btn>
        </>)}
      </div>
    </aside>
  )
}
