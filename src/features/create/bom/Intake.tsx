import { ArrowRight, FileText, Info, Link2, Plug, Upload, Box } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stub } from '../../../components/stub/Stub'
import { Badge, Button, Modal, SkeletonRows } from '../../../components/ui'
import { INTAKE, INTAKE_META, requirementScope, templateColumns, trackCounts, type PackageFile } from '../../../fixtures/derive-bom'
import { SOURCES } from '../../../fixtures/extras/bom/rules'
import { useService } from '../../../services/context'
import { PLM_DISABLED_TIP } from '../../../services/stubs/plm'
import { toastSuccess } from '../../../stores/toastStore'
import { useBomVocab } from './bomConfig'
import { useBomStore } from './bomStore'
import s from './bom.module.css'

/** 01 RFQ intake: package received, two tracks, connected sources, package contents with route pills, template columns. */
export function Intake() {
  const docs = useService('docs')
  const plm = useService('plm')
  const vocab = useBomVocab()
  const routes = useBomStore((st) => st.routes)
  const sources = useBomStore((st) => st.sources)
  const cycleRoute = useBomStore((st) => st.cycleRoute)
  const toggleSource = useBomStore((st) => st.toggleSource)
  const confirmed = useBomStore((st) => st.confirmedTemplateColumns)
  const confirmColumn = useBomStore((st) => st.confirmTemplateColumn)
  const [files, setFiles] = useState<PackageFile[] | null>(null)
  const [manage, setManage] = useState<string | null>(null)
  useEffect(() => { void docs.listPackage(INTAKE.rfqId).then((f) => setFiles(f as PackageFile[])) }, [docs])

  const t = trackCounts(routes)
  const scope = requirementScope(routes)
  const tpl = templateColumns()
  const sync = plm.syncState()
  const syncOf = (src: string) => sync.find((x) => x.source === src)
  const managed = SOURCES.find((x) => x.id === manage)

  return (
    <div className={s.page} data-testid="intake">
      <div className={s.pageHead}>
        <div className="col" style={{ gap: 4 }}>
          <div className="row"><h1 className="text-page">RFQ package received</h1><Badge tone="info">Parsed</Badge></div>
          <span className="secondary">{files ? files.length : 8} files · Last updated <span className="data">{INTAKE_META.received}</span> · {INTAKE_META.title}</span>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
          <span className="data muted">{INTAKE_META.rfqId} · due {INTAKE_META.due}</span>
          {t.assemblyRouted
            ? <Link to="/create/bom/02-tree"><Button primary size="lg">Review Assembly Tree <ArrowRight size={16} aria-hidden /></Button></Link>
            : <Button primary size="lg" disabled title="Route a CAD assembly to CAD → BOM first">Review Assembly Tree <ArrowRight size={16} aria-hidden /></Button>}
        </div>
      </div>

      <div className={s.grid2}>
        <section className={`${s.card} ${s.cardOn}`} aria-label="CAD to BOM" data-testid="track-cad">
          <div className="row"><Box size={16} aria-hidden /><h2 className="text-section grow">CAD → BOM</h2><span className="muted">Next step</span></div>
          <Stub id="cad-parser" note="Fixed assembly counts">
            <div className={s.stats}>
              <div className={s.stat}><span className="text-label-caps">Subassemblies</span><span className={s.statN} data-testid="cad-subs">{t.cad.subassemblies}</span></div>
              <div className={s.stat}><span className="text-label-caps">Parts</span><span className={s.statN} data-testid="cad-parts">{t.cad.parts}</span></div>
              <div className={s.stat}><span className="text-label-caps">Built off</span><span className="data" style={{ lineHeight: 'var(--lh-display-sm)' }}>{INTAKE_META.builtOff}</span></div>
            </div>
          </Stub>
        </section>
        <section className={s.card} aria-label="Documents to requirements" data-testid="track-docs">
          <div className="row"><FileText size={16} aria-hidden /><h2 className="text-section grow">Documents → Requirements</h2><span className="muted">Runs in background</span></div>
          <Stub id="doc-extraction" note="Static counts">
            <div className={s.stats}>
              <div className={s.stat}><span className="text-label-caps">Documents</span><span className={s.statN} data-testid="docs-count">{t.docs.documents}</span></div>
              <div className={s.stat}><span className="text-label-caps">Requirements extracted</span><span className={s.statN} data-testid="req-extracted">{scope.extracted}</span></div>
              <div className={s.stat}><span className="text-label-caps">In scope for this BOM</span><span className={s.statN} data-testid="req-inscope">{scope.inScope}</span></div>
            </div>
          </Stub>
          <span className="muted row" style={{ alignItems: 'flex-start' }}><Info size={14} aria-hidden style={{ flex: 'none', marginTop: 3 }} />{scope.extracted} extracted from the RFQ documents; {scope.inScope} are scoped to parts in this BOM. The other {scope.extracted - scope.inScope} cover parts outside it. {scope.traced} are traced to a BOM line and test today.</span>
        </section>
      </div>

      <Stub id="plm-connectors" note="Toggles and sync strings">
        <section className={s.card} aria-label="Connected sources" data-testid="sources">
          <div className="row wrap" style={{ gap: 'var(--gap-4)' }}>
            <span className="row"><Plug size={16} aria-hidden /><h2 className="text-section">Connected sources</h2></span>
            {SOURCES.map((src) => {
              const on = sources[src.id] !== false
              return (
                <div key={src.id} className="row grow" style={{ minWidth: 260 }} data-source={src.id}>
                  <div className="col grow" style={{ gap: 0 }}><span className="trunc">{src.label}</span><span className="data muted">{on ? `synced ${syncOf(src.plmSource)?.lastSync ?? ''}` : 'not syncing'}</span></div>
                  <Badge tone={on ? 'pass' : 'warn'}>{on ? 'Connected' : 'Not connected'}</Badge>
                  <Button size="sm" onClick={() => setManage(src.id)}>Manage</Button>
                </div>
              )
            })}
          </div>
          {Object.values(sources).some((v) => v === false) && <span className="muted">Source off. Quotes read "Cached quote"; cost-risk band widens.</span>}
        </section>
      </Stub>

      <section className={s.card} style={{ padding: 0 }} aria-label="Package contents">
        <div className="row" style={{ padding: 'var(--gap-3) var(--gap-4)' }}>
          <h2 className="text-section grow">Package contents</h2>
          <Button size="sm" disabled title={PLM_DISABLED_TIP}><Upload size={14} aria-hidden />Upload Files</Button>
          <Button size="sm" disabled title={PLM_DISABLED_TIP}><Link2 size={14} aria-hidden />Link from PLM</Button>
        </div>
        {!files ? <SkeletonRows rows={6} label="Loading package" /> : (
          <div className={s.tableWrap} style={{ border: 0, borderTop: '1px solid var(--border-default)', borderRadius: 0 }}>
            <table className={s.tbl} data-testid="package-table">
              <thead><tr><th>File</th><th>Detected as</th><th className="num" style={{ textAlign: 'right' }}>Size</th><th>Found</th><th>Routed to</th></tr></thead>
              <tbody>
                {files.map((f) => {
                  const route = routes[f.id] ?? f.route
                  const r = vocab.resolve('rfqRoute', route)
                  return (
                    <tr key={f.id} data-file={f.id}>
                      <td className="data">{f.name}</td><td>{f.detectedAs}</td><td className="num">{f.sizeLabel}</td><td>{f.found}</td>
                      <td><button type="button" className={s.routePill} style={{ background: 'none', border: 0, padding: 0 }} aria-label={`Route for ${f.name}: ${r.label}. Click to change.`} data-route={route} onClick={() => cycleRoute(f.id, route)}><Badge tone={r.tone} dashed>{r.label} ▾</Badge></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {t.template.routed && (
        <section className={s.card} aria-label="Template columns" data-testid="template-columns">
          <div className="row"><h2 className="text-section grow">Template columns</h2><span className="data muted">{t.template.total} = {t.template.matched} matched + {t.template.toConfirm} to confirm + {t.template.custom} custom</span></div>
          <div className={s.grid3}>
            <div className="col"><Badge tone="pass">Matched · {tpl.matched.length}</Badge>{tpl.matched.map((c) => <span key={c.header} className="row"><span className="grow">{c.header}</span><span className="data muted">{c.key}</span></span>)}</div>
            <div className="col"><Badge tone="warn">To confirm · {tpl.toConfirm.length}</Badge>
              {tpl.toConfirm.map((c) => (
                <span key={c.header} className="row"><span className="grow">{c.header}<span className="muted"> · {c.note}</span></span>
                  {confirmed.includes(c.header) ? <Badge tone="pass">Confirmed</Badge> : <Button size="sm" onClick={() => { confirmColumn(c.header); toastSuccess(`Column mapped: ${c.header} → ${c.suggestedKey}`) }}>Confirm</Button>}</span>
              ))}</div>
            <div className="col"><Badge tone="neutral">Custom · {tpl.custom.length}</Badge>{tpl.custom.map((c) => <span key={c.header}>{c.header}</span>)}<span className="muted">Custom and confirmed columns appear in BOM review under Additional.</span></div>
          </div>
        </section>
      )}

      {managed && (
        <Modal title={`Manage ${managed.label}`} onClose={() => setManage(null)}
          footer={<><Button onClick={() => setManage(null)}>Close</Button>
            <Button primary={sources[managed.id] === false} onClick={() => { toggleSource(managed.id); toastSuccess(sources[managed.id] === false ? `${managed.label} reconnected` : `${managed.label} disconnected`); setManage(null) }}>{sources[managed.id] === false ? 'Reconnect' : 'Disconnect'}</Button></>}>
          <div className="col"><span>{managed.note}</span><span className="muted">Simulated connector.</span></div>
        </Modal>
      )}
    </div>
  )
}
