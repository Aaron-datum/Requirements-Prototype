import { ArrowRight, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FieldRenderer } from '../../../components/fields/FieldRenderer'
import { SidePanel } from '../../../components/panels/Panels'
import { MatchQuality } from '../../../components/quality/MatchQuality'
import { Stub } from '../../../components/stub/Stub'
import { Badge, Button, EmptyState, Seg, Tabs } from '../../../components/ui'
import { ViewerPlaceholder } from '../../../components/viewer/Viewer'
import { useConfig, useVocab } from '../../../config/useConfig'
import { partById, programById } from '../../../fixtures/civic'
import { compareMetrics, drivingRequirements, plmRecord, programShort, qualityOf } from '../../../fixtures/derive-bom'
import { PLM_DISABLED_TIP } from '../../../services/stubs/plm'
import { BreakdownBars } from './BreakdownBars'
import { REQ_LINKS } from './bomConfig'
import { findSurrogateLink } from './searchLinks'
import { useBomStore } from './bomStore'
import { useBomRows, useLineMode, useSurrogateActions } from './useBomData'
import s from './bom.module.css'

type Mode = 'comparison' | 'alignment'
type LeftTab = 'assembly' | 'plm' | 'measurements'

/** 03b Compare parts: the BOM line against its closest production part, with the requirements that drive the choice. */
export function Compare() {
  const [params, setParams] = useSearchParams()
  const config = useConfig()
  const vocab = useVocab()
  const rows = useBomRows()
  const modeOf = useLineMode()
  const { accept, undo } = useSurrogateActions()
  const [mode, setMode] = useState<Mode>('comparison')
  const [leftTab, setLeftTab] = useState<LeftTab>('assembly')
  const [linked, setLinked] = useState(true)
  const [reqSel, setReqSel] = useState<string | null>(null)

  // A deep link to a compare implies the search has been run.
  useEffect(() => { if (useBomStore.getState().search === 'idle') useBomStore.getState().finishSearch() }, [])
  const row = rows.find((r) => r.id === params.get('line')) ?? null
  if (!row) return <div className={s.page}><EmptyState title="No BOM line selected" action={<Link to="/create/bom/03-review"><Button primary>Back to BOM</Button></Link>}>Open a line in BOM review and choose Compare parts.</EmptyState></div>
  const candId = params.get('cand') ?? row.similarTo?.partId ?? row.candidates[0]?.partId ?? null
  const other = candId ? partById[candId] : undefined
  const back = <Link to={`/create/bom/03-review?line=${row.id}&tab=similarity`}><Button>Back to BOM</Button></Link>
  if (!other || !candId) {
    return <div className={s.page}><EmptyState title={`${row.name}: nothing to compare`} action={<div className="row">{back}<Link to={findSurrogateLink(row.partNumber, row.id)}><Button primary>Find a surrogate</Button></Link></div>}>No candidate above the search floor exists for this line.</EmptyState></div>
  }

  const m = compareMetrics(row.partNumber, candId, row.part, other)
  const mode3 = modeOf(row)
  const reqs = drivingRequirements(row.part, other)
  const changed = reqs.filter((r) => config.matchRules.changedRaw.includes(r.textStatus) || config.matchRules.changedRaw.includes(r.drivenByStatus)).length
  const picked = reqs.find((r) => r.reqId === reqSel) ?? reqs[0]
  const prodProgram = row.candidates.find((c) => c.partId === candId)?.programId ?? row.similarTo?.programId ?? 'PGM-CIV-LX'
  const quality = { ...qualityOf(row, mode3), similarity: { percent: m.matchPct } }
  const delta = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)} mm`
  const subtitle = `${row.partNumber} → ${candId} (${programShort(prodProgram)}) · geometry + material`
  const tier = vocab.resolve('dataType', row.certainty)

  return (
    <div className={s.review} data-testid="compare-parts">
      <div className={s.reviewHead}>
        <div className={s.pageHead}>
          <div className="col" style={{ gap: 4 }}>
            <div className="row wrap"><h1 className="text-page">{row.name} — physical similarity</h1><Badge tone={tier.tone}>{tier.label}{row.matchPct != null ? ` ${row.matchPct}%` : ''}</Badge></div>
            <span className="data muted">{subtitle}</span>
          </div>
          <div className={s.actions}>
            {back}
            <Link to={`/create/bom/03d-cost?part=${row.partNumber}&line=${row.id}&view=sourcing`}><Button>Compare Suppliers</Button></Link>
            {row.confirmed ? <><Badge tone="pass" icon={<Check size={12} aria-hidden />}>Confirmed surrogate</Badge><Button size="sm" onClick={() => undo(row)}>Undo</Button></>
              : <Button primary onClick={() => accept({ id: row.id, partNumber: row.partNumber, matchPct: m.matchPct }, candId)}>Accept as Surrogate</Button>}
          </div>
        </div>
      </div>
      <div className={s.cmpLayout}>
        <aside className={s.cmpLeft} aria-label="Compared parts">
          <section>
            <span className="text-label-caps">Part name · BOM line ↔ match</span>
            <div className="row"><div className={s.card} style={{ flex: 1, padding: 'var(--gap-2) var(--gap-3)' }}><span className="text-label-caps">BOM line</span><span className="data">{row.partNumber}</span></div>
              <div className={s.card} style={{ flex: 1, padding: 'var(--gap-2) var(--gap-3)' }}><span className="text-label-caps">Surrogate</span><span className="data">{candId}</span></div></div>
            <span className="text-label-caps">View mode</span>
            <Seg value={mode} onChange={setMode} label="Compare mode" options={[['comparison', 'Comparison'], ['alignment', 'Alignment']]} />
          </section>
          <section>
            <Tabs value={leftTab} onChange={setLeftTab} label="Compare tabs" tabs={[{ key: 'assembly', label: 'Assembly', count: 4 }, { key: 'plm', label: 'PLM' }, { key: 'measurements', label: 'Measurements', count: 2 }]} />
            {leftTab === 'assembly' && (
              <div className="col" style={{ gap: 2 }}>
                <span className="text-label-caps">BOM line part</span>
                <span className={s.treeItem}>{row.subassembly}</span><span className={`${s.treeItem} ${s.treeItemOn}`} style={{ marginLeft: 'var(--gap-3)' }}>{row.name}</span>
                <span className="text-label-caps" style={{ marginTop: 'var(--gap-2)' }}>Closest in production</span>
                {row.candidates.map((c) => (
                  <button key={c.partId} type="button" className={`${s.treeItem} ${c.partId === candId ? s.treeItemOn : ''}`} aria-pressed={c.partId === candId}
                    onClick={() => { const n = new URLSearchParams(params); n.set('cand', c.partId); setParams(n, { replace: true }) }}>
                    <span className="grow trunc">{partById[c.partId]?.name ?? c.partId}</span><span className="data muted">{programShort(c.programId)} · {c.matchPct}%</span></button>))}
              </div>)}
            {leftTab === 'plm' && <div className="col"><span className="text-label-caps">BOM line</span><FieldRenderer record={plmRecord(row)} keys={['program', 'modelYear', 'calcWeight', 'releaseStatus']} /><span className="text-label-caps">Production · {programShort(prodProgram)}</span><FieldRenderer record={{ program: programById[prodProgram]?.name ?? '', modelYear: `MY${programById[prodProgram]?.model_year ?? ''}`, calcWeight: other.weight_kg, releaseStatus: 'Released' }} keys={['program', 'modelYear', 'calcWeight', 'releaseStatus']} /></div>}
            {leftTab === 'measurements' && (
              <table className={s.tbl}><thead><tr><th>Measure</th><th className="num" style={{ textAlign: 'right' }}>BOM</th><th className="num" style={{ textAlign: 'right' }}>Prod.</th></tr></thead><tbody>
                <tr><td>Mass</td><td className="num">{row.part.weight_kg} kg</td><td className="num">{other.weight_kg} kg</td></tr>
                <tr><td>Volume</td><td className="num">{(m.volumeCm3.bomOnly + m.volumeCm3.overlap).toFixed(1)} cm³</td><td className="num">{(m.volumeCm3.productionOnly + m.volumeCm3.overlap).toFixed(1)} cm³</td></tr></tbody></table>)}
          </section>
        </aside>
        <div className={s.cmpMain}>
          <Stub id="matching-engine" note="Compare numbers are deterministic from the pair">
            <div className="row wrap"><span className="text-label-caps">Viewer</span><span className="data muted">{mode === 'comparison' ? `Comparison mode · views ${linked ? 'linked' : 'unlinked'}` : `Aligned · best fit from ${m.constraints.length} constraints`}</span></div>
          </Stub>
          {mode === 'comparison' ? (
            <div className={s.viewers}>
              <ViewerPlaceholder chip={`BOM line · ${row.partNumber}`} height={260} linkedCameras={linked} onLinkedChange={setLinked} />
              <ViewerPlaceholder chip={`Surrogate · ${candId}`} height={260} linkedCameras={linked} onLinkedChange={setLinked} />
            </div>
          ) : (
            <div className="col">
              <ViewerPlaceholder chip={`Aligned · ${row.partNumber} on ${candId}`} height={280}
                legend={[{ label: 'BOM line only', tone: 'query', value: `${m.volumeCm3.bomOnly} cm³` }, { label: 'Overlap', tone: 'overlap', value: `${m.volumeCm3.overlap} cm³` }, { label: 'Surrogate only', tone: 'result', value: `${m.volumeCm3.productionOnly} cm³` }]} />
              <span className="data muted" data-testid="aligned-label">Aligned · best fit from {m.constraints.length} constraints · {m.dofRemaining} degrees of freedom left</span>
              <div className="row wrap">{m.constraints.map((c) => <Badge key={c.label} tone="outline">{c.label} · {c.type}</Badge>)}</div>
            </div>
          )}
          <section className={s.card} style={{ padding: 0 }} aria-label="Requirements driving part selection" data-testid="driving-reqs">
            <div className="row" style={{ padding: 'var(--gap-3) var(--gap-4)' }}>
              <h2 className="text-section grow">Requirements driving part selection</h2><span className="data muted">{reqs.length} requirements · {changed} unmet or changed</span>
              {picked && <Link to={REQ_LINKS.trace(picked.reqId)} data-testid="open-trace"><Button size="sm">Open Traceability · {picked.reqId} <ArrowRight size={14} aria-hidden /></Button></Link>}
            </div>
            {reqs.length === 0 ? <EmptyState title="No requirements are linked to this part." /> : (
              <div className={s.tableWrap} style={{ border: 0, borderTop: '1px solid var(--border-default)', borderRadius: 0 }}>
                <table className={s.tbl}><thead><tr><th>Requirement</th><th>Source</th><th>BOM line</th><th>Production</th><th>Status</th></tr></thead><tbody>
                  {reqs.map((r) => (
                    <tr key={r.reqId} data-pick data-req={r.reqId} aria-selected={picked?.reqId === r.reqId} tabIndex={0} onClick={() => setReqSel(r.reqId)} onKeyDown={(e) => e.key === 'Enter' && setReqSel(r.reqId)}>
                      <td>{r.title}<br /><Link to={REQ_LINKS.trace(r.reqId)} className="data" onClick={(e) => e.stopPropagation()}>{r.reqId}</Link></td>
                      <td><Badge tone={vocab.resolve('sourceType', r.sourceType).tone}>{vocab.resolve('sourceType', r.sourceType).label}</Badge> <span className="muted">{r.citation}</span></td>
                      <td><span className="muted">{r.attribute}</span><br />{r.bomValue}</td><td><span className="muted">{r.attribute}</span><br />{r.productionValue}</td>
                      <td><div className="row wrap"><span className="muted">Text</span><Badge tone={vocab.resolve('textStatus', r.textStatus).tone}>{vocab.resolve('textStatus', r.textStatus).label}</Badge><span className="muted">Driver</span><Badge tone={vocab.resolve('textStatus', r.drivenByStatus).tone}>{vocab.resolve('textStatus', r.drivenByStatus).label}</Badge></div></td>
                    </tr>))}
                </tbody></table>
              </div>)}
          </section>
        </div>
        <SidePanel title="Similarity" badge={<MatchQuality quality={quality} />} defaultWidth={340}>
          <Stub id="matching-engine" note="Pre-baked breakdown">
            <div className="col" style={{ gap: 'var(--gap-4)' }}>
              <div className="col"><span className="text-label-caps">By dimension</span><BreakdownBars breakdown={m.breakdown} /></div>
              <div className="col"><span className="text-label-caps">Volume overlap</span>
                <dl className={s.kv}><dt>BOM only</dt><dd className="data">{m.volumeCm3.bomOnly} cm³</dd><dt>Overlap</dt><dd className="data">{m.volumeCm3.overlap} cm³</dd><dt>Production only</dt><dd className="data">{m.volumeCm3.productionOnly} cm³</dd></dl></div>
              <div className="col"><span className="text-label-caps">Δ bounding box</span>
                <dl className={s.kv}><dt>X</dt><dd className="data">{delta(m.bboxDelta.x)}</dd><dt>Y</dt><dd className="data">{delta(m.bboxDelta.y)}</dd><dt>Z</dt><dd className="data">{delta(m.bboxDelta.z)}</dd></dl></div>
              <dl className={s.kv}>
                <dt>Volume match</dt><dd className="data">{(100 * m.volumeCm3.overlap / (m.volumeCm3.overlap + m.volumeCm3.bomOnly)).toFixed(1)} %</dd>
                <dt>Max deviation</dt><dd className="data">{m.maxDeviationMm} mm</dd><dt>Mass delta</dt><dd className="data">{m.massDeltaG > 0 ? '+' : ''}{m.massDeltaG} g</dd>
                <dt>Material</dt><dd>{m.materialIdentical ? 'identical' : 'differs'}</dd><dt>Aligned by</dt><dd>{m.constraints.length} constraints</dd>
              </dl>
              <div className="col"><span className="text-label-caps">Provenance</span><Badge tone="outline">Surrogate — computed match</Badge>
                <dl className={s.kv}><dt>Closest part</dt><dd className="data">{candId}</dd><dt>Program</dt><dd>{programById[prodProgram]?.name}</dd></dl></div>
              <Button disabled title={PLM_DISABLED_TIP}>Open PLM Record · {candId}</Button>
            </div>
          </Stub>
        </SidePanel>
      </div>
    </div>
  )
}
