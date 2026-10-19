import { Play, Plus, Trash2, ChevronsDownUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FieldRenderer } from '../../components/fields/FieldRenderer'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { Stub } from '../../components/stub/Stub'
import { ViewerPlaceholder } from '../../components/viewer/Viewer'
import { Badge, Button, EmptyState, IconButton, SearchBox, Tabs } from '../../components/ui'
import { useConfig } from '../../config/useConfig'
import type { CapturedMeasurement, SearchModality, TreeNode } from '../../domain/types'
import { activeNode, fileById, flattenTree, measurementTypeByKey, measurementTypes } from '../../fixtures/derive-search'
import type { SearchFile } from '../../fixtures/extras/search/types'
import { useWorkflowCtx } from '../../lib/workflowContext'
import { useService } from '../../services/context'
import { TreeView, fmtNum } from './common'
import { filesHref, defineHref, readState, resultsHref } from './query'
import { modalityById } from './modalities'
import s from './Search.module.css'

/** Modality implied by the node chosen in the tree (Flow B): a leaf part gives part in assembly, a group or the root gives assembly to assembly. */
function impliedModality(file: SearchFile, node: TreeNode | undefined, explicit: SearchModality, locked: boolean): SearchModality {
  if (locked || file.kind === 'part') return explicit
  return node && !node.children ? 'part-in-assembly-to-part' : 'assembly-to-assembly'
}

