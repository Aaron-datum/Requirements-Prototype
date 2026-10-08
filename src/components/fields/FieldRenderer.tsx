import type { ReactNode } from 'react'
import { fieldByKey } from '../../config/appConfig'
import { useConfig, useVocab } from '../../config/useConfig'
import type { FieldDef } from '../../domain/types'
import { Badge } from '../ui'
import s from './FieldRenderer.module.css'

export type FieldValue = string | number | boolean | null | undefined

/** Format a single value according to its FieldDef. Numbers and units are mono; enums with a vocabulary become status chips. */
export function FieldValueView({ def, value }: { def: FieldDef; value: FieldValue }) {
  const vocab = useVocab()
  if (value == null || value === '') return <span className="muted">—</span>
  if (def.vocabularyId) {
    const r = vocab.resolve(def.vocabularyId, value)
    return <Badge tone={r.tone} title={r.known ? undefined : 'Unknown value shown as received'}>{r.label}</Badge>
  }
  if (def.type === 'number') return <span className="data">{value}{def.unit ? <span className="muted"> {def.unit}</span> : null}</span>
  if (def.type === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>
  if (def.type === 'date') return <span className="data">{String(value).slice(0, 10)}</span>
  return <span>{String(value)}</span>
}

/**
 * Schema-driven field renderer. Given a record keyed by FieldDef.key it renders every field the active SchemaConfig
 * lists (optionally limited to a group or an explicit key list). Switching tenant in Settings changes labels, groups,
 * vocabulary lookups and tones with no code change. Fields missing from the active schema are not rendered.
 */
export function FieldRenderer({ record, keys, group, layout = 'list', onlyDetail = true, emptyText = 'No PLM record for this file.' }: {
  record: Record<string, FieldValue> | undefined; keys?: string[]; group?: string; layout?: 'list' | 'grid'; onlyDetail?: boolean; emptyText?: string
}): ReactNode {
  const config = useConfig()
  if (!record || Object.keys(record).length === 0) return <div className="muted">{emptyText}</div>
  const defs = (keys ? keys.map((k) => fieldByKey(config, k)).filter((d): d is FieldDef => !!d) : config.schema.fields)
    .filter((d) => (group ? d.group === group : true) && (keys || !onlyDetail || d.showInDetail))
  return (
    <dl className={layout === 'grid' ? s.grid : s.list}>
      {defs.map((d) => (
        <div key={d.key} className={s.item}>
          <dt>{d.label}</dt>
          <dd><FieldValueView def={d} value={record[d.key]} /></dd>
        </div>
      ))}
    </dl>
  )
}

/** Renders one FieldRenderer section per schema group, with a heading. */
export function FieldGroups({ record, emptyText }: { record: Record<string, FieldValue> | undefined; emptyText?: string }) {
  const config = useConfig()
  const groups = [...new Set(config.schema.fields.filter((f) => f.showInDetail).map((f) => f.group ?? 'Other'))]
  if (!record || Object.keys(record).length === 0) return <div className="muted">{emptyText ?? 'No PLM record for this file.'}</div>
  return (
    <div className={s.groups}>
      {groups.map((g) => (
        <section key={g}>
          <h3 className="text-label-caps">{g}</h3>
          <FieldRenderer record={record} group={g} />
        </section>
      ))}
    </div>
  )
}
