import { CATALOGUE_ADMINISTRATIVE_FIELDS, CATALOGUE_COMPARE_FIELDS, type CatalogueFieldDef } from '../../config/catalogueConfig'
import type { CatalogueRowX } from '../../domain/catalogue'

export type Cell = string | number | null

/** Raw value of a compare field for a part. null when the part has no value (rendered as a dash, counted as different from a value). */
export function fieldValue(part: CatalogueRowX, def: Pick<CatalogueFieldDef, 'key' | 'source'>): Cell {
  const rec = (def.source === 'row' ? part : def.source === 'plm' ? part.plm : part.fields) as unknown as Record<string, Cell | undefined>
  const v = rec[def.key]
  return v === undefined || v === '' ? null : v
}

/** Display text of a raw value with its unit (units never mix: every length is mm). */
export const formatCell = (v: Cell, unit?: string): string => (v == null ? '—' : unit ? `${v} ${unit}` : String(v))

export interface CompareRow {
  key: string
  def: CatalogueFieldDef
  administrative: boolean
  /** One raw value per part, in part order. */
  values: Cell[]
  /** True when every part has the same value (all missing counts as equal). */
  match: boolean
}

export function buildCompareRows(parts: CatalogueRowX[], opts?: { fields?: CatalogueFieldDef[]; administrative?: string[] }): CompareRow[] {
  const admin = new Set(opts?.administrative ?? CATALOGUE_ADMINISTRATIVE_FIELDS)
  return (opts?.fields ?? CATALOGUE_COMPARE_FIELDS).map((def) => {
    const values = parts.map((p) => fieldValue(p, def))
    return { key: def.key, def, administrative: admin.has(def.key), values, match: values.every((v) => v === values[0]) }
  })
}

/** Differing and total comparable fields, administrative fields excluded from both. */
export function diffSummary(rows: CompareRow[]): { differing: number; total: number } {
  const counted = rows.filter((r) => !r.administrative)
  return { differing: counted.filter((r) => !r.match).length, total: counted.length }
}

/** Rows for a view: All Fields keeps administrative rows (muted); Differences Only drops matches and administrative rows. */
export function visibleRows(rows: CompareRow[], mode: 'all' | 'differences'): CompareRow[] {
  return mode === 'all' ? rows : rows.filter((r) => !r.administrative && !r.match)
}
