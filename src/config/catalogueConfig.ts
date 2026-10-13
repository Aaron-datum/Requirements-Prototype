/**
 * Parts Catalogue configuration: facets, the fields shown in the detail drawer and the compare views, and which of those
 * are administrative (shown, but never counted as a difference). Everything a tenant could change lives here, not in a
 * component. Values (statuses, tones) still come from the vocabularies in appConfig.ts via useVocab().
 */

import type { CatalogueRowX } from '../domain/catalogue'

export type FacetControl = 'text-search' | 'multi-tag' | 'multi-search' | 'level-seg' | 'range-units'
export type ValueSource = 'fields' | 'row' | 'plm'

export interface CatalogueFacetDef {
  /** Column key and URL facet key. */
  key: string
  label: string
  group: string
  control: FacetControl
  /** 'enum' facets hold a list of values (OR within the facet). 'range' holds [min, max] as strings ('' = open). 'text' is a contains match. */
  kind: 'enum' | 'range' | 'text'
  source: ValueSource
  /** Key inside the source record. */
  field: string
  unit?: string
  mono?: boolean
  /** Ordered values for level-seg (best to worst or small to large). */
  order?: string[]
  /** Vocabulary id: option labels and chip tones come from the tenant vocabulary. */
  vocabularyId?: string
  /** Offered in Add / Remove Columns but not on by default. */
  optional?: boolean
  /** Visible column by default. */
  defaultVisible?: boolean
  align?: 'left' | 'right'
  pinned?: boolean
}

export const CATALOGUE_FACETS: CatalogueFacetDef[] = [
  { key: 'pn', label: 'Part Number', group: 'Part', control: 'text-search', kind: 'text', source: 'row', field: 'partNumber', mono: true, pinned: true },
  { key: 'thread', label: 'Thread Size', group: 'Size', control: 'level-seg', kind: 'enum', source: 'fields', field: 'thread', mono: true, order: ['M6', 'M8', 'M10', 'M12', 'M16', 'M20', 'M24'] },
  { key: 'length', label: 'Length', group: 'Size', control: 'range-units', kind: 'range', source: 'fields', field: 'length', unit: 'mm', mono: true, align: 'right' },
  { key: 'head', label: 'Head Type', group: 'Head', control: 'multi-tag', kind: 'enum', source: 'fields', field: 'head' },
  { key: 'grade', label: 'Grade', group: 'Material', control: 'multi-tag', kind: 'enum', source: 'fields', field: 'grade', mono: true, defaultVisible: false, order: ['8.8', '10.9', '12.9', 'A2-70', 'A4-80'] },
  { key: 'material', label: 'Material', group: 'Material', control: 'multi-tag', kind: 'enum', source: 'fields', field: 'material' },
  { key: 'finish', label: 'Finish', group: 'Material', control: 'multi-tag', kind: 'enum', source: 'fields', field: 'finish', optional: true },
  { key: 'standard', label: 'Standard Compliance', group: 'Compliance', control: 'multi-tag', kind: 'enum', source: 'fields', field: 'standard', mono: true },
  { key: 'reuseStatus', label: 'Reuse Status', group: 'Sourcing', control: 'multi-tag', kind: 'enum', source: 'row', field: 'reuseStatus', vocabularyId: 'reuseStatus' },
  { key: 'source', label: 'Source', group: 'Sourcing', control: 'multi-tag', kind: 'enum', source: 'fields', field: 'source' },
  { key: 'supplier', label: 'Supplier', group: 'Sourcing', control: 'multi-search', kind: 'enum', source: 'fields', field: 'supplier', optional: true },
  { key: 'program', label: 'Program Usage', group: 'Sourcing', control: 'multi-search', kind: 'enum', source: 'plm', field: 'program', defaultVisible: false },
]

export const facetByKey = (key: string): CatalogueFacetDef | undefined => CATALOGUE_FACETS.find((f) => f.key === key)

/** A field shown in the drawer (Specification) and compared in both Compare forms. */
export interface CatalogueFieldDef {
  key: string
  label: string
  source: ValueSource
  unit?: string
  mono?: boolean
  vocabularyId?: string
}

