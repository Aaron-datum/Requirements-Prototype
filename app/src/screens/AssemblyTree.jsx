import Icon from '../components/Icon'
import { useMemo, useState } from 'react'
import { go } from '../router'
import { Badge, Btn, PageHead } from '../components/ui'
import { SUBASSEMBLIES, siBom, SCOPE } from '../data'

// Only the electrical group lacks CAD in this dataset (sensors / harness are bought-in, no model supplied).
const hasCad = (l) => l.subassembly !== 'Electrical & Sensors'

export default function AssemblyTree() {
  const [incl, setIncl] = useState(() => Object.fromEntries(siBom.map((l) => [l.part_id, true])))
  const [manual, setManual] = useState([])
  const [open, setOpen] = useState(() => Object.fromEntries(SUBASSEMBLIES.map((s) => [s, true])))
  const groups = useMemo(() => SUBASSEMBLIES.map((g) => ({ g, parts: siBom.filter((l) => l.subassembly === g) })), [])
  const count = Object.values(incl).filter(Boolean).length + manual.length
  const addManual = () => setManual([...manual, { id: 'MAN-' + (manual.length + 1), name: `Manual line ${manual.length + 1}` }])
  return (
    <div className="stage" style={{ flex: 1 }}>
      <div className="page">
        <PageHead title="Select components for the BOM" sub={<><span className="mono">Civic_Si_1.5T_Engine_MY2026.CATProduct</span> · 2.4 MB · CAD assembly routed to BOM</>}>
          <Btn>Change Routing</Btn>
        </PageHead>
        <div className="row"><span className="h3">Assembly tree</span><Badge tone="pass">Has CAD</Badge><Badge tone="neutral">No CAD</Badge><Btn className="right" onClick={addManual}>Add Manual Line</Btn></div>
        <div className="card" style={{ padding: 0 }}>
          {groups.map(({ g, parts }) => (
            <div key={g}>
              <div className="row" style={{ padding: '8px 12px', background: 'var(--bg-subtle)', cursor: 'pointer', borderTop: '1px solid var(--border-default)' }} onClick={() => setOpen({ ...open, [g]: !open[g] })}>
                <Icon n={open[g] ? 'down' : 'right'} /><span className="h3">{g}</span><span className="muted">{parts.filter((p) => incl[p.part_id]).length}/{parts.length} parts</span>
                <button className="linkbtn right" onClick={(e) => { e.stopPropagation(); const all = parts.every((p) => incl[p.part_id]); setIncl({ ...incl, ...Object.fromEntries(parts.map((p) => [p.part_id, !all])) }) }}>Toggle all</button>
              </div>
              {open[g] && parts.map((p) => (
                <label key={p.part_id} className="row" style={{ padding: '6px 12px 6px 32px', borderTop: '1px solid var(--border-default)' }}>
                  <input type="checkbox" checked={incl[p.part_id]} onChange={(e) => setIncl({ ...incl, [p.part_id]: e.target.checked })} />
                  <span className="grow">{p.name}</span><span className="mono muted">{p.part_id}</span>
                  <Badge tone={hasCad(p) ? 'pass' : 'neutral'}>{hasCad(p) ? 'Has CAD' : 'No CAD'}</Badge>
                </label>
              ))}
            </div>
          ))}
          {manual.map((m) => (
            <div key={m.id} className="row" style={{ padding: '6px 12px', borderTop: '1px solid var(--border-default)' }}>
              <span className="grow">{m.name}</span><Badge tone="neutral">No CAD</Badge><Badge tone="outline">Manual</Badge>
              <button className="linkbtn" onClick={() => setManual(manual.filter((x) => x !== m))}>Remove</button>
            </div>
          ))}
        </div>
      </div>
      <aside className="panel" aria-label="BOM summary">
        <div className="bd">
          <span className="caps">Blank BOM</span>
          <div><span className="stat">{count}</span> <span className="sec">lines from {siBom.length} parts</span></div>
          <dl className="kv">
            <dt>Reference</dt><dd>{SCOPE.bomId}</dd>
            <dt>RFQ</dt><dd>{SCOPE.rfq}</dd>
            <dt>Programs</dt><dd>Civic LX · Sport (surrogate sources)</dd>
            <dt>Template</dt><dd>OEM_BOM_Template.xlsx</dd>
          </dl>
          <Btn primary className="lg" onClick={() => go('/bom')}>Create BOM</Btn>
        </div>
      </aside>
    </div>
  )
}
