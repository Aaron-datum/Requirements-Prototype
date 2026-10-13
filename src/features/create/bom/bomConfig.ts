/**
 * BOM and cost configuration: the pipeline, vocabularies that belong to this area, labels and presets.
 * Kept in this feature (not in config/appConfig.ts) so parallel phases do not collide; the vocabularies below are merged with the
 * active tenant's vocabularies by useBomVocab(), so a tenant can still relabel or retone every value (both profiles ship).
 */
import { useMemo } from 'react'
import { resolveValue } from '../../../config/appConfig'
import { useConfig } from '../../../config/useConfig'
import type { ResolvedValue } from '../../../domain/extra'
import type { StatusVocabulary } from '../../../domain/types'

export type StepKey = '01-intake' | '02-tree' | '03-review' | '03b-compare' | '03d-cost' | '04-composition'
export const BOM_STEPS: StepKey[] = ['01-intake', '02-tree', '03-review', '03b-compare', '03d-cost', '04-composition']
export const isStepKey = (s: string | undefined): s is StepKey => !!s && (BOM_STEPS as string[]).includes(s)

export interface PipelineStepDef { key: string; num: string; label: string; area: 'bom' | 'requirements'; subs?: Array<{ key: StepKey; label: string; num: string }> }
/** The seven-step Create pipeline. 01 to 04 are built by the BOM area; 05 to 07 link into the requirements area. */
export const PIPELINE: PipelineStepDef[] = [
  { key: '01-intake', num: '01', label: 'RFQ intake', area: 'bom' },
  { key: '02-tree', num: '02', label: 'Assembly tree', area: 'bom' },
  { key: '03-review', num: '03', label: 'BOM review', area: 'bom', subs: [{ key: '03b-compare', num: '03b', label: 'Compare parts' }, { key: '03d-cost', num: '03d', label: 'Cost estimate' }] },
  { key: '04-composition', num: '04', label: 'Program composition', area: 'bom' },
  { key: '05-mapping', num: '05', label: 'Requirement mapping', area: 'requirements' },
  { key: '06-carryover', num: '06', label: 'Carryover review', area: 'requirements' },
  { key: '07-approve', num: '07', label: 'Approve plan', area: 'requirements' },
]
export const stepHref = (step: PipelineStepDef | { key: string; area: 'bom' | 'requirements' }): string => `/create/${step.area === 'bom' ? 'bom' : 'requirements'}/${step.key}`
export const familyOf = (step: StepKey): string => (step === '03b-compare' || step === '03d-cost' ? '03-review' : step)
export const STEP_TITLE: Record<StepKey, string> = {
  '01-intake': 'RFQ intake', '02-tree': 'Assembly tree', '03-review': 'BOM review', '03b-compare': 'Compare parts', '03d-cost': 'Cost estimate', '04-composition': 'Program composition',
}

/** Where steps 05 to 07 live (owned by the requirements area). */
export const REQ_LINKS = { mapping: '/create/requirements/05-mapping', carryover: '/create/requirements/06-carryover', trace: (reqId: string) => `/create/requirements/03c-trace?req=${encodeURIComponent(reqId)}` }

