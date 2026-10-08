import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { useConfig } from '../../config/useConfig'
import { useAppStore } from '../../stores/appStore'
import { Button, Checkbox, EmptyState, InlineError, SkeletonRows } from '../ui'
import { FilterSidebar } from './FilterSidebar'
import { describeFilter } from './filtering'
import type { ColumnDef, GroupOption } from './types'
import { useTableModel, type TableModel } from './useTableModel'
import s from './Table.module.css'

export interface TableShellProps<R> {
  id: string
  columns: Array<ColumnDef<R>>
  rows: R[]
  rowId: (row: R) => string
  noun?: string
  title?: ReactNode
  /** Row selection for the side panel (single). */
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Multi-select checkboxes (catalogue compare). */
  checkedIds?: string[]
  onCheckedChange?: (ids: string[]) => void
  /** Rows pinned above the sorted list (the Source Part row in Results). Never filtered or sorted. */
  pinnedRows?: R[]
  /** Expandable row detail (Results). */
  renderExpanded?: (row: R) => ReactNode
  /** Standing row treatment independent of selection (dangerous cases). Always pair with text in a cell. */
  rowTone?: (row: R) => 'danger' | 'warn' | undefined
  rowActions?: (row: R) => ReactNode
  actionsLabel?: string
  groupOptions?: Array<GroupOption<R>>
  defaultGroup?: string
  folderMeta?: (rows: R[]) => ReactNode
  /** Gallery layout for Files. */
  renderCard?: (row: R) => ReactNode
  defaultLayout?: 'table' | 'gallery'
  toolbar?: ReactNode
  urlSync?: boolean
  paginate?: boolean
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  empty?: { title: string; body?: ReactNode }
  sidebar?: boolean
  /** Receives the model so the screen can read filtered rows or drive filters (catalogue tree narrowing). */
  onModel?: (m: TableModel<R>) => void
  initialFilters?: Record<string, import('./types').FilterValue>
  header?: ReactNode
}

const ROWS_PER_PAGE = { compact: 15, default: 10, comfy: 8 } as const

/**
 * The one table shell: left sidebar (Filters / Columns / Manage) + pills + table (optionally subfoldered) with skeleton,
 * inline error, empty state, density from the global setting, keyboard-navigable rows. Reused identically by Files, Results,
 * BOM review, Requirement trace, Catalogue and the dashboard overflow table.
 */
