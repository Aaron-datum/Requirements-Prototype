import { useState } from 'react'
import { go } from '../router'
import { Badge, Btn, PageHead } from '../components/ui'
import { SCOPE, SUBASSEMBLIES, siBom, requirements } from '../data'

const FILES = [
  ['Civic_Si_1.5T_Engine_MY2026.CATProduct', 'CAD assembly', '2.4 MB', `${siBom.length} parts`, 'CAD → BOM'],
  ['OEM_BOM_Template.xlsx', 'BOM template', '84 KB', '21 columns', 'CAD → BOM'],
  ['SOR-CIV-15.pdf', 'Statement of requirements', '3.1 MB', '11 requirements', 'Documents → Requirements'],
  ['ES-CIV-0150.pdf', 'Engineering specification', '5.8 MB', '5 requirements', 'Documents → Requirements'],
  ['OEM_DVP_Template.xlsx', 'DVP template', '126 KB', 'test library', 'Documents → Requirements'],
  ['Adient_Test_Library.xlsx', 'Test library', '210 KB', '15 tests', 'Documents → Requirements'],
  ['Turbo_Drawing_Pack_Rev-C.pdf', '2D drawings', '9.2 MB', '12 drawings', 'Reference'],
  ['RFQ_Cover_Letter.pdf', 'Cover letter', '210 KB', 'due ' + SCOPE.due, 'Reference'],
]
const SOURCES = [
  ['SAP S/4HANA', 'Last synced 2026-10-01 07:12', 'Connected', 'Sync Now'],
  ['LME aluminium · nickel', 'Last synced 2026-10-01 06:00', 'Connected', 'Sync Now'],
  ['ECB reference rates', 'Last synced 2026-10-01 04:30', 'Connected', 'Sync Now'],
]

export default function Intake() {
  const [synced, setSynced] = useState({})
  return (
    <div className="page">
      <PageHead title="RFQ package received" sub={<>Parsed · {FILES.length} files · Last updated 2026-10-01 14:08 · {SCOPE.rfq} · due {SCOPE.due}</>}>
        <Btn primary className="lg" onClick={() => go('/tree')}>Review Assembly Tree</Btn>
      </PageHead>
      <div className="grid g2">
        <div className="card col">
          <div className="row"><span className="h3">CAD → BOM</span><Badge tone="info">Next step</Badge></div>
          <div className="grid g3">
            <div><div className="caps">Subassemblies</div><div className="stat">{SUBASSEMBLIES.length}</div></div>
            <div><div className="caps">Parts</div><div className="stat">{siBom.length}</div></div>
            <div><div className="caps">Built off</div><div className="stat" style={{ fontSize: 14, lineHeight: '28px' }}>LX · Sport</div></div>
          </div>
        </div>
        <div className="card col">
          <div className="row"><span className="h3">Documents → Requirements</span><Badge>Runs in background</Badge></div>
          <div className="grid g3">
            <div><div className="caps">Documents</div><div className="stat">2</div></div>
            <div><div className="caps">Requirements</div><div className="stat">{requirements.length}</div></div>
            <div><div className="caps">Test library</div><div className="stat">15</div></div>
          </div>
        </div>
      </div>
      <section className="card col">
        <span className="h3">Connected sources</span>
        {SOURCES.map(([n, sync, st, act]) => (
          <div key={n} className="row" style={{ borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
            <span className="grow">{n}</span><span className="muted">{synced[n] || sync}</span><Badge tone="pass">{st}</Badge>
            <Btn size="sm">Manage</Btn>
            <Btn size="sm" onClick={() => setSynced({ ...synced, [n]: 'Synced just now' })}>{act}</Btn>
          </div>
        ))}
      </section>
      <section className="card" style={{ padding: 0 }}>
        <div className="row" style={{ padding: 12 }}>
          <span className="h3 grow">Package contents</span>
          <Btn>Upload Files</Btn><Btn>Link from PLM</Btn>
        </div>
        <table className="tbl">
          <thead><tr><th>File</th><th>Detected as</th><th>Size</th><th>Found</th><th>Routed to</th></tr></thead>
          <tbody>
            {FILES.map(([n, k, s, f, rt]) => (
              <tr key={n}><td className="mono">{n}</td><td>{k}</td><td className="mono">{s}</td><td>{f}</td><td><Badge tone={rt === 'Reference' ? 'neutral' : 'info'}>{rt}</Badge></td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