/** Vocabularies for this area, per tenant profile. Values are what the derive layer and fixtures emit. */
const A: StatusVocabulary[] = [
  { id: 'rfqRoute', values: [
    { raw: 'cad-bom', label: 'CAD → BOM', tone: 'info' }, { raw: 'requirements', label: 'Requirements', tone: 'info' },
    { raw: 'columns', label: 'Columns', tone: 'pass' }, { raw: 'kept', label: 'Kept on file', tone: 'neutral' } ] },
  { id: 'inputMaturity', values: [
    { raw: 'Have', label: 'Have', tone: 'pass' }, { raw: 'Via surrogate', label: 'Via surrogate', tone: 'warn' },
    { raw: 'Missing', label: 'Missing', tone: 'fail' }, { raw: 'Not needed', label: 'Not needed', tone: 'neutral' } ] },
  { id: 'traceTag', values: [
    { raw: 'CAD features', label: 'CAD features', tone: 'info' }, { raw: 'PLM or contract', label: 'PLM or contract', tone: 'pass' },
    { raw: 'Live feed', label: 'Live feed', tone: 'pass' }, { raw: 'Assumed', label: 'Assumed', tone: 'warn' }, { raw: 'Computed', label: 'Computed', tone: 'neutral' } ] },
  { id: 'costTag', values: [
    { raw: 'PLM', label: 'PLM', tone: 'neutral' }, { raw: 'Surrogate', label: 'Surrogate', tone: 'neutral' }, { raw: 'CAD features', label: 'CAD features', tone: 'neutral' },
    { raw: 'RFQ', label: 'RFQ', tone: 'neutral' }, { raw: 'Inputs', label: 'Inputs', tone: 'neutral' } ] },
  { id: 'routingStatus', values: [
    { raw: 'Suggested - not yet confirmed', label: 'Suggested · not yet confirmed', tone: 'warn' }, { raw: 'Confirmed', label: 'Confirmed', tone: 'pass' },
    { raw: 'Overridden', label: 'Overridden', tone: 'info' }, { raw: 'Supplier quote on file', label: 'Supplier quote on file', tone: 'pass' } ] },
  { id: 'agentAction', values: [
    { raw: 'carry-forward', label: 'Carry forward', tone: 'pass', description: 'The agent carries this line into the BOM and plan without stopping.' },
    { raw: 'propose', label: 'Propose', tone: 'info', description: 'The agent proposes. A person confirms; never finalised silently.' },
    { raw: 'ask-human', label: 'Ask a person', tone: 'warn', description: 'Always routed to a person.' } ] },
  { id: 'cadFlag', values: [{ raw: 'has-cad', label: 'Has CAD', tone: 'pass' }, { raw: 'no-cad', label: 'No CAD', tone: 'neutral' }] },
  { id: 'resolution', values: [{ raw: 'resolved', label: 'Resolved', tone: 'pass' }, { raw: 'unresolved', label: 'Unresolved', tone: 'warn' }] },
]
const B: StatusVocabulary[] = [
  { id: 'rfqRoute', values: [
    { raw: 'cad-bom', label: 'To BOM', tone: 'info' }, { raw: 'requirements', label: 'To requirements', tone: 'info' },
    { raw: 'columns', label: 'Template columns', tone: 'pass' }, { raw: 'kept', label: 'Archive', tone: 'neutral' } ] },
  { id: 'inputMaturity', values: [
    { raw: 'Have', label: 'Available', tone: 'info' }, { raw: 'Via surrogate', label: 'Borrowed', tone: 'warn' },
    { raw: 'Missing', label: 'Gap', tone: 'fail' }, { raw: 'Not needed', label: 'N/A', tone: 'neutral' } ] },
  { id: 'traceTag', values: [
    { raw: 'CAD features', label: 'Geometry', tone: 'info' }, { raw: 'PLM or contract', label: 'Contract', tone: 'info' },
    { raw: 'Live feed', label: 'Feed', tone: 'info' }, { raw: 'Assumed', label: 'Guess', tone: 'warn' }, { raw: 'Computed', label: 'Calc', tone: 'neutral' } ] },
  { id: 'costTag', values: [
    { raw: 'PLM', label: 'PLM', tone: 'neutral' }, { raw: 'Surrogate', label: 'Similar part', tone: 'neutral' }, { raw: 'CAD features', label: 'Geometry', tone: 'neutral' },
    { raw: 'RFQ', label: 'RFQ', tone: 'neutral' }, { raw: 'Inputs', label: 'Inputs', tone: 'neutral' } ] },
  { id: 'routingStatus', values: [
    { raw: 'Suggested - not yet confirmed', label: 'Proposed', tone: 'warn' }, { raw: 'Confirmed', label: 'Signed off', tone: 'info' },
    { raw: 'Overridden', label: 'Replaced', tone: 'neutral' }, { raw: 'Supplier quote on file', label: 'Quoted', tone: 'info' } ] },
  { id: 'agentAction', values: [
    { raw: 'carry-forward', label: 'Auto-carry', tone: 'info', description: 'Carried forward without stopping.' },
    { raw: 'propose', label: 'Suggest', tone: 'neutral', description: 'Suggested; a person confirms.' },
    { raw: 'ask-human', label: 'Needs a person', tone: 'warn', description: 'Always routed to a person.' } ] },
  { id: 'cadFlag', values: [{ raw: 'has-cad', label: 'CAD present', tone: 'info' }, { raw: 'no-cad', label: 'No CAD', tone: 'neutral' }] },
  { id: 'resolution', values: [{ raw: 'resolved', label: 'Done', tone: 'info' }, { raw: 'unresolved', label: 'Open', tone: 'warn' }] },
]
export const BOM_VOCABS: Record<string, StatusVocabulary[]> = { 'company-a': A, 'company-b': B }

