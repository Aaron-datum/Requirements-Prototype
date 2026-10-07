import { useState } from 'react'
import { go, back } from '../router'
import { useStore } from '../store'
import { Badge, Btn, Certainty, Meter, PageHead, Result, Seg, Severity } from '../components/ui'
import { bomLineById, money, partById, programById, progShort, requirements, supplierById } from '../data'

const FIELDS = [
  ['Part number', (p) => p.part_id], ['Name', (p) => p.name], ['Material', (p) => p.material], ['Process', (p) => p.manufacture_method],
  ['Complexity', (p) => p.complexity], ['Weight', (p) => p.weight_kg + ' kg'], ['Base price', (p) => money(p.base_price_usd)],
  ['Lead time', (p) => p.lead_time_wk + ' wk'], ['Supplier', (p) => supplierById[p.supplier_id].name],
]

export default function Compare({ lineId }) {
  const { state, decide } = useStore()
  const [mode, setMode] = useState('Side by side')
  const l = bomLineById[lineId]
  if (!l) return <div className="page"><div className="empty">BOM line not found.</div></div>
  const cand = l.other_candidates[0]
  const other = cand ? partById[cand.part_id] : l.part
  const otherProg = cand ? cand.program_id : 'PGM-CIV-LX'
  const b = l.surrogate_breakdown
  const geo = b?.geometry ?? 100
  const confirmed = !!state.surrogate[l.bom_line_id]
  const reqs = requirements.filter((r) => r.linked_part_id === l.part_id)
  const mass = +(l.part.weight_kg - other.weight_kg).toFixed(2)

  return (
    <div className="page">
      <PageHead title={`${l.name} — physical similarity`} sub={<><span className="mono">{l.part_id}</span> → <span className="mono">{other.part_id}</span> ({progShort(otherProg)}) · geometry + material</>}>
        <Certainty v={l.certainty} />
        <Btn onClick={back}>Back to BOM</Btn>
        <Btn onClick={() => go('/bom/cost/' + l.part_id + '?s=sourcing')}>Compare Suppliers</Btn>
        {confirmed ? <Badge tone="pass">Confirmed surrogate</Badge>
          : <Btn primary disabled={!cand || l.surrogate_match_pct < 60} onClick={() => decide('surrogate', l.bom_line_id, 'confirmed', 'Confirmed surrogate', `${l.part_id} ← ${other.part_id}`)}>Accept as Surrogate</Btn>}
      </PageHead>
      <div className="grid g2">
        <div className="card col">
          <div className="row"><span className="h3 grow">Viewer</span><Seg value={mode} onChange={setMode} options={['Side by side', 'Overlap', 'Difference']} /></div>
          <div className="row" style={{ gap: 12 }}>
            {(mode === 'Side by side' ? [['BOM line · ' + l.part_id, 'cad-preview-2.png'], ['Surrogate · ' + other.part_id, 'cad-preview-4.png']] : [[mode === 'Overlap' ? 'Aligned overlay' : 'Difference · BOM-only vs surrogate-only', 'cad-preview-2.png']]).map(([cap, img]) => (
              <figure key={cap} className="grow" style={{ margin: 0, border: '1px solid var(--border-default)', borderRadius: 5, background: '#fff', position: 'relative' }}>
                <img src={'./' + img} alt={cap} style={{ width: '100%', height: 200, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                {mode !== 'Side by side' && <img src="./cad-preview-4.png" alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: 200, objectFit: 'contain', opacity: 0.5, filter: mode === 'Difference' ? 'hue-rotate(160deg)' : 'none' }} />}
                <figcaption className="muted" style={{ padding: '4px 8px' }}>{cap}</figcaption>
              </figure>))}
          </div>
          <div className="row wrap"><Badge tone="fail">BOM line only</Badge><Badge tone="pass">Overlap</Badge><Badge tone="info">Surrogate only</Badge><span className="muted">Preview imagery is a placeholder — the CAD viewer is out of scope.</span></div>
        </div>
        <div className="card col">
          <span className="h3">Part fields · BOM line ↔ match</span>
          <table className="tbl"><thead><tr><th>Field</th><th>BOM line</th><th>Surrogate</th></tr></thead><tbody>
            {FIELDS.map(([k, f]) => { const a = f(l.part), c = f(other); return (
              <tr key={k}><td className="muted">{k}</td><td>{a}</td><td style={{ background: a === c ? 'var(--status-pass-bg)' : undefined }}>{c}{a === c && <span className="muted"> · match</span>}</td></tr>) })}
          </tbody></table>
          <span className="muted">Matching fields highlighted and labelled.</span>
        </div>
      </div>
      <div className="grid g3">
        <div className="card col"><span className="caps">Similarity</span><div className="stat">{l.surrogate_match_pct ?? 100}%</div>
          {b ? Object.entries(b).map(([k, v]) => <div key={k} className="row"><span style={{ width: 150 }}>{k.replace(/_/g, ' ')}</span><Meter pct={v} /><span className="mono">{v}</span></div>) : <span className="muted">Literal duplicate — identical geometry and material.</span>}</div>
        <div className="card col"><span className="caps">By dimension</span>
          <dl className="kv"><dt>Volume match</dt><dd className="mono">{(geo * 0.99).toFixed(1)} %</dd><dt>Max deviation</dt><dd className="mono">{((100 - geo) / 10).toFixed(1)} mm</dd><dt>Mass delta</dt><dd className="mono">{mass > 0 ? '+' : ''}{mass} kg</dd><dt>Material</dt><dd>{l.part.material === other.material ? 'identical' : 'differs'}</dd><dt>Aligned by</dt><dd>3 constraints</dd></dl></div>
        <div className="card col"><span className="caps">Provenance</span><span>{l.provenance}</span><span className="muted">Program {programById[otherProg].name}</span></div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="row" style={{ padding: 12 }}><span className="h3 grow">Requirements driving part selection</span><span className="muted">{reqs.length} on this part</span>{reqs[0] && <Btn size="sm" onClick={() => go('/trace')}>Open Requirement Trace</Btn>}</div>
        {reqs.length ? <table className="tbl"><thead><tr><th>Requirement</th><th>Source</th><th>Severity</th><th>Text</th><th>Driven by</th></tr></thead><tbody>
          {reqs.map((r) => <tr key={r.req_id}><td><span className="mono">{r.req_id}</span> {r.title}</td><td>{r.citation}</td><td><Severity v={r.severity} /></td><td>{r.text_status}</td><td>{r.driven_by_status}{r.driven_by_confidence != null && ` ${r.driven_by_confidence}%`}</td></tr>)}</tbody></table>
          : <div className="empty">No requirements are linked to this part.</div>}
      </div>
    </div>
  )
}
