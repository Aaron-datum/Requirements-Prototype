import { AlertTriangle, ArrowLeft, Check, ExternalLink, Search as SearchIcon, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FieldValueView } from '../../components/fields/FieldRenderer'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { Stub } from '../../components/stub/Stub'
import { Badge, Button, EmptyState, IconButton, Seg, Tabs } from '../../components/ui'
import { ViewerPlaceholder } from '../../components/viewer/Viewer'
import { useConfig } from '../../config/useConfig'
import type { CompareService } from '../../domain/types'
import { assembliesContaining, fileById, measurementTypeByKey, pairVolumeMm3 } from '../../fixtures/derive-search'
import { measureCandidate, seedKey } from '../../fixtures/extras/search/results'
import type { ResultRowX, SearchFile } from '../../fixtures/extras/search/types'
import { applyDecisionAction, searchOnHref, useWorkflowCtx } from '../../lib/workflowContext'
import { useService } from '../../services/context'
import { CONSTRAINT_LABEL, remainingDof } from '../../services/stubs/compare'
import { PLM_DISABLED_TIP } from '../../services/stubs/plm'
import { toastSuccess } from '../../stores/toastStore'
import { TreeView, fmtNum } from './common'
import { defineHref, filesHref, readState, resultsHref, toQuery } from './query'
import s from './Search.module.css'

type ConstraintType = ReturnType<CompareService['inferConstraint']>
interface Constraint { id: number; type: ConstraintType; a: string; b: string }
type View = 'comparison' | 'alignment' | 'overlay'
const TYPES: ConstraintType[] = ['coplanar', 'coaxial', 'parallel-planes', 'concentric']

function treeFor(file: SearchFile | undefined) {
  if (!file) return { roots: [], highlight: undefined as string | undefined, label: '' }
  if (file.tree) return { roots: file.tree, highlight: undefined, label: file.name }
  const parent = assembliesContaining(file.id)[0]?.assembly
  return parent?.tree ? { roots: parent.tree, highlight: file.id, label: parent.name } : { roots: [{ id: 'root', name: file.name.replace(/\.[^.]+$/, ''), fileId: file.id }], highlight: file.id, label: file.name }
}

