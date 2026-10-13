import { AlertTriangle, Box, Check, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { FieldValueView, type FieldValue } from '../../components/fields/FieldRenderer'
import type { ColumnDef, Raw } from '../../components/table/types'
import { Badge } from '../../components/ui'
import type { AppConfigFull } from '../../domain/extra'
import type { TreeNode } from '../../domain/types'
import { resolveValue } from '../../config/appConfig'
import type { SearchFile } from '../../fixtures/extras/search/types'
import s from './Search.module.css'

export const fmtDate = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : '—')
export const fmtDateTime = (iso: string | null | undefined): string => (iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : '—')
export const fmtSize = (b: number): string => `${(b / 1_000_000).toFixed(1)} MB`
export const fmtNum = (n: number): string => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

export function FileThumb({ file, large }: { file: Pick<SearchFile, 'thumbnail' | 'name'>; large?: boolean }) {
  return <img src={file.thumbnail ?? '/cad-preview-1.png'} alt={large ? `Preview of ${file.name}` : ''} className={large ? s.thumbLg : s.thumb} />
}

/** Columns for every schema field. Built FROM config.schema.fields so switching schema changes groups, columns and filters. */
export function schemaColumns<R>(config: AppConfigFull, record: (row: R) => Record<string, FieldValue> | undefined, opts: { group?: string } = {}): Array<ColumnDef<R>> {
  return config.schema.fields.map((f) => ({
    key: f.key, label: f.label, group: opts.group ?? f.group, filter: f.filter, unit: f.unit,
    align: f.type === 'number' ? 'right' : 'left',
    get: (r: R): Raw => record(r)?.[f.key],
    label_of: f.vocabularyId ? (raw: string) => resolveValue(config, f.vocabularyId!, raw).label : undefined,
    render: (r: R) => <FieldValueView def={f} value={record(r)?.[f.key]} />,
    showOnlyWhenFiltered: true,
  }))
}

/** Assembly tree. Selecting a node sets the active part; reference nodes are shown but not selectable. */
export function TreeView({ roots, selectedId, onSelect, highlightFileId, filter = '' }: {
  roots: TreeNode[]; selectedId?: string; onSelect?: (n: TreeNode) => void; highlightFileId?: string; filter?: string
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const q = filter.trim().toLowerCase()
  const hit = useMemo(() => {
    const keep = (n: TreeNode): boolean => !q || n.name.toLowerCase().includes(q) || !!n.children?.some(keep)
    return keep
  }, [q])
  const render = (n: TreeNode, depth: number): ReactNode => {
    if (!hit(n)) return null
    const kids = n.children
    const isClosed = !!closed[n.id] && !q
    const disabled = !!n.reference
    return (
      <div key={n.id} role="treeitem" aria-expanded={kids ? !isClosed : undefined}>
        <div className={s.trow} style={{ paddingLeft: depth * 16 + 4 }} aria-selected={selectedId === n.id} aria-disabled={disabled || undefined} data-hl={(!!highlightFileId && n.fileId === highlightFileId) || undefined}
          role="button" tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onSelect?.(n)} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onSelect?.(n) } }}>
          {kids ? <button type="button" className={s.caret} aria-label={isClosed ? `Expand ${n.name}` : `Collapse ${n.name}`} onClick={(e) => { e.stopPropagation(); setClosed({ ...closed, [n.id]: !closed[n.id] }) }}>{isClosed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button> : <span className={s.caret} />}
          {kids ? <Layers size={14} aria-hidden /> : <Box size={14} aria-hidden />}
          <span className={s.tlabel}>{n.name}</span>
          {disabled && <Badge tone="outline">Reference</Badge>}
        </div>
        {kids && !isClosed && kids.map((c) => render(c, depth + 1))}
      </div>
    )
  }
  return <div className={s.tree} role="tree">{roots.map((r) => render(r, 0))}</div>
}

/** Value-vs-tolerance mini bar. Always paired with the signed percentage and a within/outside mark. */
export function ToleranceBar({ deviationPct, tolerancePct }: { deviationPct: number; tolerancePct: number }) {
  const out = Math.abs(deviationPct) > tolerancePct
  const half = Math.min(50, (Math.abs(deviationPct) / (tolerancePct * 2)) * 50)
  const style = deviationPct < 0 ? { right: '50%', width: `${half}%` } : { left: '50%', width: `${half}%` }
  return (
    <span className={s.tol} title={`Tolerance ±${tolerancePct}%`}>
      <span className={s.tolTxt}>{out ? <AlertTriangle size={12} className={s.warn} aria-hidden /> : <Check size={12} className={s.pass} aria-hidden />}{deviationPct > 0 ? '+' : ''}{deviationPct.toFixed(1)}%<span className="muted"> ±{tolerancePct}%</span></span>
      <span className={s.tolTrack} role="meter" aria-valuenow={deviationPct} aria-valuemin={-tolerancePct * 2} aria-valuemax={tolerancePct * 2} aria-label={`Deviation ${deviationPct}% against ±${tolerancePct}%`}><b /><i data-out={out} style={style} /></span>
    </span>
  )
}
