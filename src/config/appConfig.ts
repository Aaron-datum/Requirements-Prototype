/**
 * App configuration: schemas, vocabularies, bands, thresholds and labels.
 * Everything a tenant or data source can change lives here. Components never compare against a status string:
 * they call resolveValue(config, vocabularyId, raw). Unknown raw values render as raw text with a neutral tone.
 * Two tenant profiles ship (Company A, Adient-like; Company B, deliberately different) to prove configurability.
 */
import type { FieldDef, SchemaConfig, SimilarityBand, StatusVocabulary } from '../domain/types'
import type { AppConfigFull, ResolvedValue } from '../domain/extra'

/* -------------------------------- Company A ------------------------------ */

const FIELDS_A: FieldDef[] = [
  { key: 'program', label: 'Program', type: 'enum', group: 'Program', filter: 'multi-search', showInDetail: true, columnEligible: true },
  { key: 'modelYear', label: 'Model Year', type: 'enum', group: 'Program', filter: 'multi-tag', showInDetail: true, columnEligible: true },
  { key: 'programType', label: 'Program Type', type: 'enum', group: 'Program', filter: 'multi-tag', showInDetail: true, columnEligible: true },
  { key: 'customerGroup', label: 'Customer Group', type: 'enum', group: 'Program', filter: 'multi-search', showInDetail: true, columnEligible: true },
  { key: 'region', label: 'Region', type: 'enum', group: 'Program', filter: 'multi-tag', showInDetail: true, columnEligible: true },
  { key: 'productGroup', label: 'Product Group', type: 'enum', group: 'Product', filter: 'multi-search', showInDetail: true, columnEligible: true },
  { key: 'productLine', label: 'Product Line', type: 'enum', group: 'Product', filter: 'multi-search', showInDetail: true, columnEligible: true },
  { key: 'calcWeight', label: 'Calc Weight', type: 'number', unit: 'kg', group: 'Product', filter: 'range-units', showInDetail: true, columnEligible: true },
  { key: 'releaseStatus', label: 'Release Status', type: 'enum', group: 'Lifecycle', filter: 'multi-tag', vocabularyId: 'releaseStatus', showInDetail: true, columnEligible: true },
  { key: 'lifecycleState', label: 'Lifecycle State', type: 'enum', group: 'Lifecycle', filter: 'multi-tag', vocabularyId: 'lifecycleState', showInDetail: true, columnEligible: true },
  { key: 'releasedDate', label: 'Released Date', type: 'date', group: 'Lifecycle', filter: 'date-preset', showInDetail: true, columnEligible: true },
]
export const SCHEMA_A: SchemaConfig = { id: 'company-a', label: 'Company A · Adient-like', fields: FIELDS_A }

