/**
 * Dataset semantics, in one place. These are raw values from data/*.json that the derive layer needs to reason about
 * (test run results, requirement states). They are NOT display labels: screens render through vocabularies in AppConfig.
 */
export const RUN = { pass: 'Pass', carried: 'Carried', open: ['Scheduled', 'In progress'] as readonly string[] }
export const REQ_STATE = { new: 'New', changed: 'Changed', unchanged: 'Unchanged' }
export const MATCH_TYPE = { duplicate: 'duplicate', surrogate: 'surrogate', estimated: 'estimated', new: 'new' } as const
/** The five similarity dimensions of the surrogate breakdown (the tool contract of the sealed engine). */
export const SIMILARITY_DIMENSIONS = [
  { key: 'geometry', label: 'Geometry' },
  { key: 'manufacture_complexity', label: 'Manufacture complexity' },
  { key: 'material', label: 'Material' },
  { key: 'supplier_location', label: 'Supplier / location' },
  { key: 'order_of_magnitude', label: 'Order of magnitude' },
] as const
