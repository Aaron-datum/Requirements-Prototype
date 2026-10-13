/**
 * The search query lives in the URL (docs/02 section 4): modality, file, active part and captured measurements.
 * "Search on" in a new tab, a saved search and a browser reload all reproduce the same state.
 *   /search/define?file=f21&modality=part-to-part&part=n3&m=area:f21-face-14:18250.4
 *   /search/results?file=...&modality=...&part=...&m=...   (plus t_results for table filters)
 *   /search/compare?query=<fileId>&result=<fileId>&file=...&modality=...&part=...&m=...
 * A workflow context (?ctx=...&ret=...) is carried through every step by withCtx.
 */
import type { CapturedMeasurement, SearchModality, SearchQuery } from '../../domain/types'
import type { WorkflowCtx } from '../../lib/workflowContext'
import { withCtx } from '../../lib/workflowContext'
import { isModality } from './modalities'

export interface SearchState {
  file: string
  modality: SearchModality
  part?: string
  measurements: CapturedMeasurement[]
  /** 'new' when the file came from New Search (modality is then fixed by the card). */
  src?: string
}

const DEFAULT_MODALITY: SearchModality = 'part-to-part'

export const encodeMeasurement = (m: CapturedMeasurement): string => `${m.typeKey}:${m.geometryRef}:${m.value}`
export function decodeMeasurements(values: string[]): CapturedMeasurement[] {
  return values.flatMap((raw, i) => {
    const [typeKey, geometryRef, value] = raw.split(':')
    const n = Number(value)
    return typeKey && geometryRef && Number.isFinite(n) ? [{ id: `m${i + 1}`, typeKey, geometryRef, value: n }] : []
  })
}

export function readState(params: URLSearchParams): SearchState {
  const m = params.get('modality')
  return {
    file: params.get('file') ?? params.get('query') ?? '',
    modality: isModality(m) ? m : DEFAULT_MODALITY,
    part: params.get('part') ?? undefined,
    measurements: decodeMeasurements(params.getAll('m')),
    src: params.get('src') ?? undefined,
  }
}

export const toQuery = (s: SearchState): SearchQuery => ({ modality: s.modality, fileId: s.file, activePartId: s.part, measurements: s.measurements })

function stateQuery(s: SearchState, extra: Record<string, string | undefined> = {}): string {
  const p = new URLSearchParams()
  p.set('file', s.file)
  p.set('modality', s.modality)
  if (s.part) p.set('part', s.part)
  if (s.src) p.set('src', s.src)
  Object.entries(extra).forEach(([k, v]) => { if (v) p.set(k, v) })
  s.measurements.forEach((m) => p.append('m', encodeMeasurement(m)))
  return p.toString()
}

export const filesHref = (modality?: SearchModality, ctx: WorkflowCtx | null = null): string => withCtx(`/search/files${modality ? `?modality=${modality}` : ''}`, ctx)
export const defineHref = (s: SearchState, ctx: WorkflowCtx | null = null): string => withCtx(`/search/define?${stateQuery(s)}`, ctx)
export const resultsHref = (s: SearchState, ctx: WorkflowCtx | null = null): string => withCtx(`/search/results?${stateQuery({ ...s, src: undefined })}`, ctx)
export const compareHref = (s: SearchState, queryFileId: string, resultFileId: string, ctx: WorkflowCtx | null = null): string =>
  withCtx(`/search/compare?${stateQuery({ ...s, src: undefined }, { query: queryFileId, result: resultFileId })}`, ctx)
