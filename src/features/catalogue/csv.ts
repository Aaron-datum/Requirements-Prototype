import { CATALOGUE_EXPORT_FIELDS, compareFieldByKey } from '../../config/catalogueConfig'
import type { CatalogueRowX } from '../../domain/catalogue'
import { fieldValue } from './compareLogic'

const esc = (v: string | number | null): string => {
  const t = v == null ? '' : String(v)
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

/** CSV of catalogue rows: Part Number, then the export fields. Units are in the header, never in the cells. */
export function toCsv(rows: CatalogueRowX[], fields: string[] = CATALOGUE_EXPORT_FIELDS, labelOf?: (key: string, raw: string) => string): string {
  const defs = fields.map((k) => compareFieldByKey(k)).filter((d): d is NonNullable<typeof d> => !!d)
  const head = ['Part Number', ...defs.map((d) => (d.unit ? `${d.label} (${d.unit})` : d.label))]
  const lines = rows.map((r) => [r.partNumber, ...defs.map((d) => { const v = fieldValue(r, d); return v != null && d.vocabularyId && labelOf ? labelOf(d.vocabularyId, String(v)) : v })].map(esc).join(','))
  return [head.map(esc).join(','), ...lines].join('\n') + '\n'
}

/** Trigger a browser download of text content. */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
