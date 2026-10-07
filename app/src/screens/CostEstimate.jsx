import { useState } from 'react'
import { go, back, useRoute } from '../router'
import { useStore } from '../store'
import { Badge, Btn, Certainty, Meter, Modal, PageHead, Stamp } from '../components/ui'
import { costByPart, money, siBomByPart, sourcingOptions, partById } from '../data'

const CONF_TONE = { High: 'pass', Medium: 'info', Low: 'warn' }
const MAT_TONE = { Have: 'pass', 'Via surrogate': 'warn', Missing: 'fail' }
const MAT_LABEL = { '3d_cad': '3D CAD', '2d_drawing': '2D drawing', material_spec: 'Material spec' }

function estimateFor(l) {
  const e = costByPart[l.part_id]
  if (e) return { ...e, real: true }
  // Lines without a seeded estimate get a derived, clearly-labelled one.
  const c = l.certainty
  const conf = c === 'Actual' ? 'High' : c === 'Surrogate' ? 'Medium' : 'Low'
  const p = l.unit_price_usd
  return {
    real: false,
    routing_score: c === 'Actual' ? 95 : c === 'Surrogate' ? l.surrogate_match_pct : 40,
    routing_status: c === 'Actual' ? 'Supplier quote on file' : 'Suggested - not yet confirmed',
    suggested_model: c === 'Actual' ? 'Supplier quote (production part)' : `Surrogate-scaled from ${l.other_candidates[0]?.part_id || 'catalog'}`,
    next_best_alternative: 'Parametric estimate from weight and process class',
    why_this_model: [{ tag: 'PLM', note: `${l.part.manufacture_method}, ${l.part.material}.` }, { tag: c === 'Actual' ? 'RFQ' : 'Surrogate', note: l.provenance }],
    input_maturity: { '3d_cad': l.subassembly === 'Electrical & Sensors' ? 'Missing' : 'Have', '2d_drawing': c === 'Actual' ? 'Have' : 'Via surrogate', material_spec: 'Have' },
    cost_breakdown: [
      { line: 'Material', amount_usd: +(p * 0.45).toFixed(2), confidence: conf },
      { line: 'Processing', amount_usd: +(p * 0.35).toFixed(2), confidence: conf },
      { line: 'Tooling & overhead', amount_usd: +(p * 0.2).toFixed(2), confidence: c === 'Actual' ? 'Medium' : 'Low' },
    ],
  }
}

const FEATURES = {
  'Casting & machining': ['4 machined faces · ±0.05 mm', '6 tapped holes · M8', '2 core pulls (twin-scroll volute)', 'Bore Ø 62.0 mm · finish Ra 0.8'],
  default: ['2 machined faces', '4 tapped holes · M6', '1 bore · Ø 24 mm'],
}

