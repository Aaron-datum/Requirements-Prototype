import { now } from '../../lib/clock'
import type { ColumnDef, FilterState, FilterValue, Raw } from './types'

export const DATE_PRESETS: Array<[string, string]> = [['all', 'Any time'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days'], ['year', 'This year'], ['custom', 'Custom range']]

/** Resolve a date preset to an inclusive [from, to] ISO-date range (null = open). */
export function presetRange(preset: string, nowIso: string = now()): [string | null, string | null] {
  const d = new Date(nowIso)
  const iso = (x: Date) => x.toISOString().slice(0, 10)
  const back = (days: number) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() - days); return iso(x) }
  switch (preset) {
    case '7d': return [back(7), iso(d)]
    case '30d': return [back(30), iso(d)]
    case '90d': return [back(90), iso(d)]
    case 'year': return [`${d.getUTCFullYear()}-01-01`, iso(d)]
    default: return [null, null]
  }
}

export function isActive(def: Pick<ColumnDef<unknown>, 'filter'>, v: FilterValue | undefined): boolean {
  if (!v) return false
  switch (def.filter) {
    case 'text-search': return !!v.query
    case 'multi-tag': case 'multi-search': case 'level-seg': return !!v.values?.length
    case 'range-units': return v.min != null || v.max != null
    case 'date-preset': return (!!v.preset && v.preset !== 'all' && (v.preset !== 'custom' || !!v.from || !!v.to))
    default: return false
  }
}

const asNum = (r: Raw): number | null => (r == null || r === '' || Number.isNaN(Number(r)) ? null : Number(r))

export function matchesFilter<R>(def: ColumnDef<R>, v: FilterValue, row: R): boolean {
  const raw = def.get(row)
  switch (def.filter) {
    case 'text-search': return String(raw ?? '').toLowerCase().includes((v.query ?? '').toLowerCase())
    case 'multi-tag': case 'multi-search': case 'level-seg': return (v.values ?? []).includes(String(raw ?? ''))
    case 'range-units': {
      const n = asNum(raw)
      if (n == null) return false
      return (v.min == null || n >= v.min) && (v.max == null || n <= v.max)
    }
    case 'date-preset': {
      const d = raw ? String(raw).slice(0, 10) : ''
      if (!d) return false
      const [from, to] = v.preset === 'custom' ? [v.from || null, v.to || null] : presetRange(v.preset ?? 'all')
      return (!from || d >= from) && (!to || d <= to)
    }
    default: return true
  }
}

/** Apply every active filter, optionally ignoring one column (for facet counts: "all other facets applied"). */
export function applyFilters<R>(rows: R[], columns: Array<ColumnDef<R>>, state: FilterState, except?: string): R[] {
  const active = columns.filter((c) => c.key !== except && c.filter && c.filter !== 'none' && isActive(c, state[c.key]))
  if (!active.length) return rows
  return rows.filter((r) => active.every((c) => matchesFilter(c, state[c.key]!, r)))
}

/** Option list with live counts. Each count is computed with all OTHER facets applied. Active values stay listed at 0. */
export function optionCounts<R>(rows: R[], columns: Array<ColumnDef<R>>, state: FilterState, def: ColumnDef<R>): Array<[string, number]> {
  const base = applyFilters(rows, columns, state, def.key)
  const m = new Map<string, number>()
  base.forEach((r) => { const v = def.get(r); if (v == null || v === '') return; const k = String(v); m.set(k, (m.get(k) ?? 0) + 1) })
  state[def.key]?.values?.forEach((v) => { if (!m.has(v)) m.set(v, 0) })
  rows.forEach((r) => { const v = def.get(r); if (v != null && v !== '' && !m.has(String(v))) m.set(String(v), 0) })
  const entries = [...m]
  if (def.order) return entries.sort((a, b) => (def.order!.indexOf(a[0]) + 1 || 99) - (def.order!.indexOf(b[0]) + 1 || 99))
  return entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

export function numericBounds<R>(rows: R[], def: ColumnDef<R>): [number, number] {
  const nums = rows.map((r) => asNum(def.get(r))).filter((n): n is number => n != null)
  return nums.length ? [Math.floor(Math.min(...nums)), Math.ceil(Math.max(...nums))] : [0, 100]
}

export function compareRaw(a: Raw, b: Raw): number {
  const x = asNum(a), y = asNum(b)
  if (x != null && y != null) return x - y
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true })
}

export function describeFilter<R>(def: ColumnDef<R>, v: FilterValue): string[] {
  switch (def.filter) {
    case 'text-search': return [`${def.label}: “${v.query}”`]
    case 'multi-tag': case 'multi-search': case 'level-seg': return (v.values ?? []).map((x) => `${def.label}: ${def.label_of ? def.label_of(x) : x}`)
    case 'range-units': return [`${def.label}: ${v.min ?? '…'}–${v.max ?? '…'}${def.unit ? ' ' + def.unit : ''}`]
    case 'date-preset': return [`${def.label}: ${v.preset === 'custom' ? `${v.from || '…'} to ${v.to || '…'}` : (DATE_PRESETS.find((p) => p[0] === v.preset)?.[1] ?? v.preset)}`]
    default: return []
  }
}