const VOCAB_A: StatusVocabulary[] = [
  { id: 'reuseStatus', values: [
    { raw: 'Preferred', label: 'Preferred', tone: 'pass' }, { raw: 'Approved', label: 'Approved', tone: 'info' },
    { raw: 'Restricted', label: 'Restricted', tone: 'warn' }, { raw: 'Review', label: 'Review', tone: 'warn' }, { raw: 'Obsolete', label: 'Obsolete', tone: 'fail' } ] },
  { id: 'releaseStatus', values: [
    { raw: 'Released', label: 'Released', tone: 'pass' }, { raw: 'id1055', label: 'Released', tone: 'pass' }, { raw: 'In Review', label: 'In Review', tone: 'info' },
    { raw: 'WIP', label: 'WIP', tone: 'warn' }, { raw: 'Obsolete', label: 'Obsolete', tone: 'fail' } ] },
  { id: 'lifecycleState', values: [
    { raw: 'Released', label: 'Released', tone: 'pass' }, { raw: 'Frozen', label: 'Frozen', tone: 'info' }, { raw: 'In Work', label: 'In Work', tone: 'warn' }, { raw: 'Superseded', label: 'Superseded', tone: 'fail' } ] },
  { id: 'conformanceState', values: [
    { raw: 'Undetermined', label: 'Undetermined', tone: 'warn' }, { raw: 'Gap', label: 'Gap', tone: 'fail' }, { raw: 'Evaluated Elsewhere', label: 'Evaluated Elsewhere', tone: 'info' },
    { raw: 'No Gap', label: 'No Gap', tone: 'pass' }, { raw: 'Not Applicable', label: 'Not Applicable', tone: 'neutral' } ] },
  // D-02: the five certainty tiers are example values of the data-type dimension.
  { id: 'dataType', values: [
    { raw: 'Actual', label: 'Actual', tone: 'pass', description: 'Geometric duplicate of a production part, or quoted' },
    { raw: 'Surrogate', label: 'Surrogate', tone: 'info', description: 'Best computed match to a production part. Not a replacement.' },
    { raw: 'Estimated', label: 'Estimated', tone: 'warn', description: 'Weak or no usable match, or no CAD. Priced from a cost model.' },
    { raw: 'Estimate', label: 'Estimate', tone: 'warn' },
    { raw: 'No match', label: 'No match', tone: 'fail', description: 'Nothing above threshold' },
    { raw: 'Search failed', label: 'Search failed', tone: 'fail', description: 'Process failure, for example an unreadable part body' } ] },
  { id: 'workflowApproval', values: [
    { raw: 'Review required', label: 'Review required', tone: 'warn' }, { raw: 'Confirmed', label: 'Confirmed', tone: 'pass' } ] },
  { id: 'textStatus', values: [
    { raw: 'New', label: 'New', tone: 'info' }, { raw: 'Changed', label: 'Changed', tone: 'warn' }, { raw: 'Unchanged', label: 'Unchanged', tone: 'neutral' } ] },
  { id: 'severity', values: [
    { raw: 'Critical', label: 'Critical', tone: 'fail' }, { raw: 'High', label: 'High', tone: 'warn' }, { raw: 'Medium', label: 'Medium', tone: 'info' }, { raw: 'Low', label: 'Low', tone: 'neutral' } ] },
  { id: 'testResult', values: [
    { raw: 'Pass', label: 'Pass', tone: 'pass' }, { raw: 'Fail', label: 'Fail', tone: 'fail' }, { raw: 'Carried', label: 'Carried', tone: 'info' },
    { raw: 'Scheduled', label: 'Scheduled', tone: 'neutral' }, { raw: 'In progress', label: 'In progress', tone: 'warn' } ] },
  { id: 'sourceType', values: [
    { raw: 'RFQ', label: 'RFQ', tone: 'neutral' }, { raw: 'Carryover', label: 'Carryover', tone: 'neutral' }, { raw: 'OEM Spec', label: 'OEM Spec', tone: 'neutral' },
    { raw: 'Internal', label: 'Internal', tone: 'neutral' }, { raw: 'Supplier', label: 'Supplier', tone: 'neutral' } ] },
]

/* -------------------------------- Company B ------------------------------ */
// Same underlying records, different presentation: fields renamed ("Vehicle line", "Maturity"), two dropped
// (Customer Group, Product Group), one added (numeric Supplier lead time with a range filter), opaque IDs
// resolved through the vocabulary, different tones, shortened data-type vocabulary.

const FIELDS_B: FieldDef[] = [
  { key: 'program', label: 'Vehicle line', type: 'enum', group: 'Vehicle', filter: 'multi-search', showInDetail: true, columnEligible: true },
  { key: 'modelYear', label: 'MY', type: 'enum', group: 'Vehicle', filter: 'multi-tag', showInDetail: true, columnEligible: true },
  { key: 'programType', label: 'Powertrain', type: 'enum', group: 'Vehicle', filter: 'multi-tag', showInDetail: true, columnEligible: true },
  { key: 'region', label: 'Market', type: 'enum', group: 'Vehicle', filter: 'multi-tag', showInDetail: true, columnEligible: true },
  { key: 'productLine', label: 'Family', type: 'enum', group: 'Part', filter: 'multi-search', showInDetail: true, columnEligible: true },
  { key: 'calcWeight', label: 'Mass', type: 'number', unit: 'kg', group: 'Part', filter: 'range-units', showInDetail: true, columnEligible: true },
  { key: 'supplierLeadTime', label: 'Supplier lead time', type: 'number', unit: 'wk', group: 'Part', filter: 'range-units', showInDetail: true, columnEligible: true },
  { key: 'releaseStatus', label: 'Maturity', type: 'enum', group: 'Status', filter: 'multi-tag', vocabularyId: 'releaseStatus', showInDetail: true, columnEligible: true },
  { key: 'lifecycleState', label: 'Phase', type: 'enum', group: 'Status', filter: 'multi-tag', vocabularyId: 'lifecycleState', showInDetail: true, columnEligible: true },
]
export const SCHEMA_B: SchemaConfig = { id: 'company-b', label: 'Company B · renamed fields', fields: FIELDS_B }

