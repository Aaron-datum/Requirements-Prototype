import { Check, Circle } from 'lucide-react'
import { useState } from 'react'
import { FieldRenderer } from '../../components/fields/FieldRenderer'
import { Stub } from '../../components/stub/Stub'
import { Badge, Button, EmptyState, Tabs } from '../../components/ui'
import { useVocab } from '../../config/useConfig'
import type { SearchModality } from '../../domain/types'
import { assembliesContaining, duplicatesOf, fileById, flattenTree, lineageOf, measurementTypeByKey, pickableGeometry } from '../../fixtures/derive-search'
import { DUPLICATE_LABEL } from '../../components/quality/MatchQuality'
import type { ResultRowX, SearchFile } from '../../fixtures/extras/search/types'
import { PLM_DISABLED_TIP } from '../../services/stubs/plm'
import { ToleranceBar, fmtDate, fmtDateTime, fmtNum, fmtSize } from './common'
import { modalityById } from './modalities'
import type { SearchState } from './query'
import s from './Search.module.css'

type TabKey = 'info' | 'plm' | 'meas' | 'asms' | 'inasm' | 'siblings' | 'parts' | 'reqs' | 'dupes' | 'revs'

/** Row expansion. Tab set depends on result type (part or assembly) and modality, per docs/01 Results. */
export function ResultDetail({ row, state, onManual }: { row: ResultRowX; state: SearchState; onManual: () => void }) {
  const file = fileById[row.fileId]!
  const dups = duplicatesOf(file)
  const revs = lineageOf(file)
  const isAsm = row.fileKind === 'assembly'
  const m = state.modality
  const tabs: Array<{ key: TabKey; label: string; count?: number }> = isAsm
    ? [{ key: 'plm', label: 'PLM Data' }, { key: 'info', label: 'File Info' }, { key: 'reqs', label: 'Search Requirements' }, { key: 'dupes', label: 'Duplicates', count: dups.length }, { key: 'revs', label: 'Related Revisions', count: Math.max(0, revs.length - 1) }]
    : [{ key: 'info', label: 'File Info' }, { key: 'plm', label: 'PLM Data' }, { key: 'meas', label: 'Measurements' }]
  if (isAsm && row.childMatches) tabs.splice(2, 0, { key: 'parts', label: 'Contained Parts', count: row.childMatches.length })
  if (!isAsm && m === 'part-to-part' && row.usedIn?.length) tabs.push({ key: 'asms', label: 'Assemblies', count: row.usedIn.length })
  if (!isAsm && m === 'part-in-assembly-to-part') tabs.push({ key: 'inasm', label: 'In Assembly' }, { key: 'siblings', label: 'Sibling Parts' })
  if (!isAsm && dups.length) tabs.push({ key: 'dupes', label: 'Duplicates', count: dups.length })
  const [tab, setTab] = useState<TabKey>(tabs[0]!.key)
  const cur = tabs.some((t) => t.key === tab) ? tab : tabs[0]!.key
  const parent = row.parentAssemblyId ? fileById[row.parentAssemblyId] : undefined

  return (
    <div className={s.expanded} data-testid="result-detail">
      <Tabs value={cur} tabs={tabs} onChange={setTab} label={`Details for ${row.name}`} />
      {cur === 'info' && (<>
        {row.quality.duplicate && <Badge tone="info">{DUPLICATE_LABEL[row.quality.duplicate]}</Badge>}
        {row.quality.duplicate && <span className="secondary">{row.quality.duplicate === 'geometric-duplicate' ? 'A different file with 100% the same geometry as the source.' : 'The same file stored in another vault.'}</span>}
        <FileInfo file={file} />
      </>)}
      {cur === 'plm' && (<>
        <FieldRenderer record={file.plm} layout="grid" emptyText="No PLM record for this file." />
        <Stub id="plm-connectors" note="Never live in the prototype"><Button size="sm" disabled title={PLM_DISABLED_TIP}>Open in PLM</Button></Stub>
      </>)}
      {cur === 'meas' && <MeasurementsTable row={row} state={state} onManual={onManual} />}
      {cur === 'reqs' && (
        <div className="col">
          <span className="secondary">Your search requirements were applied to this row.</span>
          <dl className={s.dl}><dt>Search type</dt><dd>{modalityById(m).name}</dd><dt>Source</dt><dd>{state.file ? fileById[state.file]?.name : '—'}</dd><dt>Measurements</dt><dd>{state.measurements.length}</dd></dl>
          {state.measurements.length > 0 && <MeasurementsTable row={row} state={state} onManual={onManual} />}
        </div>
      )}
      {cur === 'parts' && row.childMatches && <PartsTab row={row} modality={m} />}
      {cur === 'asms' && row.usedIn && (
        <table className={s.mini}><thead><tr><th>Assembly file</th><th>Program</th><th>Part name in BOM</th><th className={s.num}>Instances</th><th>Last edited</th></tr></thead>
          <tbody>{row.usedIn.map((u) => <tr key={u.asmId}><td className="data">{u.asmFile}</td><td>{u.asmProgram}</td><td className="data">{u.partInstance}</td><td className={s.num}>×{u.instances}</td><td className="data">{fmtDate(u.edited)}</td></tr>)}</tbody></table>
      )}
      {cur === 'inasm' && (
        <dl className={s.dl}><dt>Parent assembly</dt><dd>{parent?.name ?? '—'}</dd>
          <dt>Placed as</dt><dd>{parent ? flattenTree(parent.tree).find((n) => n.node.fileId === file.id)?.path.join(' / ') ?? '—' : '—'}</dd>
          <dt>Other assemblies using it</dt><dd>{assembliesContaining(file.id).length}</dd></dl>
      )}
      {cur === 'siblings' && (
        <div className={s.chips}>{parent ? flattenTree(parent.tree).filter((n) => !n.node.children && n.node.fileId !== file.id).map((n) => <Badge key={n.node.id} tone={n.node.reference ? 'outline' : 'neutral'}>{n.node.name}</Badge>) : <span className="muted">No parent assembly.</span>}</div>
      )}
      {cur === 'dupes' && (
        dups.length === 0 ? <EmptyState title="No duplicates">No other file shares this geometry.</EmptyState> : (
          <table className={s.mini}><thead><tr><th>File</th><th>Source</th><th>Created</th><th>Classification</th></tr></thead>
            <tbody>{[file, ...dups].map((d, i) => <tr key={d.id}><td className="data">{d.name}</td><td>{d.source}</td><td className="data">{fmtDate(d.created)}</td>
              <td>{i === 0 ? <Badge tone="pass">Primary</Badge> : <Badge tone="info">{d.name === file.name ? DUPLICATE_LABEL['duplicate-file'] : DUPLICATE_LABEL['geometric-duplicate']}</Badge>}</td></tr>)}</tbody></table>
        )
      )}
      {cur === 'revs' && (
        <table className={s.mini}><thead><tr><th>File</th><th>Relationship</th><th>Revision</th><th>Last edited</th></tr></thead>
          <tbody>{revs.map((r, i) => { const at = revs.indexOf(file); return (
            <tr key={r.id}><td className="data">{r.name}</td>
              <td><Badge tone={r.id === file.id ? 'pass' : 'neutral'}>{r.id === file.id ? 'Current' : i === at - 1 ? 'Previous' : i < at ? 'Older revision' : i === revs.length - 1 ? 'Latest' : 'Newer revision'}</Badge></td>
              <td className="data">{r.revision}</td><td className="data">{fmtDate(r.updated)}</td></tr>) })}</tbody></table>
      )}
    </div>
  )
}