/** Compared fields, in display order. Administrative ones are listed in `administrativeFields` below. */
export const CATALOGUE_COMPARE_FIELDS: CatalogueFieldDef[] = [
  { key: 'threadSpec', label: 'Thread', source: 'fields', mono: true },
  { key: 'length', label: 'Length', source: 'fields', unit: 'mm', mono: true },
  { key: 'head', label: 'Head type', source: 'fields' },
  { key: 'drive', label: 'Drive', source: 'fields', mono: true },
  { key: 'grade', label: 'Grade', source: 'fields', mono: true },
  { key: 'material', label: 'Material', source: 'fields' },
  { key: 'tensile', label: 'Tensile strength', source: 'fields', unit: 'MPa', mono: true },
  { key: 'standard', label: 'Standard', source: 'fields', mono: true },
  { key: 'finish', label: 'Finish', source: 'fields' },
  { key: 'pitchClass', label: 'Thread pitch', source: 'fields' },
  { key: 'shank', label: 'Shank', source: 'fields' },
  { key: 'corrosion', label: 'Corrosion class', source: 'fields', mono: true },
  { key: 'reuseStatus', label: 'Reuse status', source: 'row', vocabularyId: 'reuseStatus' },
  { key: 'leadTime', label: 'Lead time', source: 'fields', mono: true },
  { key: 'supplier', label: 'Supplier', source: 'fields' },
  // Administrative record fields: shown under All Fields, never counted as a difference.
  { key: 'source', label: 'Source', source: 'fields' },
  { key: 'plmId', label: 'PLM ID', source: 'fields', mono: true },
  { key: 'revision', label: 'Revision', source: 'fields', mono: true },
  { key: 'status', label: 'Status', source: 'plm', vocabularyId: 'releaseStatus' },
]

/**
 * Administrative fields: part of the record's bookkeeping rather than the part's engineering definition.
 * They are displayed in the compare table but excluded from the "N of M fields differ" count and from Differences Only.
 * (Decision log entry: docs/decisions/catalogue.md. The mock counted these, which inflated the number.)
 */
export const CATALOGUE_ADMINISTRATIVE_FIELDS: string[] = ['source', 'plmId', 'revision', 'status']

/** Fields listed in the drawer's Specification section (a subset of the compare fields, engineering definition only). */
export const CATALOGUE_SPEC_FIELDS: string[] = ['threadSpec', 'length', 'head', 'drive', 'grade', 'material', 'tensile', 'standard', 'finish', 'shank', 'corrosion']
/** Fields in the drawer's catalogue record block (not part of the PLM schema). */
export const CATALOGUE_RECORD_FIELDS: string[] = ['source', 'plmId', 'revision', 'owner', 'supplier', 'leadTime']
export const CATALOGUE_RECORD_LABELS: Record<string, string> = { owner: 'Owner' }

/** CSV export columns. Units live in the header, never mixed in a column. */
export const CATALOGUE_EXPORT_FIELDS: string[] = ['threadSpec', 'length', 'head', 'drive', 'grade', 'material', 'tensile', 'standard', 'finish', 'shank', 'corrosion', 'reuseStatus', 'leadTime', 'supplier', 'source', 'plmId', 'revision']

export const compareFieldByKey = (key: string): CatalogueFieldDef | undefined => CATALOGUE_COMPARE_FIELDS.find((f) => f.key === key)

/** Prototype-level catalogue settings. */
export const CATALOGUE_SETTINGS = {
  /** Data root: the node whose rows feed the table and facets. */
  dataRootId: 'bolts',
  /** Default table order (before the user sorts): ascending length. */
  defaultSortKey: 'length',
  /** Project the "Save View" action files the view under. */
  saveViewProjectId: 'p-civic-si',
}

/** The raw value of a facet for a part (shared by the search-index stub and the table columns). */
export function facetValue(row: CatalogueRowX, def: Pick<CatalogueFacetDef, 'source' | 'field'>): string | number | undefined {
  const rec = def.source === 'row' ? (row as unknown as Record<string, string | number>) : def.source === 'plm' ? row.plm : row.fields
  return rec[def.field]
}