export default function CostEstimate({ partId }) {
  const { state, decide } = useStore()
  const { query } = useRoute()
  const l = siBomByPart[partId]
  const [selLine, setSelLine] = useState(0)
  const [supSel, setSupSel] = useState(null)
  const [features, setFeatures] = useState(false)
  const [cmp, setCmp] = useState(['model'])
  if (!l) return <div className="page"><div className="empty">No Si BOM line for {partId}.</div></div>

  const e = estimateFor(l)
  const total = e.cost_breakdown.reduce((s, x) => s + x.amount_usd, 0)
  const sup = sourcingOptions(l)
  const sourcedId = state.sourced[partId]
  const picked = sup.find((s) => s.supplier.supplier_id === (supSel || sourcedId || l.supplier_id))
  const modelState = state.costModel[partId]
  const tl = e.cost_breakdown[selLine] || e.cost_breakdown[0]
  const alts = {
    model: { code: 'Alt model', name: e.next_best_alternative, delta: +(total * 0.07).toFixed(2), tier: 'Medium' },
    surrogate: l.other_candidates[0] ? { code: 'Alt surrogate', name: `Use ${l.other_candidates[0].part_id} geometry`, delta: +(total * -0.04).toFixed(2), tier: 'Medium' } : null,
    supplier: sup.find((s) => !s.current) ? { code: 'Alt supplier', name: sup.find((s) => !s.current).supplier.name, delta: +(sup.find((s) => !s.current).cost - l.unit_price_usd).toFixed(2), tier: 'Low' } : null,
  }

  return (
    <div className="page">
      <PageHead title={`${l.name} — cost estimate`} sub={<><span className="mono">{l.part_id}</span> · current supplier {l.supplier.name} ({l.region}) · {l.currency} · FX 3-mo avg · {sup.length} suppliers</>}>
        <Certainty v={l.certainty} />
        <Btn onClick={back}>Back to BOM</Btn>
        <Btn onClick={() => go('/bom/compare/' + l.bom_line_id)}>Compare Parts</Btn>
        {sourcedId ? <Badge tone="pass">Sourced · {sup.find((s) => s.supplier.supplier_id === sourcedId)?.supplier.name}</Badge>
          : <Btn primary onClick={() => decide('sourced', partId, picked.supplier.supplier_id, 'Set as sourced', `${l.part_id} · ${picked.supplier.name}`)}>Set as Sourced</Btn>}
      </PageHead>

      <div className="grid g2">
        <section className="card col">
          <span className="caps">Cost model routing</span>
          <div className="h3">{e.suggested_model}</div>
          <div className="row"><span className="muted">Routing score</span><Meter pct={e.routing_score} /><span className="mono">{e.routing_score}</span></div>
          <div className="row"><Badge tone={modelState === 'confirmed' ? 'pass' : modelState === 'overridden' ? 'info' : 'warn'}>{modelState === 'confirmed' ? 'Confirmed' : modelState === 'overridden' ? 'Overridden' : 'Suggested · not yet confirmed'}</Badge></div>
          <span className="muted">Next best: {e.next_best_alternative}</span>
          <div className="row">
            <Btn primary disabled={modelState === 'confirmed'} onClick={() => decide('costModel', partId, 'confirmed', 'Confirmed cost model', `${l.part_id} · ${e.suggested_model}`)}>Confirm Model</Btn>
            <Btn disabled={modelState === 'overridden'} onClick={() => decide('costModel', partId, 'overridden', 'Overrode cost model', `${l.part_id} → ${e.next_best_alternative}`)}>Override</Btn>
            {modelState && <Btn size="sm" onClick={() => decide('costModel', partId, undefined, 'Reset cost model', l.part_id)}>Undo</Btn>}
          </div>
          {modelState && <Stamp audit={state.audit} match={(a) => a.target.startsWith(l.part_id) && /cost model/i.test(a.action)} />}
          <hr className="hr" />
          <span className="caps">Why this model</span>
          {e.why_this_model.map((w, i) => <div key={i} className="row" style={{ alignItems: 'flex-start' }}><Badge tone="outline">{w.tag}</Badge><span className="grow">{w.note}</span></div>)}
        </section>
        <section className="card col">
          <span className="caps">Input maturity · pursuit</span>
          {Object.entries(e.input_maturity).map(([k, v]) => <div key={k} className="row"><span className="grow">{MAT_LABEL[k]}</span><Badge tone={MAT_TONE[v]}>{v}</Badge></div>)}
          <span className="muted">{e.real ? 'From the cost-model routing record.' : 'Derived estimate — no routing record is seeded for this line.'}</span>
          <hr className="hr" />
          <span className="caps">Estimate · {e.suggested_model.split(':')[0]}</span>
          <div className="stat">{money(total)}</div>
          <span className="muted">Unit price on BOM {money(l.unit_price_usd)} · range {money(total * 0.92, 0)}–{money(total * 1.1, 0)}</span>
        </section>
      </div>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <section className="card" style={{ padding: 0 }}>
          <table className="tbl"><thead><tr><th>Cost line</th><th className="num">Cost</th><th className="num">Share</th><th>Confidence</th></tr></thead><tbody>
            {e.cost_breakdown.map((c, i) => (
              <tr key={c.line} className={`rowhover ${i === selLine ? 'picked' : ''}`} onClick={() => setSelLine(i)} tabIndex={0} onKeyDown={(ev) => ev.key === 'Enter' && setSelLine(i)}>
                <td>{c.line}</td><td className="num">{money(c.amount_usd)}</td><td className="num">{Math.round((c.amount_usd / total) * 100)}%</td><td><Badge tone={CONF_TONE[c.confidence]}>{c.confidence}</Badge></td></tr>))}
            <tr><td><b>Landed cost</b></td><td className="num"><b>{money(total)}</b></td><td className="num">100%</td><td /></tr>
          </tbody></table>
        </section>
        <section className="card col">
          <span className="caps">Trace · {tl.line}</span>
          <div className="stat">{money(tl.amount_usd)}</div>
          <code className="mono">= {(tl.amount_usd / total).toFixed(2)} × landed {money(total)}</code>
          <dl className="kv">
            <dt>Source</dt><dd>{e.why_this_model[0]?.tag} · {e.why_this_model[0]?.note}</dd>
            <dt>Freshness</dt><dd>Synced 2026-10-01</dd><dt>Confidence</dt><dd><Badge tone={CONF_TONE[tl.confidence]}>{tl.confidence}</Badge></dd>
          </dl>
          <div><Btn size="sm" onClick={() => setFeatures(true)}>Open Features</Btn> <span className="muted">Detected CAD features behind this line</span></div>
        </section>
      </div>

      <section className="card" style={{ padding: 0 }} id="sourcing">
        <div style={{ padding: 12 }}><span className="h3">Sourcing options</span> <span className="muted">Select a row to preview the switch.</span></div>
        <table className="tbl"><thead><tr><th>Supplier</th><th>Region</th><th className="num">Landed cost</th><th className="num">Lead</th><th>Price source</th><th>Certainty</th></tr></thead><tbody>
          {sup.map((s) => (
            <tr key={s.supplier.supplier_id} className={`rowhover ${picked?.supplier.supplier_id === s.supplier.supplier_id ? 'picked' : ''}`} onClick={() => setSupSel(s.supplier.supplier_id)} tabIndex={0} onKeyDown={(ev) => ev.key === 'Enter' && setSupSel(s.supplier.supplier_id)}>
              <td>{s.supplier.name} {s.current && <Badge>current</Badge>}{sourcedId === s.supplier.supplier_id && <Badge tone="pass">sourced</Badge>}</td><td>{s.supplier.region}</td>
              <td className="num">{money(s.cost)}</td><td className="num">{s.lead} wk</td><td>{s.src}</td><td><Certainty v={s.cert} /></td></tr>))}
        </tbody></table>
        <div style={{ padding: 12 }} className="muted">{picked?.current ? 'Current supplier — no change.' : `If you switch to ${picked?.supplier.name}: ${money(picked?.cost - l.unit_price_usd)} per unit (${(((picked?.cost - l.unit_price_usd) / l.unit_price_usd) * 100).toFixed(1)}%), lead ${picked?.lead} wk.`}</div>
      </section>

      <section className="card col">
        <span className="h3">Compare alternatives</span>
        <div className="row wrap">{Object.entries(alts).filter(([, v]) => v).map(([k, v]) => (
          <label key={k} className="row"><input type="checkbox" checked={cmp.includes(k)} onChange={(ev) => setCmp(ev.target.checked ? [...cmp, k] : cmp.filter((x) => x !== k))} />{v.code}</label>))}</div>
        <table className="tbl"><thead><tr><th>Option</th><th>What changes</th><th className="num">Landed</th><th className="num">Δ vs current</th><th>Confidence</th></tr></thead><tbody>
          <tr><td>Current</td><td>{e.suggested_model}</td><td className="num">{money(total)}</td><td className="num">—</td><td><Badge tone="info">Medium</Badge></td></tr>
          {cmp.map((k) => alts[k] && <tr key={k}><td>{alts[k].code}</td><td>{alts[k].name}</td><td className="num">{money(total + alts[k].delta)}</td><td className="num" style={{ color: alts[k].delta > 0 ? 'var(--status-fail-fg)' : 'var(--status-pass-fg)' }}>{alts[k].delta > 0 ? '+' : '−'}{money(Math.abs(alts[k].delta))}</td><td><Badge tone={CONF_TONE[alts[k].tier]}>{alts[k].tier}</Badge></td></tr>)}
        </tbody></table>
      </section>

      {features && (
        <Modal title={`Detected features · ${tl.line}`} onClose={() => setFeatures(false)} footer={<Btn onClick={() => setFeatures(false)}>Close</Btn>}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{(FEATURES[tl.line] || FEATURES.default).map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="muted">Features are illustrative; real feature recognition comes from the CAD pipeline.</p>
        </Modal>
      )}
    </div>
  )
}
