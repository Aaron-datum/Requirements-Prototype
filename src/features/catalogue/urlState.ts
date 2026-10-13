import { CATALOGUE_FACETS, facetByKey } from '../../config/catalogueConfig'
import type { FacetSelection } from '../../domain/catalogue'
import type { FilterState, FilterValue } from '../../components/table/types'
import { isActive } from '../../components/table/filtering'
import type { SortState } from '../../components/table/useTableModel'

/** TableShell (urlSync) keeps filters and sort in this param as JSON: {"f": {...}, "s": {...}}. */
export const TABLE_ID = 'catalogue'
export const TABLE_PARAM = `t_${TABLE_ID}`
export const SEL_PARAM = 'sel'
export const PART_PARAM = 'part'

export interface TableUrlState { filters: FilterState; sort: SortState | null }

export function readTable(params: URLSearchParams): TableUrlState {
  try {
    const o = JSON.parse(params.get(TABLE_PARAM) ?? '{}') as { f?: FilterState; s?: SortState | null }
    return { filters: o.f ?? {}, sort: o.s ?? null }
  } catch { return { filters: {}, sort: null } }
}

export const writeTable = (state: Partial<TableUrlState>): string => JSON.stringify({ f: state.filters ?? {}, s: state.sort ?? null })

const asDef = (key: string) => facetByKey(key)
const activeOf = (filters: FilterState): FilterState => Object.fromEntries(Object.entries(filters).filter(([k, v]) => { const d = asDef(k); return d && isActive({ filter: d.control }, v) }))

/** Table filter state to the search-index facet selection plus the part-number text. */
export function facetsFromFilters(filters: FilterState): { facets: FacetSelection; text: string } {
  const facets: FacetSelection = {}
  let text = ''
  Object.entries(activeOf(filters)).forEach(([k, v]) => {
    const d = asDef(k)!
    if (d.kind === 'text') text = v.query ?? ''
    else if (d.kind === 'range') facets[k] = [v.min == null ? '' : String(v.min), v.max == null ? '' : String(v.max)]
    else facets[k] = [...(v.values ?? [])]
  })
  return { facets, text }
}

/** Facet selection (and optional part-number text) to table filter state. Only active entries are produced. */
export function filtersFromFacets(facets: FacetSelection, text = ''): FilterState {
  const out: FilterState = {}
  CATALOGUE_FACETS.forEach((d) => {
    if (d.kind === 'text') { if (text) out[d.key] = { query: text }; return }
    const sel = facets[d.key]
    if (!sel) return
    if (d.kind === 'range') {
      const v: FilterValue = { min: sel[0] === '' || sel[0] === undefined ? null : Number(sel[0]), max: sel[1] === '' || sel[1] === undefined ? null : Number(sel[1]) }
      if (v.min != null || v.max != null) out[d.key] = v
    } else if (sel.length) out[d.key] = { values: [...sel] }
  })
  return out
}

/** Merge b over a facet by facet (a facet present in b replaces a's). */
export const mergeFilters = (a: FilterState, b: FilterState): FilterState => ({ ...activeOf(a), ...b })

export const anyActive = (filters: FilterState): boolean => Object.keys(activeOf(filters)).length > 0

export const readList = (params: URLSearchParams, key: string): string[] => (params.get(key) ?? '').split(',').map((x) => x.trim()).filter(Boolean)
export const writeList = (ids: string[]): string => ids.join(',')

/** Keep the workflow context (and nothing else) from the current URL. */
export function ctxParams(params: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams()
  const ctx = params.get('ctx'), ret = params.get('ret')
  if (ctx) out.set('ctx', ctx)
  if (ret) out.set('ret', ret)
  return out
}

/** Build a catalogue URL. The workflow context of the current URL always travels with it. */
export function catalogueUrl(path: string, current: URLSearchParams, extra?: Record<string, string | undefined>): string {
  const q = ctxParams(current)
  Object.entries(extra ?? {}).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, v) })
  const s = q.toString()
  return `${path}${s ? `?${s}` : ''}`
}

export const nodeUrl = (nodeId: string | null, current: URLSearchParams, extra?: Record<string, string | undefined>): string => catalogueUrl(nodeId ? `/catalogue/${nodeId}` : '/catalogue', current, extra)

export interface CompareUrl { a: string; b: string; more: string[]; form: 'dual' | 'table'; from?: string; rows?: 'all' | 'differences' }
export function compareUrl(c: CompareUrl, current: URLSearchParams): string {
  return catalogueUrl('/catalogue/compare', current, { a: c.a, b: c.b, more: c.more.length ? writeList(c.more) : undefined, form: c.form, from: c.from, rows: c.rows && c.rows !== 'all' ? c.rows : undefined })
}