const VOCAB_B: StatusVocabulary[] = [
  { id: 'reuseStatus', values: [
    { raw: 'Preferred', label: 'Gold', tone: 'info' }, { raw: 'Approved', label: 'OK', tone: 'pass' }, { raw: 'Restricted', label: 'Limited', tone: 'warn' },
    { raw: 'Review', label: 'Check', tone: 'warn' }, { raw: 'Obsolete', label: 'Retired', tone: 'neutral' } ] },
  { id: 'releaseStatus', values: [
    { raw: 'Released', label: 'Approved for use', tone: 'info' }, { raw: 'id1055', label: 'Approved for use', tone: 'info' }, { raw: 'In Review', label: 'Pending', tone: 'warn' },
    { raw: 'WIP', label: 'Draft', tone: 'neutral' }, { raw: 'Obsolete', label: 'Retired', tone: 'neutral' } ] },
  { id: 'lifecycleState', values: [
    { raw: 'Released', label: 'Production', tone: 'info' }, { raw: 'Frozen', label: 'Locked', tone: 'neutral' }, { raw: 'In Work', label: 'Design', tone: 'warn' }, { raw: 'Superseded', label: 'Replaced', tone: 'neutral' } ] },
  { id: 'conformanceState', values: [
    { raw: 'Undetermined', label: 'Open', tone: 'warn' }, { raw: 'Gap', label: 'Not met', tone: 'fail' }, { raw: 'Evaluated Elsewhere', label: 'Covered elsewhere', tone: 'info' },
    { raw: 'No Gap', label: 'Met', tone: 'pass' }, { raw: 'Not Applicable', label: 'N/A', tone: 'neutral' } ] },
  { id: 'dataType', values: [
    { raw: 'Actual', label: 'Act', tone: 'info', description: 'Actual' }, { raw: 'Surrogate', label: 'Sur', tone: 'neutral', description: 'Surrogate' },
    { raw: 'Estimated', label: 'Est', tone: 'warn', description: 'Estimated' }, { raw: 'Estimate', label: 'Est', tone: 'warn' },
    { raw: 'No match', label: 'None', tone: 'fail', description: 'No match' }, { raw: 'Search failed', label: 'Failed', tone: 'fail', description: 'Search failed' } ] },
  { id: 'workflowApproval', values: [
    { raw: 'Review required', label: 'Needs sign-off', tone: 'warn' }, { raw: 'Confirmed', label: 'Signed off', tone: 'info' } ] },
  { id: 'textStatus', values: [
    { raw: 'New', label: 'Added', tone: 'info' }, { raw: 'Changed', label: 'Revised', tone: 'warn' }, { raw: 'Unchanged', label: 'Same', tone: 'neutral' } ] },
  { id: 'severity', values: [
    { raw: 'Critical', label: 'S1', tone: 'fail' }, { raw: 'High', label: 'S2', tone: 'warn' }, { raw: 'Medium', label: 'S3', tone: 'neutral' }, { raw: 'Low', label: 'S4', tone: 'neutral' } ] },
  { id: 'testResult', values: [
    { raw: 'Pass', label: 'Pass', tone: 'pass' }, { raw: 'Fail', label: 'Fail', tone: 'fail' }, { raw: 'Carried', label: 'Reused', tone: 'neutral' },
    { raw: 'Scheduled', label: 'Planned', tone: 'neutral' }, { raw: 'In progress', label: 'Running', tone: 'warn' } ] },
  { id: 'sourceType', values: [
    { raw: 'RFQ', label: 'RFQ', tone: 'neutral' }, { raw: 'Carryover', label: 'Carried', tone: 'neutral' }, { raw: 'OEM Spec', label: 'OEM', tone: 'neutral' } ] },
]

