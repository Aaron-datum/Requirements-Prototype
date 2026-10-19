import { describeFilter, isActive } from '../../components/table/filtering'
import type { ColumnDef } from '../../components/table/types'
import type { ScreenColumn, ScreenRow, ScreenSnapshot } from '../../domain/types'
import type { RegisteredTable } from './tableRegistry'

type Col = ColumnDef<unknown>

const kindOf = (c: Col, rows: unknown[]): ScreenColumn['kind'] => {
  if (c.filter === 'range-units') return 'number'
  if (c.filter === 'multi-tag' || c.filter === 'level-seg' || c.filter === 'multi-search') return 'enum'
  if (c.filter === 'date-preset') return 'date'
  const vals = rows.slice(0, 50).map((r) => c.get(r)).filter((v) => v != null && v !== '')
  return vals.length && vals.every((v) => typeof v === 'number') ? 'number' : 'text'
}

/** What the chat can see of the table on screen. Serialisable, capped, and built only from the table's own column definitions. */
export function snapshotOf(entry: RegisteredTable): ScreenSnapshot {
  const m = entry.model
  const cols = m.columns as Col[]
  const rows = m.sorted as unknown[]
  const visible = new Set((m.visCols as Col[]).map((c) => c.key))
  const columns: ScreenColumn[] = cols.map((c) => ({ key: c.key, label: c.label, kind: kindOf(c, rows), unit: c.unit, visible: visible.has(c.key) }))
  const labelCol = cols.find((c) => c.pinned) ?? cols[0]!
  const screenRows: ScreenRow[] = rows.slice(0, 400).map((r) => {
    const v: ScreenRow['v'] = {}
    cols.forEach((c, i) => {
      const raw = c.get(r)
      v[c.key] = raw == null || raw === '' ? null : columns[i]!.kind === 'number' && typeof raw === 'number' ? raw : columns[i]!.kind === 'enum' ? (c.label_of?.(String(raw)) ?? String(raw)) : String(raw)
    })
    const id = entry.rowId(r)
    return { id, label: String(labelCol.get(r) ?? id), v }
  })
  const filters = cols.flatMap((c) => { const f = m.filters[c.key]; return f && isActive(c, f) ? describeFilter(c, f).map((d) => `${c.label}: ${d}`) : [] })
  return {
    table: entry.id, columns, rows: screenRows, total: m.rows.length, selected: entry.selectedId, checked: entry.checked ?? [],
    sort: m.sort ? { key: m.sort.key, dir: m.sort.dir } : undefined, group: m.group, layout: m.layout, filters,
  }
}