function FileInfo({ file }: { file: SearchFile }) {
  return (
    <dl className={s.dl} style={{ maxWidth: 520 }}>
      <dt>File name</dt><dd>{file.name}</dd><dt>File size</dt><dd>{fmtSize(file.sizeBytes)}</dd><dt>Format</dt><dd>{file.format}</dd>
      <dt>Source</dt><dd>{file.source}</dd><dt>Revision</dt><dd>{file.revision}</dd><dt>Created</dt><dd>{fmtDateTime(file.created)}</dd><dt>Last modified</dt><dd>{fmtDateTime(file.updated)}</dd>
    </dl>
  )
}

function PartsTab({ row, modality }: { row: ResultRowX; modality: SearchModality }) {
  const vocab = useVocab()
  const kids = row.childMatches!
  const isLow = (pct: number) => vocab.band(pct).tone === vocab.band(0).tone
  const matched = kids.filter((c) => !isLow(c.pct)).length
  return (
    <div className="col">
      <span className="secondary" data-testid="parts-caption">{modality === 'part-to-assembly' ? <>{kids.length} parts inside this assembly. <b>{matched}</b> match your part.</> : <>Part-by-part match against your assembly: <b>{matched}/{kids.length}</b> parts matched.</>}</span>
      <table className={s.mini}><thead><tr><th>Part</th><th>Category</th><th className={s.num}>Match</th><th>Band</th></tr></thead>
        <tbody>{kids.map((c) => { const b = vocab.band(c.pct); return (
          <tr key={c.nodeId}><td className="data">{c.name}</td><td>{c.category}</td><td className={s.num}>{c.pct}%</td><td><Badge tone={b.tone} icon={isLow(c.pct) ? <Circle size={12} aria-hidden /> : <Check size={12} aria-hidden />}>{b.label}</Badge></td></tr>) })}</tbody></table>
    </div>
  )
}

export function MeasurementsTable({ row, state, onManual }: { row: ResultRowX; state: SearchState; onManual: () => void }) {
  if (!state.measurements.length) return <EmptyState title="No measurements captured">Add up to five measurements in Define. Each one becomes a column here.</EmptyState>
  return (
    <table className={s.mini} data-testid="measurements-table">
      <thead><tr><th>Measurement</th><th className={s.num}>Source</th><th className={s.num}>Candidate</th><th className={s.num}>Deviation</th></tr></thead>
      <tbody>{state.measurements.map((m) => {
        const t = measurementTypeByKey[m.typeKey]; const c = row.measurements[m.id]
        const geo = pickableGeometry(state.file).find((g) => g.ref === m.geometryRef)?.label
        return (
          <tr key={m.id}>
            <td>{t?.label ?? m.typeKey}{geo && <span className="muted"> · {geo}</span>}</td>
            <td className={s.num}>{fmtNum(m.value)} {t?.unit}</td>
            <td className={s.num}>{!c ? '—' : c.candidate === 'manual-required' ? <span className={s.manual}>Manual measurement required <Button size="sm" onClick={onManual}>Measure in Compare</Button></span> : <>{fmtNum(c.candidate)} {t?.unit}</>}</td>
            <td className={s.num}>{!c || c.deviationPct == null ? '–' : <ToleranceBar deviationPct={c.deviationPct} tolerancePct={t?.tolerancePct ?? 5} />}</td>
          </tr>)
      })}</tbody>
    </table>
  )
}