export function Define() {
  const config = useConfig()
  const nav = useNavigate()
  const ctx = useWorkflowCtx()
  const engine = useService('engine')
  const viewer = useService('viewer')
  const [params, setParams] = useSearchParams()
  const st = readState(params)
  const file = fileById[st.file]
  const locked = st.src === 'new'
  const [tab, setTab] = useState<'assembly' | 'plm' | 'measurements'>('assembly')
  const [filter, setFilter] = useState('')
  const [adding, setAdding] = useState(false)
  const [geoRef, setGeoRef] = useState('')
  const [typeKey, setTypeKey] = useState('')

  const roots: TreeNode[] = useMemo(() => (file ? (file.tree ?? [{ id: 'root', name: file.name.replace(/\.[^.]+$/, ''), fileId: file.id }]) : []), [file])
  const defaultNode = useMemo(() => {
    if (!file?.tree) return roots[0]
    const wantsPart = locked && st.modality === 'part-in-assembly-to-part'
    return wantsPart ? flattenTree(file.tree).find((n) => !n.node.children && !n.node.reference && n.node.fileId)?.node : roots[0]
  }, [file, roots, locked, st.modality])
  const active = file ? (file.tree ? activeNode(file, st.part)?.node : roots[0]) : undefined
  const node = st.part ? active : defaultNode
  const modality = file ? impliedModality(file, node, st.modality, locked) : st.modality
  const mod = modalityById(modality)

  const activeFile = node?.fileId ? fileById[node.fileId] : file
  const geoKey = node && file ? (node.fileId ?? `${file.id}#${node.id}`) : file?.id ?? ''
  const geometry = file ? viewer.listPickableGeometry(geoKey) : []
  const picked = geometry.find((g) => g.ref === geoRef)
  const types = measurementTypes.filter((t) => !picked || t.applicableTo.includes(picked.kind))
  const max = config.limits.maxMeasurements

  const write = (patch: Partial<{ part: string; measurements: CapturedMeasurement[] }>) => {
    const next = { ...st, modality, ...patch }
    setParams(new URLSearchParams(defineHref(next, ctx).split('?')[1]), { replace: true })
  }
  useEffect(() => { setGeoRef(''); setTypeKey('') }, [geoKey])

  useBreadcrumbs([{ label: 'Search', to: '/search/new' }, { label: 'Files', to: filesHref(modality, ctx) }, { label: 'Define' }])

  if (!file) return <div className={s.page}><EmptyState title="No file selected" action={<Button onClick={() => nav(filesHref(undefined, ctx))}>Browse files</Button>}>Pick a file from Files, or start from New Search.</EmptyState></div>

  const capture = async () => {
    if (!picked || !typeKey) return
    const v = await engine.deriveMeasurement(geoKey, typeKey, picked.ref)
    if (v === 'manual-required') return
    write({ measurements: [...st.measurements, { id: `m${st.measurements.length + 1}`, typeKey, geometryRef: picked.ref, value: v }] })
    setAdding(false); setGeoRef(''); setTypeKey('')
  }
  const geoLabel = (ref: string) => geometry.find((g) => g.ref === ref)?.label ?? ref
  const run = () => nav(resultsHref({ ...st, modality, part: file.tree ? node?.id : undefined }, ctx))
  const unit = (k: string) => measurementTypeByKey[k]?.unit ?? ''
  const label = (k: string) => measurementTypeByKey[k]?.label ?? k
  const latest = st.measurements[st.measurements.length - 1]

  return (
    <div className={s.work}>
      <aside className={s.left} aria-label="Define panel">
        <div className={s.leftHead}>
          <span className="text-label-caps muted">Active part</span>
          <span className="text-section trunc" data-testid="active-part">{node?.name ?? file.name}</span>
          {params.get('rep') && <span className="muted" data-testid="represents">Representing {params.get('rep')} (simulated CAD match)</span>}
          <div className="row"><Badge tone="info">{mod.short}</Badge>{locked && <span className="muted">fixed by the card you chose</span>}</div>
        </div>
        <Tabs value={tab} onChange={setTab} label="Define tabs" tabs={[{ key: 'assembly', label: 'Assembly' }, { key: 'plm', label: 'PLM' }, { key: 'measurements', label: 'Measurements', count: st.measurements.length }]} />
        <div className={s.leftBody}>
          {tab === 'assembly' && (<>
            <div className="row"><div className="grow"><SearchBox value={filter} onChange={setFilter} placeholder="Filter parts…" /></div>
              <IconButton label="Select the root as active part" onClick={() => write({ part: roots[0]?.id })}><ChevronsDownUp size={14} /></IconButton></div>
            <Stub id="cad-parser" note="Fixed assembly tree from fixtures">
              <TreeView roots={roots} filter={filter} selectedId={node?.id} onSelect={(n) => write({ part: n.id })} />
            </Stub>
            <span className="muted">Reference parts can't be selected.</span>
          </>)}
          {tab === 'plm' && (
            <>
              <span className="muted">Read-only · {activeFile?.source ?? file.source}</span>
              <FieldRenderer record={activeFile?.plm} emptyText="No PLM record for this file." />
            </>
          )}
          {tab === 'measurements' && (<>
            <div className="row"><span className="text-label-caps grow" data-testid="meas-count">{st.measurements.length}/{max} Measurements</span>
              <Button size="sm" disabled={!st.measurements.length} onClick={() => write({ measurements: [] })}>Clear all</Button>
              <IconButton label={st.measurements.length >= max ? `Maximum of ${max} measurements` : 'New measurement'} ghost={false} disabled={st.measurements.length >= max} onClick={() => setAdding(true)}><Plus size={14} /></IconButton></div>
            {adding && (
              <div className={s.mcard} data-testid="new-measurement">
                <div className="row"><b className="grow">New measurement</b><span className="muted">{picked ? '1 selected' : '0 selected'}</span></div>
                <span className="text-label-caps">Geometry (simulated picker)</span>
                <Stub id="cad-viewer" note="Pick from a list of named geometry">
                  <div className={s.georow} role="listbox" aria-label="Pickable geometry">
                    {geometry.map((g) => <button key={g.ref} type="button" role="option" aria-selected={g.ref === geoRef} aria-pressed={g.ref === geoRef} onClick={() => { setGeoRef(g.ref); setTypeKey('') }}><Badge tone="outline">{g.kind}</Badge>{g.label}</button>)}
                    {!geometry.length && <span className="muted" style={{ padding: 'var(--gap-3)' }}>No geometry to pick for this node.</span>}
                  </div>
                </Stub>
                <label className="lab"><span className="text-label-caps">Measurement type</span>
                  <select className={s.select} value={typeKey} disabled={!picked} aria-label="Measurement type" onChange={(e) => setTypeKey(e.target.value)}>
                    <option value="">{picked ? 'Select a type' : 'Select geometry first'}</option>
                    {types.map((t) => <option key={t.key} value={t.key}>{t.label} ({t.unit})</option>)}
                  </select></label>
                <div className="row"><Button onClick={() => setAdding(false)}>Cancel</Button>
                  <Stub id="matching-engine" note="Value derived deterministically"><Button primary disabled={!picked || !typeKey} onClick={() => void capture()}>Add measurement</Button></Stub></div>
              </div>
            )}
            {st.measurements.map((m) => (
              <div key={m.id} className={s.mcard} data-active={m === latest} data-testid="measurement">
                <div className="row"><b className="grow">{label(m.typeKey)}</b>
                  <IconButton label={`Delete ${label(m.typeKey)} measurement`} onClick={() => write({ measurements: st.measurements.filter((x) => x.id !== m.id) })}><Trash2 size={14} /></IconButton></div>
                <div className={s.chips}><Badge tone="outline">{m.typeKey}</Badge><Badge tone="outline">{geoLabel(m.geometryRef)}</Badge></div>
                <div className="row"><span className="text-label-caps muted">Measured</span><span className={s.mval}>{fmtNum(m.value)} <span className="muted">{unit(m.typeKey)}</span></span></div>
              </div>
            ))}
            {!st.measurements.length && !adding && <span className="muted">Select geometry in the viewer, then add up to {max} measurements.</span>}
          </>)}
        </div>
      </aside>
      <section className={s.stage}>
        <div className={s.stageHead}>
          <span className="data grow trunc">{file.name}</span>
          <Button primary onClick={run}><Play size={14} aria-hidden />Run Search</Button>
        </div>
        <div className={s.stageBody}>
          <div className={s.vp}>
            <ViewerPlaceholder chip={file.name} height="100%">
              <span className={s.hint}>Selection mode: FACE / EDGE · Hold Shift for body</span>
              {picked && <span className={s.readout}>Selected: {picked.label}</span>}
              {!picked && latest && <span className={s.readout}>{fmtNum(latest.value)} {unit(latest.typeKey)}</span>}
            </ViewerPlaceholder>
          </div>
        </div>
      </section>
    </div>
  )
}
