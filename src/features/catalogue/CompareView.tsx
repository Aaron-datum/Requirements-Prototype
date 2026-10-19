import { Equal, Triangle, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { Stub } from '../../components/stub/Stub'
import { Badge, EmptyState, Modal, SearchBox, Seg } from '../../components/ui'
import { ViewerPlaceholder } from '../../components/viewer/Viewer'
import { CATALOGUE_ADMINISTRATIVE_FIELDS, CATALOGUE_SETTINGS, compareFieldByKey } from '../../config/catalogueConfig'
import type { CatalogueRowX } from '../../domain/catalogue'
import { CellView } from './CellView'
import { buildCompareRows, diffSummary, visibleRows, type CompareRow } from './compareLogic'
import { DecisionButtons, OpenInPlm, SearchOnLink } from './PartActions'
import { catalogueUrl, nodeUrl, readList, writeList } from './urlState'
import { useCatalogue } from './useCatalogue'
import s from './catalogue.module.css'

const TAGS = 'ABCDEFGH'

/** "=" (match) or "Δ" (differs): text plus icon, never colour alone. */
function Marker({ match }: { match: boolean }) {
  return match
    ? <span className={`${s.mark} ${s.markMatch}`} data-state="match"><Equal size={14} aria-hidden />Match</span>
    : <span className={`${s.mark} ${s.markDiff}`} data-state="differs"><Triangle size={12} aria-hidden />Differs</span>
}

function PartHead({ part, tag, onRemove }: { part: CatalogueRowX; tag: string; onRemove?: () => void }) {
  return (
    <div className={s.partHead}>
      <div className={s.partTitle}>
        <span className={s.tag}>{tag}</span>
        <div className="grow"><div className="data" style={{ fontWeight: 500 }}>{part.partNumber}</div><div className="muted">{String(part.fields.source ?? '')}</div></div>
        {onRemove && <button type="button" aria-label={`Remove ${part.partNumber} from compare`} onClick={onRemove} style={{ background: 'transparent', border: 0, color: 'var(--fg-muted)' }}><X size={14} /></button>}
      </div>
      <div className={s.partBtns}><DecisionButtons partNumber={part.partNumber} /><SearchOnLink partNumber={part.partNumber} /><OpenInPlm partNumber={part.partNumber} /></div>
    </div>
  )
}

function AttributeTable({ parts, rows, onAdd, onRemove }: { parts: CatalogueRowX[]; rows: CompareRow[]; onAdd: () => void; onRemove: (pn: string) => void }) {
  const normal = rows.filter((r) => !r.administrative)
  const admin = rows.filter((r) => r.administrative)
  const renderRow = (r: CompareRow) => (
    <tr key={r.key} data-field={r.key} data-state={r.match ? 'match' : 'differs'} data-admin={r.administrative || undefined} className={`${r.match && !r.administrative ? s.rowMatch : ''} ${r.administrative ? s.rowAdmin : ''}`}>
      <td className={s.fieldCol}>{r.def.label}</td>
      {r.values.map((v, i) => <td key={parts[i]!.partNumber}><CellView def={r.def} value={v} /></td>)}
      <td className={s.addCol}><Marker match={r.match} /></td>
    </tr>
  )
  return (
    <div className={s.tableWrap}>
      <table className={s.ctable} data-testid="compare-table">
        <thead>
          <tr>
            <th className={s.fieldCol}><span className={s.cap}>Field</span></th>
            {parts.map((p, i) => <th key={p.partNumber} className={s.partCol} data-testid={`part-col-${p.partNumber}`}><PartHead part={p} tag={TAGS[i] ?? String(i + 1)} onRemove={i >= 2 ? () => onRemove(p.partNumber) : undefined} /></th>)}
            <th className={s.addCol}><button type="button" className={s.addBtn} onClick={onAdd}>+ Add part</button></th>
          </tr>
        </thead>
        <tbody>
          {normal.map(renderRow)}
          {admin.length > 0 && <tr className={s.adminHead}><td colSpan={parts.length + 2}>Administrative fields (not counted as differences)</td></tr>}
          {admin.map(renderRow)}
        </tbody>
      </table>
    </div>
  )
}

function DualPane({ a, b, rows }: { a: CatalogueRowX; b: CatalogueRowX; rows: CompareRow[] }) {
  const pane = (p: CatalogueRowX, idx: 0 | 1) => (
    <section className={s.pane} aria-label={`Part ${TAGS[idx]}`} data-testid={`pane-${TAGS[idx]}`}>
      <div className={s.paneHead}><span className={s.tag}>{TAGS[idx]}</span><span className="data" style={{ fontWeight: 500 }}>{p.partNumber}</span><span className="muted right">{String(p.fields.source ?? '')}</span></div>
      <div className={s.paneView}>
        <ViewerPlaceholder chip={`${TAGS[idx]} · ${p.partNumber}`} height={320}
          legend={[{ label: idx === 0 ? 'A · red overlay' : 'B · blue overlay', tone: idx === 0 ? 'query' : 'overlap' }]} />
      </div>
      {rows.map((r) => (
        <div key={r.key} className={`${s.frow} ${r.match && !r.administrative ? s.frowMatch : ''}`} data-field={r.key} data-state={r.match ? 'match' : 'differs'}>
          <span className={s.fl}>{r.def.label}</span><span className={s.fv}><CellView def={r.def} value={r.values[idx]!} /></span><Marker match={r.match} />
        </div>
      ))}
      <div className={s.paneFoot}><DecisionButtons partNumber={p.partNumber} size="md" /><SearchOnLink partNumber={p.partNumber} /><OpenInPlm partNumber={p.partNumber} /></div>
    </section>
  )
  return <div className={s.dual} data-testid="compare-dual">{pane(a, 0)}{pane(b, 1)}</div>
}

/** Compare two or more catalogue parts, in two forms from the same selection: A-to-B dual pane (exactly two) and the aligned attribute table. */
export function CompareView() {
  const svc = useCatalogue()
  const [params, setParams] = useSearchParams()
  const [picking, setPicking] = useState(false)
  const [q, setQ] = useState('')
  const ids = [params.get('a'), params.get('b'), ...readList(params, 'more')].filter((x): x is string => !!x)
  const parts = ids.map((id) => svc.part(id)).filter((p): p is CatalogueRowX => !!p)
  const form = params.get('form') === 'table' ? 'table' : 'dual'
  const mode = params.get('rows') === 'differences' ? 'differences' : 'all'
  const from = params.get('from')
  const root = CATALOGUE_SETTINGS.dataRootId
  const patch = (p: Record<string, string | null>) => setParams((cur) => { const n = new URLSearchParams(cur); Object.entries(p).forEach(([k, v]) => { if (v == null) n.delete(k); else n.set(k, v) }); return n }, { replace: true })
  const setParts = (next: string[]) => patch({ a: next[0] ?? null, b: next[1] ?? null, more: next.length > 2 ? writeList(next.slice(2)) : null })

  const threads = new Set(parts.map((p) => String(p.fields.thread)))
  const size = threads.size === 1 ? svc.node(root)?.children?.find((c) => c.scope?.thread?.[0] === [...threads][0]) : undefined
  const pq = params.toString()
  const crumbs = useMemo(() => {
    const p = new URLSearchParams(pq)
    const path = svc.path(root)
    const trail = [{ label: 'Search', to: '/search/new' }, { label: 'Catalogue', to: nodeUrl(null, p) }, ...path.map((n) => ({ label: n.label, to: nodeUrl(n.id, p) }))]
    if (size) trail.push({ label: size.label, to: from ?? nodeUrl(size.id, p) })
    return [...trail, { label: 'Compare' }]
  }, [svc, root, size, from, pq])
  useBreadcrumbs(crumbs)

  const used = form === 'dual' ? parts.slice(0, 2) : parts
  const all = useMemo(() => buildCompareRows(used), [used.map((p) => p.partNumber).join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  const { differing, total } = diffSummary(all)
  const shown = visibleRows(all, mode)
  const candidates = useMemo(() => svc.rows(root).filter((r) => !ids.includes(r.partNumber) && (!q || r.partNumber.toLowerCase().includes(q.toLowerCase()))).slice(0, 40), [svc, root, ids.join('|'), q]) // eslint-disable-line react-hooks/exhaustive-deps

  if (parts.length < 2) {
    return (
      <div className={s.cmp}>
        <EmptyState title="Select at least two parts to compare" action={<Link to={from ?? catalogueUrl(`/catalogue/${root}`, params)}>Back to Bolts</Link>}>Select two or more parts to compare.</EmptyState>
      </div>
    )
  }
  const adminLabels = CATALOGUE_ADMINISTRATIVE_FIELDS.map((k) => compareFieldByKey(k)?.label ?? k).join(', ')
  return (
    <div className={s.cmp} data-testid="compare-view">
      <div className={s.cmpHead}>
        <h1 className="text-page">Compare {parts.length} Parts</h1>
        <span className={s.diffPill} data-testid="diff-summary"><Triangle size={12} aria-hidden />{differing} of {total} fields differ</span>
        <span className="right row">
          <Seg value={form} label="Compare form" onChange={(f) => patch({ form: f })} options={[['dual', 'A-to-B (CAD)'], ['table', 'Attribute table']]} />
          <Seg value={mode} label="Rows shown" onChange={(m) => patch({ rows: m === 'all' ? null : m })} options={[['all', 'All Fields'], ['differences', 'Differences Only']]} />
        </span>
      </div>
      {form === 'dual' && parts.length > 2 && <Badge tone="info">A-to-B compares exactly two parts. Showing A and B of {parts.length}; the attribute table shows all.</Badge>}
      <Stub id="search-index" note="Part records from fixture rows">
        {form === 'dual'
          ? <DualPane a={parts[0]!} b={parts[1]!} rows={shown} />
          : <AttributeTable parts={parts} rows={shown} onAdd={() => setPicking(true)} onRemove={(pn) => setParts(ids.filter((x) => x !== pn))} />}
      </Stub>
      {shown.length === 0 && <EmptyState title="No differing fields">These parts match on all fields.</EmptyState>}
      <div className={s.legend}>
        <span><Marker match /> Matching value</span><span><Marker match={false} /> Differs</span>
        <span className="muted">Not counted: {adminLabels}.</span>
      </div>
      {picking && (
        <Modal title="Add part to compare" onClose={() => setPicking(false)}>
          <div className="col">
            <SearchBox value={q} onChange={setQ} placeholder="Filter part numbers" />
            <div className={s.pickList}>
              {candidates.map((c) => <button key={c.partNumber} type="button" className={s.pick} onClick={() => { const next = [...ids, c.partNumber]; patch({ a: next[0] ?? null, b: next[1] ?? null, more: writeList(next.slice(2)), form: 'table' }); setPicking(false); setQ('') }}><span className="data" style={{ fontWeight: 500 }}>{c.partNumber}</span><span className="muted">{c.description}</span></button>)}
              {candidates.length === 0 && <span className="muted" style={{ padding: 'var(--gap-3)' }}>No more parts match.</span>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