export function Compare() {
  const config = useConfig()
  const nav = useNavigate()
  const ctx = useWorkflowCtx()
  const engine = useService('engine')
  const viewer = useService('viewer')
  const compare = useService('compare')
  const audit = useService('audit')
  const [params] = useSearchParams()
  const st = readState(params)
  const q = fileById[params.get('query') ?? st.file]
  const r = fileById[params.get('result') ?? '']
  const [tab, setTab] = useState<'assembly' | 'plm' | 'measurements'>('assembly')
  const [view, setView] = useState<View>('comparison')
  const [linked, setLinked] = useState(true)
  const [qFace, setQFace] = useState('')
  const [rFace, setRFace] = useState('')
  const [override, setOverride] = useState<ConstraintType | null>(null)
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [row, setRow] = useState<ResultRowX | null>(null)

  useEffect(() => { if (q && r) void engine.runSearch(toQuery(st)).then((rows) => setRow((rows as ResultRowX[]).find((x) => x.fileId === r.id) ?? null)) }, [q?.id, r?.id, params.toString()]) // eslint-disable-line react-hooks/exhaustive-deps

  const base = { ...st, file: st.file || q?.id || '' }
  useBreadcrumbs([{ label: 'Search', to: '/search/new' }, { label: 'Files', to: filesHref(st.modality, ctx) }, { label: 'Define', to: defineHref(base, ctx) }, { label: 'Results', to: resultsHref(base, ctx) }, { label: 'Compare' }])

  const faces = (f: SearchFile | undefined) => (f ? viewer.listPickableGeometry(f.id).filter((g) => g.kind === 'face') : [])
  const qf = faces(q).find((g) => g.ref === qFace), rf = faces(r).find((g) => g.ref === rFace)
  const inferred = qf && rf ? compare.inferConstraint(qf.label, rf.label) : null
  const chosen = override ?? inferred
  const dof = remainingDof(constraints.map((c) => c.type))
  const overlap = useMemo(() => (q && r ? compare.computeOverlap(q.id, r.id, constraints.length) : null), [compare, q, r, constraints.length])

  if (!q || !r) return <div className={s.page}><EmptyState title="Nothing to compare" action={<Button onClick={() => nav(filesHref(undefined, ctx))}>Browse files</Button>}>Open Compare from a Results row.</EmptyState></div>

  const add = () => {
    if (!qf || !rf || !chosen) return
    setConstraints([...constraints, { id: Math.max(0, ...constraints.map((c) => c.id)) + 1, type: chosen, a: qf.label, b: rf.label }])
    setQFace(''); setRFace(''); setOverride(null)
  }
  const volTotal = pairVolumeMm3(q.id, r.id)
  const vol = (pct: number) => fmtNum(Math.round((volTotal * pct) / 100))
  const qt = treeFor(q), rt = treeFor(r)
  const cand = (m: (typeof st.measurements)[number]) => row?.measurements[m.id] ?? measureCandidate(seedKey(toQuery(st)), r.id, m, false)

  const left = (
    <aside className={s.left} aria-label="Compare panel">
      <Tabs value={tab} onChange={setTab} label="Compare tabs" tabs={[{ key: 'assembly', label: 'Assembly' }, { key: 'plm', label: 'PLM' }, { key: 'measurements', label: 'Measurements', count: st.measurements.length }]} />
      <div className={s.leftBody}>
        {tab === 'assembly' && (<>
          <span className="text-label-caps">Search part</span><TreeView roots={qt.roots} highlightFileId={qt.highlight ?? undefined} />
          <span className="text-label-caps">Result part</span><TreeView roots={rt.roots} highlightFileId={rt.highlight ?? undefined} />
        </>)}
        {tab === 'plm' && (
          <table className={s.plm} data-testid="compare-plm"><thead><tr><th>Field</th><th>Search</th><th>Result</th></tr></thead>
            <tbody>{config.schema.fields.map((f) => {
              const a = q.plm[f.key], b = r.plm[f.key]
              const match = a != null && a !== '' && a === b
              return (<tr key={f.key}><td className="muted">{f.label}</td>
                <td data-match={match}><FieldValueView def={f} value={a} /></td>
                <td data-match={match}><FieldValueView def={f} value={b} />{match && <span className={s.match} title="Matches the search part"> <Check size={12} aria-label="Match" /></span>}</td></tr>)
            })}</tbody></table>
        )}
        {tab === 'measurements' && (st.measurements.length === 0 ? <EmptyState title="No measurements captured">Add measurements in Define.</EmptyState> : (
          <Stub id="matching-engine" note="Candidate values derived deterministically">
            <div className="col">{st.measurements.map((m) => { const t = measurementTypeByKey[m.typeKey]; const c = cand(m); return (
              <div key={m.id} className={s.mcard}><b>{t?.label ?? m.typeKey}</b>
                <div className="row"><Badge tone="info">Search</Badge><span className="data">{fmtNum(m.value)} {t?.unit}</span></div>
                <div className="row"><Badge tone="outline">Result</Badge>{c.candidate === 'manual-required' ? <span className={s.manual}>Manual measurement required</span> : <span className="data">{fmtNum(c.candidate)} {t?.unit}{c.deviationPct != null ? ` (${c.deviationPct > 0 ? '+' : ''}${c.deviationPct}%)` : ''}</span>}</div>
              </div>) })}</div>
          </Stub>
        ))}
      </div>
    </aside>
  )

  const chip = (who: 'Query' | 'Result', f: SearchFile) => `${who} · ${f.name}`
  return (
    <div className={s.work}>
      {left}
      <section className={s.stage}>
        <div className={s.stageHead}>
          {view === 'overlay'
            ? <><Badge tone="info">Overlay</Badge><Button size="sm" onClick={() => setView('alignment')}><ArrowLeft size={14} aria-hidden />Back to Alignment</Button></>
            : <Seg value={view} onChange={setView} label="Compare view" options={[['comparison', 'Comparison'], ['alignment', 'Alignment']]} />}
          <span className="data grow trunc">{q.name} vs {r.name}</span>
          <Stub id="plm-connectors" note="Never live in the prototype"><Button size="sm" disabled title={PLM_DISABLED_TIP}><ExternalLink size={14} aria-hidden />Open in PLM</Button></Stub>
          <Link to={searchOnHref(r.id, ctx, st.modality)} target="_blank" rel="noreferrer" className="row"><SearchIcon size={14} aria-hidden />Search on</Link>
          {ctx?.def.actions.map((a) => (
            <Stub key={a.id} id="audit-trail" note="Decision is recorded in the ledger"><Button size="sm" primary onClick={() => { const to = applyDecisionAction(ctx, a, r.name, { audit, config }); toastSuccess(`${a.label}: ${r.name}`); nav(to) }}>{a.label}</Button></Stub>
          ))}
        </div>
        <div className={s.stageBody}>
          {view !== 'overlay' && (
            <>
              <div className={s.vp}><ViewerPlaceholder chip={chip('Query', q)} image={q.thumbnail} height="100%" linkedCameras={linked} onLinkedChange={setLinked} /></div>
              <div className={s.vp}><ViewerPlaceholder chip={chip('Result', r)} image={r.thumbnail} height="100%" linkedCameras={linked} onLinkedChange={setLinked} /></div>
            </>
          )}
          {view === 'overlay' && overlap && (
            <div className={s.vp}><ViewerPlaceholder chip={`${q.name} vs ${r.name}`} image={q.thumbnail} height="100%"
              legend={[{ label: 'Query only', tone: 'query', value: `${overlap.queryOnly}%` }, { label: 'Overlap', tone: 'overlap', value: `${overlap.overlap}%` }, { label: 'Result only', tone: 'result', value: `${overlap.resultOnly}%` }]} /></div>
          )}
          {view === 'alignment' && (
            <aside className={s.rightPanel} aria-label="Alignment and overlay">
              <div className={s.rbody}>
                <b>Constraints</b>
                <div className={s.picker}>
                  <label className={s.lab}><span>Query face</span><select className={s.select} value={qFace} aria-label="Query face" onChange={(e) => { setQFace(e.target.value); setOverride(null) }}><option value="">Select face</option>{faces(q).map((g) => <option key={g.ref} value={g.ref}>{g.label}</option>)}</select></label>
                  <label className={s.lab}><span>Result face</span><select className={s.select} value={rFace} aria-label="Result face" onChange={(e) => { setRFace(e.target.value); setOverride(null) }}><option value="">Select face</option>{faces(r).map((g) => <option key={g.ref} value={g.ref}>{g.label}</option>)}</select></label>
                  <label className={s.lab}><span>Type{inferred ? ` · suggested ${CONSTRAINT_LABEL[inferred]}` : ''}</span>
                    <select className={s.select} value={chosen ?? 'coplanar'} aria-label="Constraint type" onChange={(e) => setOverride(e.target.value as ConstraintType)}>{TYPES.map((t) => <option key={t} value={t}>{CONSTRAINT_LABEL[t]}</option>)}</select></label>
                  <Button disabled={!chosen} onClick={add}>Add constraint</Button>
                </div>
                {constraints.length === 0 && <span className="muted">No constraints yet.</span>}
                {constraints.map((c) => (
                  <div key={c.id} className={s.constraint} data-testid="constraint"><span className="grow"><b>{CONSTRAINT_LABEL[c.type]}</b><br /><span className="muted">{c.a} ↔ {c.b}</span></span>
                    <IconButton label={`Remove ${CONSTRAINT_LABEL[c.type]} constraint`} onClick={() => setConstraints(constraints.filter((x) => x.id !== c.id))}><Trash2 size={14} /></IconButton></div>
                ))}
              </div>
              <div className={s.rfoot}>
                <span className={s.dof} data-testid="dof">{dof} degree{dof === 1 ? '' : 's'} of freedom remaining</span>
                {dof > 0 && <span className={s.warnBox} role="status"><AlertTriangle size={14} aria-hidden />Under-constrained. Overlap may be inaccurate.</span>}
                <Stub id="cad-viewer" note="Alignment solver is a placeholder"><Button primary onClick={() => setView('overlay')}>Align and compute overlap</Button></Stub>
              </div>
            </aside>
          )}
          {view === 'overlay' && overlap && (
            <aside className={s.rightPanel} aria-label="Overlay statistics" data-testid="overlay-stats">
              <div className={s.rbody}>
                <Stub id="matching-engine" note="Volumes and deviation are placeholders">
                  <div className="col">
                    <span className="text-label-caps">Volume</span>
                    <div className={s.stat}><i className={`${s.swatch} ${s.sO}`} /><span className="grow">Overlap volume</span><span className="data">{vol(overlap.overlap)} mm³ · {overlap.overlap}%</span></div>
                    <div className={s.stat}><i className={`${s.swatch} ${s.sQ}`} /><span className="grow">Query part only</span><span className="data">{vol(overlap.queryOnly)} mm³ · {overlap.queryOnly}%</span></div>
                    <div className={s.stat}><i className={`${s.swatch} ${s.sR}`} /><span className="grow">Result part only</span><span className="data">{vol(overlap.resultOnly)} mm³ · {overlap.resultOnly}%</span></div>
                    <span className="text-label-caps">Δ Bounding box</span>
                    {(['x', 'y', 'z'] as const).map((k) => { const v = overlap.bboxDelta[k]; const w = Math.min(50, (Math.abs(v) / 3.4) * 50); return (
                      <div key={k} className={s.axisRow}><span className="data muted">{k.toUpperCase()}</span><span className={s.axisTrack}><i style={v < 0 ? { right: '50%', width: `${w}%` } : { left: '50%', width: `${w}%` }} /></span><span className="data">{v > 0 ? '+' : ''}{v.toFixed(1)} mm</span></div>) })}
                    <span className="text-label-caps">Summary</span>
                    <div className={s.stat}><span className="grow">Volume match</span><span className="data" data-testid="volume-match">{overlap.volumeMatchPct}%</span></div>
                    <div className={s.stat}><span className="grow">Max deviation</span><span className="data">{overlap.maxDeviationMm} mm</span></div>
                    <div className={s.stat}><span className="grow">Aligned by</span><span className="data" data-testid="aligned-by">{constraints.length} constraint{constraints.length === 1 ? '' : 's'}</span></div>
                    {dof > 0 && <span className={s.warnBox}><AlertTriangle size={14} aria-hidden />{dof} degree{dof === 1 ? '' : 's'} of freedom remained unconstrained.</span>}
                  </div>
                </Stub>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  )
}