export function TableShell<R>(p: TableShellProps<R>) {
  const config = useConfig()
  const density = useAppStore((a) => a.density)
  const model = useTableModel<R>({ id: p.id, columns: p.columns, rows: p.rows, urlSync: p.urlSync, defaultGroup: p.defaultGroup, defaultLayout: p.defaultLayout, maxExtraColumns: config.limits.maxExtraColumns, initialFilters: p.initialFilters })
  p.onModel?.(model)
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(0)
  const { visCols, sorted, sort, setSort, filters, activeKeys } = model

  const groupOpt = p.groupOptions?.find((g) => g.key === model.group)
  const perPage = ROWS_PER_PAGE[density]
  const paged = p.paginate ? sorted.slice(page * perPage, page * perPage + perPage) : sorted
  const pages = p.paginate ? Math.max(1, Math.ceil(sorted.length / perPage)) : 1
  const folders = useMemo(() => {
    if (!groupOpt) return [{ name: null as string | null, rows: paged }]
    const m = new Map<string, R[]>()
    paged.forEach((r) => { const k = groupOpt.get(r); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) })
    return [...m].map(([name, rows]) => ({ name, rows }))
  }, [paged, groupOpt])

  const pills = model.columns.flatMap((c) => (activeKeys.includes(c.key) ? describeFilter(c, filters[c.key]!).map((label, i) => ({ key: `${c.key}-${i}`, label, c, i })) : []))
  const colCount = visCols.length + (p.renderExpanded ? 1 : 0) + (p.onCheckedChange ? 1 : 0) + (p.rowActions ? 1 : 0)
  const onKey = (e: React.KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onSelect?.(id) }
    if (e.key === 'ArrowDown') { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus() }
  }

  const renderRow = (r: R, pinned = false) => {
    const id = p.rowId(r)
    const tone = p.rowTone?.(r)
    const isOpen = !!expanded[id]
    return (
      <Fragment key={(pinned ? 'pin-' : '') + id}>
        <tr tabIndex={0} data-row-id={id} data-pinned={pinned || undefined} data-tone={tone}
          className={`${s.row} ${p.selectedId === id ? s.picked : ''} ${tone === 'danger' ? s.danger : tone === 'warn' ? s.warnRow : ''} ${pinned ? s.pinned : ''}`}
          aria-selected={p.selectedId === id} onClick={() => p.onSelect?.(id)} onKeyDown={(e) => onKey(e, id)}>
          {p.renderExpanded && (
            <td className={s.expCell} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={s.expBtn} aria-expanded={isOpen} aria-label={isOpen ? 'Collapse row' : 'Expand row'} onClick={() => setExpanded({ ...expanded, [id]: !isOpen })}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
            </td>
          )}
          {p.onCheckedChange && (
            <td className={s.expCell} onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={!!p.checkedIds?.includes(id)} onChange={(on) => p.onCheckedChange!(on ? [...(p.checkedIds ?? []), id] : (p.checkedIds ?? []).filter((x) => x !== id))} label={<span className="sr-only">Select {id}</span>} />
            </td>
          )}
          {visCols.map((c) => (
            <td key={c.key} className={sort?.key === c.key ? s.sortedCol : ''} style={{ textAlign: c.align ?? 'left' }}>{c.render ? c.render(r) : <span className={c.align === 'right' ? 'data' : undefined}>{String(c.get(r) ?? '')}</span>}</td>
          ))}
          {p.rowActions && <td className={s.actions} onClick={(e) => e.stopPropagation()}>{p.rowActions(r)}</td>}
        </tr>
        {p.renderExpanded && isOpen && <tr className={s.expandedRow}><td colSpan={colCount}>{p.renderExpanded(r)}</td></tr>}
      </Fragment>
    )
  }

  const body = (() => {
    if (p.loading) return <SkeletonRows rows={8} label="Loading rows" />
    if (p.error) return <div style={{ padding: 16 }}><InlineError onRetry={p.onRetry}>{p.error}</InlineError></div>
    if (model.layout === 'gallery' && p.renderCard) {
      return <div className={s.gallery}>{paged.map((r) => <button key={p.rowId(r)} type="button" className={`${s.card} ${p.selectedId === p.rowId(r) ? s.cardPicked : ''}`} onClick={() => p.onSelect?.(p.rowId(r))}>{p.renderCard!(r)}</button>)}{paged.length === 0 && <EmptyState title={p.empty?.title ?? 'No rows match these filters.'} />}</div>
    }
    return (
      <table className={s.table} data-density={density}>
        <thead>
          <tr>
            {p.renderExpanded && <th className={s.expCell} aria-label="Expand" />}
            {p.onCheckedChange && <th className={s.expCell} aria-label="Select" />}
            {visCols.map((c) => (
              <th key={c.key} style={{ textAlign: c.align ?? 'left', width: c.width }} className={`${s.sortable} ${sort?.key === c.key ? s.sortedHead : ''}`} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={() => setSort(sort?.key === c.key ? (sort.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' })}>
                <span className={s.thIn}>{c.label}{sort?.key === c.key && (sort.dir === 'asc' ? ' ↑' : ' ↓')}{activeKeys.includes(c.key) && <i className={s.dot} title="Filter active" />}</span>
              </th>
            ))}
            {p.rowActions && <th style={{ textAlign: 'center' }}>{p.actionsLabel ?? 'Actions'}</th>}
          </tr>
        </thead>
        <tbody>
          {p.pinnedRows?.map((r) => renderRow(r, true))}
          {paged.length === 0 && (
            <tr><td colSpan={colCount}>
              <EmptyState title={p.empty?.title ?? 'No rows match these filters.'} action={activeKeys.length ? <Button size="sm" onClick={model.clearAll}>Clear all filters</Button> : undefined}>{p.empty?.body}</EmptyState>
            </td></tr>
          )}
          {folders.map((f) => (
            <Fragment key={f.name ?? '_'}>
              {f.name != null && (
                <tr className={s.folder} onClick={() => setClosed({ ...closed, [f.name!]: !closed[f.name!] })}>
                  <td colSpan={colCount}>
                    {closed[f.name] ? <ChevronRight size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />} {f.name}
                    <span className="muted" style={{ fontWeight: 400 }}> · {f.rows.length} {f.rows.length === 1 ? 'row' : 'rows'}{p.folderMeta ? <> · {p.folderMeta(f.rows)}</> : null}</span>
                  </td>
                </tr>
              )}
              {!(f.name != null && closed[f.name]) && f.rows.map((r) => renderRow(r))}
            </Fragment>
          ))}
        </tbody>
      </table>
    )
  })()

  return (
    <>
      {p.sidebar !== false && <FilterSidebar model={model} noun={p.noun} groupOptions={p.groupOptions} shownCount={sorted.length} canGallery={!!p.renderCard} />}
      <div className={s.center} data-density={density}>
        {p.header}
        <div className={s.pills} role="toolbar" aria-label="Applied filters">
          {p.title && <span className="text-section">{p.title}</span>}
          <span className="data muted" data-testid="result-count">{sorted.length} of {p.rows.length} {p.noun ?? 'rows'}</span>
          {pills.map((x) => (
            <span key={x.key} className={s.pill}>{x.label}<button type="button" aria-label={`Remove filter ${x.label}`} onClick={() => model.setFilter(x.c.key, undefined)}>×</button></span>
          ))}
          {pills.length > 0 && <button type="button" className={s.clear} onClick={model.clearAll}>Clear all</button>}
          <span className="right row">{p.toolbar}</span>
        </div>
        <div className={s.scroll}>{body}</div>
        {p.paginate && pages > 1 && (
          <div className={s.pager}>
            <Button size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="data muted">Page {page + 1} of {pages} · {perPage} per page</span>
            <Button size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </div>
    </>
  )
}
