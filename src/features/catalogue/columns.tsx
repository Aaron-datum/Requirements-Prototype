import { useMemo } from 'react'
import { Badge } from '../../components/ui'
import type { ColumnDef, Raw } from '../../components/table/types'
import { CATALOGUE_FACETS, facetValue } from '../../config/catalogueConfig'
import { useVocab } from '../../config/useConfig'
import type { CatalogueRowX } from '../../domain/catalogue'

/**
 * Table columns and their filters, built from the facet config (src/config/catalogueConfig.ts). One definition drives the
 * column, its sidebar filter (control chosen by data type) and the Columns tab. Reuse Status labels and tones come from the vocabulary.
 */
export function useCatalogueColumns(): Array<ColumnDef<CatalogueRowX>> {
  const vocab = useVocab()
  return useMemo(() => CATALOGUE_FACETS.map((d): ColumnDef<CatalogueRowX> => {
    const col: ColumnDef<CatalogueRowX> = {
      key: d.key, label: d.label, group: d.group, filter: d.control, order: d.order, unit: d.unit, align: d.align, pinned: d.pinned, optional: d.optional, defaultVisible: d.defaultVisible,
      get: (r) => facetValue(r, d) as Raw,
      label_of: d.vocabularyId ? (raw) => vocab.resolve(d.vocabularyId!, raw).label : undefined,
    }
    if (d.key === 'pn') col.render = (r) => <span className="data" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{r.partNumber}</span>
    else if (d.key === 'thread') col.render = (r) => <span className="data">{String(r.fields.threadSpec ?? r.fields.thread)}</span>
    else if (d.key === 'length') col.render = (r) => <span className="data">{r.fields.length} mm</span>
    else if (d.vocabularyId) col.render = (r) => { const v = vocab.resolve(d.vocabularyId!, facetValue(r, d)); return <Badge tone={v.tone}>{v.label}</Badge> }
    else if (d.mono) col.render = (r) => <span className="data">{String(facetValue(r, d) ?? '')}</span>
    return col
  }), [vocab])
}
