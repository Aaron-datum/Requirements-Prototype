import { WORKFLOWS } from '../../../config/workflows'
import { searchOnHref, withCtx, type WorkflowCtx } from '../../../lib/workflowContext'

/** Where BOM review returns to after a decision in the Search area. Carries the selected line and tab (deep link). */
export const reviewHref = (lineId?: string | null, tab?: string): string => `/create/bom/03-review${lineId ? `?line=${encodeURIComponent(lineId)}${tab ? `&tab=${tab}` : ''}` : ''}`

/** The bom-review workflow context for a line: ?ctx=bom-review:<bom_line_id>&ret=<returnTo>. */
export const bomCtx = (lineId: string): WorkflowCtx => ({ workflowId: 'bom-review', subject: lineId, returnTo: reviewHref(lineId, 'similarity'), def: WORKFLOWS['bom-review']! })

/** "Search on": opens a new search with the part active, in a NEW TAB (callers use target="_blank"). The file id is the part number. */
export const searchOnLink = (partNumber: string, lineId: string): string => searchOnHref(partNumber, bomCtx(lineId))
/** Same-tab path to the Search area with the same workflow context ("Find a surrogate"). */
export const findSurrogateLink = (partNumber: string, lineId: string): string => withCtx(`/search/define?file=${encodeURIComponent(partNumber)}&modality=part-to-part`, bomCtx(lineId))