/** Resolve a value from this area's vocabularies first, then the tenant's. Unknown raw values render as received with a neutral tone. */
export function useBomVocab() {
  const config = useConfig()
  return useMemo(() => {
    const own = BOM_VOCABS[config.tenantId] ?? A
    const vocabularies = [...own, ...config.vocabularies]
    return { resolve: (id: string, raw: string | number | boolean | null | undefined): ResolvedValue => resolveValue({ vocabularies }, id, raw) }
  }, [config])
}

/** Canonical BOM table columns, by group (docs/01: 03). Always on: Identity. "Additional" is hidden by default. */
export const COLUMN_GROUPS = ['Identity', 'Cost', 'Sourcing', 'Manufacture', 'Additional'] as const
export const BOM_TABLE_ID = 'bom-review'
export const REVIEW_TABS = [{ key: 'summary', label: 'Summary' }, { key: 'similarity', label: 'Similarity' }, { key: 'costing', label: 'Costing' }, { key: 'plm', label: 'PLM' }] as const
export type ReviewTab = (typeof REVIEW_TABS)[number]['key']
export const isReviewTab = (t: string | null): t is ReviewTab => !!t && REVIEW_TABS.some((x) => x.key === t)

/** Saved views of the BOM table (docs/01 example names). Filters are keyed by column key; visible lists the optional columns shown. */
export interface BomViewPreset { name: string; filters: Record<string, { values?: string[]; min?: number | null; max?: number | null }>; visible: string[] }
const ALWAYS_ON = ['name', 'partNumber', 'quantity']
export const BOM_VIEWS: BomViewPreset[] = [
  { name: 'Costing review', filters: {}, visible: [...ALWAYS_ON, 'price', 'priceSource', 'currency', 'certainty', 'extPrice'] },
  { name: 'Sourcing risk', filters: { certainty: { values: ['Surrogate', 'Estimated', 'No match', 'Search failed'] } }, visible: [...ALWAYS_ON, 'certainty', 'supplier', 'region', 'method', 'leadTime'] },
  { name: 'Unresolved only', filters: { resolution: { values: ['unresolved'] } }, visible: [...ALWAYS_ON, 'certainty', 'price', 'supplier', 'resolution'] },
]

/** Composition cards. Titles and notes are example copy; button copy follows config.planLabel. */
export const COMPOSITION_CARDS = [
  { id: 'new' as const, title: 'New', tone: 'info' as const, note: 'New geometry, so requirements need tests. Surrogates can lend evidence to unchanged requirements.', action: 'generate' as const, href: REQ_LINKS.mapping },
  { id: 'carryover' as const, title: 'Carryover', tone: 'pass' as const, note: 'In production today. Requirements lean Evaluated Elsewhere; interface changes are flagged.', action: 'carryover' as const, href: REQ_LINKS.carryover },
  { id: 'uncertain' as const, title: 'Uncertain', tone: 'warn' as const, note: 'No resolved match. Requirements stay Undetermined until you link evidence, upload proof, or move them to Gap.', action: 'resolve' as const, href: REQ_LINKS.carryover },
]
export const COMPOSITION_RULE = 'A Carryover line pre-sets its requirements to Text · Unchanged and leans them toward Evaluated Elsewhere. The lean is a proposal, not an inherited state. Anything whose interface changed is flagged for review.'

export const titleCase = (s: string): string => s.replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase())
export const money = (n: number | null | undefined, digits = 2): string => (n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`)
export const signedMoney = (n: number): string => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money(Math.abs(n))}`
