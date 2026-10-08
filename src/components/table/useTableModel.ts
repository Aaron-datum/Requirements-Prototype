import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applyFilters, compareRaw, isActive } from './filtering'
import type { ColumnDef, FilterState, FilterValue } from './types'

export interface SortState { key: string; dir: 'asc' | 'desc' }

/**
 * Table state: filters, visible columns, field set, sort, group, layout. Optional URL sync keeps filters and sort
 * deep-linkable (param `t_<id>`). Rules (design system, decided):
 *   - hiding a column never touches Filters
 *   - removing a column (Add / Remove Columns) removes its filter unless that filter is actively applied
 *   - adding a column adds its filter, even if the column is then hidden
 */
export function useTableModel<R>({ id, columns, rows, urlSync = false, defaultGroup = 'none', defaultLayout = 'table', maxExtraColumns = 3, initialFilters }: {
  id: string; columns: Array<ColumnDef<R>>; rows: R[]; urlSync?: boolean; defaultGroup?: string; defaultLayout?: 'table' | 'gallery'; maxExtraColumns?: number; initialFilters?: FilterState
}) {
  const [params, setParams] = useSearchParams()
  const urlKey = `t_${id}`
  const fromUrl = useMemo<{ f?: FilterState; s?: SortState }>(() => {
    if (!urlSync) return {}
    try { return JSON.parse(params.get(urlKey) ?? '{}') as { f?: FilterState; s?: SortState } } catch { return {} }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [filters, setFiltersRaw] = useState<FilterState>(fromUrl.f ?? initialFilters ?? {})
  const [sort, setSortRaw] = useState<SortState | null>(fromUrl.s ?? null)
  const [fields, setFields] = useState<string[]>(() => columns.filter((c) => !c.optional).map((c) => c.key))
  const [visible, setVisible] = useState<string[]>(() => columns.filter((c) => c.defaultVisible !== false && !c.showOnlyWhenFiltered && !c.optional).map((c) => c.key))
  const [group, setGroup] = useState(defaultGroup)
  const [layout, setLayout] = useState<'table' | 'gallery'>(defaultLayout)

  const sync = useCallback((f: FilterState, s: SortState | null) => {
    if (!urlSync) return
    const active = Object.fromEntries(Object.entries(f).filter(([k, v]) => { const c = columns.find((x) => x.key === k); return c && isActive(c, v) }))
    const next = new URLSearchParams(params)
    if (Object.keys(active).length || s) next.set(urlKey, JSON.stringify({ f: active, s })); else next.delete(urlKey)
    setParams(next, { replace: true })
  }, [urlSync, columns, params, setParams, urlKey])

  const setFilters = useCallback((f: FilterState) => { setFiltersRaw(f); sync(f, sort) }, [sync, sort])
  const setFilter = useCallback((key: string, v: FilterValue | undefined) => {
    const next = { ...filters }
    if (v) next[key] = v; else delete next[key]
    setFilters(next)
  }, [filters, setFilters])
  const setSort = useCallback((s: SortState | null) => { setSortRaw(s); sync(filters, s) }, [sync, filters])
  const clearAll = useCallback(() => setFilters({}), [setFilters])

  const col = useCallback((k: string) => columns.find((c) => c.key === k), [columns])
  const activeKeys = useMemo(() => columns.filter((c) => c.filter && c.filter !== 'none' && isActive(c, filters[c.key])).map((c) => c.key), [columns, filters])
  const filterCols = useMemo(() => columns.filter((c) => c.filter && c.filter !== 'none' && (fields.includes(c.key) || activeKeys.includes(c.key))), [columns, fields, activeKeys])

  const visCols = useMemo(() => {
    let extras = 0
    return columns.filter((c) => {
      if (c.pinned) return true
      if (c.showOnlyWhenFiltered) { if (activeKeys.includes(c.key) && extras < maxExtraColumns) { extras++; return true } return false }
      return fields.includes(c.key) && visible.includes(c.key)
    })
  }, [columns, fields, visible, activeKeys, maxExtraColumns])

  const filtered = useMemo(() => applyFilters(rows, columns, filters), [rows, columns, filters])
  const sorted = useMemo(() => {
    if (!sort) return filtered
    const c = col(sort.key)
    if (!c) return filtered
    const out = [...filtered].sort((a, b) => compareRaw(c.get(a), c.get(b)))
    return sort.dir === 'asc' ? out : out.reverse()
  }, [filtered, sort, col])

  /** Apply the Add / Remove Columns picker result. */
  const applyFields = useCallback((next: string[]) => {
    const added = next.filter((k) => !fields.includes(k))
    setFields(next)
    setVisible((v) => [...new Set([...v.filter((k) => next.includes(k)), ...added])])
    const keep: FilterState = {}
    Object.entries(filters).forEach(([k, v]) => { const c = col(k); if (next.includes(k) || (c && isActive(c, v))) keep[k] = v })
    setFilters(keep)
  }, [fields, filters, col, setFilters])

  return { id, columns, rows, filters, setFilters, setFilter, clearAll, activeKeys, filterCols, fields, applyFields, visible, setVisible, visCols, filtered, sorted, sort, setSort, group, setGroup, layout, setLayout, col }
}
export type TableModel<R> = ReturnType<typeof useTableModel<R>>