/* ------------------------------- shared config --------------------------- */

// D-05: cutoffs are example values, editable here.
export const SIMILARITY_BANDS: SimilarityBand[] = [
  { label: 'High', min: 85, tone: 'pass' },
  { label: 'Medium', min: 70, tone: 'info' },
  { label: 'Low', min: 0, tone: 'warn' },
]

export interface TenantProfile { id: string; label: string; schema: SchemaConfig; vocabularies: StatusVocabulary[]; tenantLabel?: string; requirementTableLabel: string }
export const TENANTS: Record<string, TenantProfile> = {
  'company-a': { id: 'company-a', label: 'Company A · Adient-like', schema: SCHEMA_A, vocabularies: VOCAB_A, tenantLabel: 'Adient', requirementTableLabel: 'TDM' },
  'company-b': { id: 'company-b', label: 'Company B · renamed fields', schema: SCHEMA_B, vocabularies: VOCAB_B, tenantLabel: 'Northwind', requirementTableLabel: 'Requirement table' },
}
export const DEFAULT_TENANT = 'company-a'

export function buildAppConfig(tenantId: string = DEFAULT_TENANT, planLabel: AppConfigFull['planLabel'] = 'Test plan'): AppConfigFull {
  const t = TENANTS[tenantId] ?? TENANTS[DEFAULT_TENANT]!
  return {
    tenantId: t.id,
    schema: t.schema,
    vocabularies: t.vocabularies,
    similarityBands: SIMILARITY_BANDS,
    limits: { maxMeasurements: 5, maxExtraColumns: 3 },
    tenantLabel: t.tenantLabel,
    requirementTableLabel: t.requirementTableLabel,
    planLabel,
    matchRules: {
      noSimilarityTypes: ['No match', 'Search failed'],
      retryTypes: ['Search failed'],
      approval: { pendingRaw: 'Review required', confirmedRaw: 'Confirmed' },
      changedRaw: ['Changed', 'New'],
      assertedOrigins: ['user-supplied', 'manual'],
    },
    thresholds: { surrogateFloor: 58, estimatedFloor: 55, testMatchFloor: 50, autoAcceptAt: 90, evidenceFloor: 50 },
    currentUser: { id: 'u-aaron', name: 'Aaron Keller', email: 'aaron@datum.co', initials: 'AK' },
    acceptedFormats: ['CATPart', 'CATProduct', 'STEP', 'SolidWorks'],
  }
}

/* -------------------------------- resolvers ------------------------------ */

/** Look a raw value up in a vocabulary. Unknown values fall back to the raw string with a neutral tone. */
export function resolveValue(config: Pick<AppConfigFull, 'vocabularies'>, vocabularyId: string, raw: string | number | boolean | null | undefined): ResolvedValue {
  const text = raw == null ? '' : String(raw)
  const vocab = config.vocabularies.find((v) => v.id === vocabularyId)
  const hit = vocab?.values.find((v) => v.raw === text)
  if (hit) return { raw: text, label: hit.label, tone: hit.tone, description: hit.description, known: true }
  return { raw: text, label: text, tone: 'neutral', known: false }
}

export function similarityBand(config: Pick<AppConfigFull, 'similarityBands'>, percent: number): SimilarityBand {
  const sorted = [...config.similarityBands].sort((a, b) => b.min - a.min)
  return sorted.find((b) => percent >= b.min) ?? sorted[sorted.length - 1]!
}

export const fieldByKey = (config: Pick<AppConfigFull, 'schema'>, key: string): FieldDef | undefined => config.schema.fields.find((f) => f.key === key)
