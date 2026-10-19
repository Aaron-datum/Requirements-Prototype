import { applyFilters, describeFilter, isActive } from '../../components/table/filtering'
import type { ColumnDef, FilterState, FilterValue } from '../../components/table/types'
import type { RegisteredTable } from './tableRegistry'

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9%.\s]/g, ' ').replace(/\s+/g, ' ').trim()
const word = (hay: string, needle: string): boolean => new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(hay)

const RANGE = (col: ColumnDef<unknown>): boolean => col.filter === 'range-units'
const MORE = /\b(over|above|more than|greater than|at least|min(imum)?|>=?)\s*(\d+(?:\.\d+)?)\s*(%|mm|in|kg|g|usd)?/
const LESS = /\b(under|below|less than|fewer than|at most|max(imum)?|<=?)\s*(\d+(?:\.\d+)?)\s*(%|mm|in|kg|g|usd)?/

export interface FilterResult { applied: string[]; count: number; total: number }

/**
 * Turn plain words into filters on the table that is on screen, using only what the table itself knows: its filterable
 * columns, their values (with labels from the vocabularies) and their units. Nothing is hard-coded to a field or status name.
 */
export function applyTextFilter(entry: RegisteredTable, text: string): FilterResult {
  const { model } = entry
  const t = ` ${norm(text)} `.trim()
  const next: FilterState = { ...model.filters }
  const cols = (model.columns as Array<ColumnDef<unknown>>).filter((c) => c.filter && c.filter !== 'none')

  // Values: any option whose label appears in the text.
  for (const c of cols) {
    if (RANGE(c) || c.filter === 'text-search' || c.filter === 'date-preset') continue
    const raws = [...new Set((model.rows as unknown[]).map((r) => c.get(r)).filter((v) => v != null && v !== '').map(String))]
    const hits = raws.filter((raw) => {
      const label = norm(c.label_of?.(raw) ?? raw)
      return label.length >= 3 && word(t, label)
    })
    if (hits.length) next[c.key] = { values: hits }
  }

  // Ranges: "over 80%", "under 80 mm".
  const more = MORE.exec(t), less = LESS.exec(t)
  const rangeCols = cols.filter(RANGE)
  const pickRange = (unit?: string): ColumnDef<unknown> | undefined =>
    rangeCols.find((c) => word(t, norm(c.label))) ?? rangeCols.find((c) => unit && norm(c.unit ?? '') === unit) ?? (unit === '%' ? rangeCols.find((c) => /similar|match|confidence/.test(norm(c.label))) : undefined) ?? (rangeCols.length === 1 ? rangeCols[0] : undefined)
  for (const [m, key] of [[more, 'min'], [less, 'max']] as const) {
    if (!m) continue
    const col = pickRange(m[4])
    if (!col) continue
    const prev: FilterValue = next[col.key] ?? {}
    next[col.key] = { ...prev, [key]: Number(m[3]) }
  }

  const active = Object.fromEntries(Object.entries(next).filter(([k, v]) => { const c = cols.find((x) => x.key === k); return c && isActive(c, v) }))
  const changed = JSON.stringify(active) !== JSON.stringify(Object.fromEntries(Object.entries(model.filters).filter(([k, v]) => { const c = cols.find((x) => x.key === k); return c && isActive(c, v) })))
  if (changed) model.setFilters(active)
  const applied = changed ? Object.entries(active).flatMap(([k, v]) => { const c = cols.find((x) => x.key === k)!; return describeFilter(c, v).map((d) => `${c.label}: ${d}`) }) : []
  return { applied, count: applyFilters(model.rows as unknown[], model.columns as Array<ColumnDef<unknown>>, active).length, total: model.rows.length }
}

/** A few things worth saying on this table, drawn from its own columns. */
export function filterHints(entry: RegisteredTable): string[] {
  const cols = (entry.model.columns as Array<ColumnDef<unknown>>).filter((c) => c.filter === 'multi-tag' || c.filter === 'level-seg' || RANGE(c))
  return cols.slice(0, 3).map((c) => (RANGE(c) ? `over 80${c.unit ?? ''} ${c.label.toLowerCase()}` : c.label.toLowerCase()))
}
