/**
 * Fixtures and rules for Home and the Projects dashboard (StubId: dashboard-services).
 * All fake. Rules are config objects, not code: change a value here and the dashboard follows.
 */
import type { StatusVocabulary } from '../../../domain/types'

/* ------------------------------ Scopes and outputs ------------------------------ */

export type OutputGroup = 'bom' | 'tests'
export interface ActionLink { label: string; to: string }
export interface OutputDef {
  id: string
  /** `{plan}` is replaced with AppConfig.planLabel. */
  name: string
  group: OutputGroup
  kind: string
  /** Due date inherited by every action row of this output (the scope's deadline). */
  due: string
  updated: string
  uploaded: string[]
  missing: string[]
  /** Primary action of each action box when this output is the scope. */
  actions: { urgent: ActionLink; review: ActionLink; resume: ActionLink }
}

const BOM_ACTIONS = { urgent: { label: 'Resolve Estimated and No Match Lines', to: '/create/bom/03' }, review: { label: 'Review Surrogates', to: '/create/bom/03' }, resume: { label: 'Continue in BOM Review', to: '/create/bom/03' } }
const TEST_ACTIONS = { urgent: { label: 'Review Carryover', to: '/create/requirements/06' }, review: { label: 'Review Test Mapping', to: '/create/requirements/05' }, resume: { label: 'Continue in Carryover Review', to: '/create/requirements/06' } }

export const CIVIC_PROJECT_ID = 'p-civic-si'
export const PROJECT_DUE = '2026-11-20'

export const CIVIC_OUTPUTS: OutputDef[] = [
  { id: 'bom-si', name: 'Civic Si 1.5T BOM', group: 'bom', kind: 'BOM', due: '2026-10-30', updated: '2026-10-07', uploaded: ['RFQ package RFQ-26-0512', 'CAD assemblies (twin-scroll turbo set)', 'Supplier quote sheet'], missing: ['CAD for ELEC-925-C', '2D drawing for INT-510-C'], actions: BOM_ACTIONS },
  { id: 'cost-si', name: 'Cost estimate', group: 'bom', kind: 'Cost', due: '2026-10-30', updated: '2026-10-06', uploaded: ['Cost model run for 5 parts', 'LME and ECB price feeds'], missing: ['Material spec for ELEC-925-C'], actions: BOM_ACTIONS },
  { id: 'composition-si', name: 'Program composition', group: 'bom', kind: 'Composition', due: '2026-10-30', updated: '2026-10-05', uploaded: ['BOM lines from LX and Sport'], missing: ['Supplier confirmation for the Estimated line'], actions: BOM_ACTIONS },
  { id: 'mapping-si', name: 'Requirement to test mapping', group: 'tests', kind: 'Mapping', due: '2026-11-06', updated: '2026-10-07', uploaded: ['Requirement table (16 requirements)', 'Test library (15 tests)'], missing: ['Reviewed mapping for requirements below the confidence floor'], actions: TEST_ACTIONS },
  { id: 'carryover-si', name: 'Carryover review', group: 'tests', kind: 'Carryover', due: '2026-11-13', updated: '2026-10-07', uploaded: ['Carryover events (10 chains)', 'Evidence from LX and Sport test runs'], missing: ['Evidence for the dangerous cases', 'Owner sign-off on open items'], actions: TEST_ACTIONS },
  { id: 'trace-si', name: 'Requirement trace', group: 'tests', kind: 'Trace', due: '2026-11-13', updated: '2026-10-04', uploaded: ['Impact graph over requirements, parts and tests'], missing: ['Test runs that are still open'], actions: TEST_ACTIONS },
  { id: 'plan-si', name: '{plan}', group: 'tests', kind: 'Plan', due: PROJECT_DUE, updated: '2026-10-03', uploaded: ['Requirement table', 'Test library', 'Carryover evidence'], missing: ['Acknowledgement of open risks', 'Approval'], actions: TEST_ACTIONS },
]

export interface ProjectScopeDef { id: string; programId: string | null; rfq: string | null; due: string | null; blurb: string; outputs: OutputDef[] }

export const PROJECT_SCOPES: Record<string, ProjectScopeDef> = {
  [CIVIC_PROJECT_ID]: { id: CIVIC_PROJECT_ID, programId: 'PGM-CIV-SI', rfq: 'RFQ-26-0512', due: PROJECT_DUE, blurb: 'What needs doing, who owns it, and where the data came from.', outputs: CIVIC_OUTPUTS },
}

/** Outputs of a project with no dataset behind it: titles only, no dashboard data (the shell shows empty states). */
export const placeholderOutputs = (projectId: string, name: string, count: number): OutputDef[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${projectId}-out-${i + 1}`, name: `${name} output ${i + 1}`, group: 'bom' as const, kind: 'Output', due: '2026-12-15', updated: `2026-09-2${i + 1}`,
    uploaded: [], missing: [], actions: BOM_ACTIONS,
  }))

export const CONFIGURATIONS: Record<string, Array<{ id: string; name: string; detail: string; updated: string }>> = {
  [CIVIC_PROJECT_ID]: [{ id: 'cfg-si-ts', name: 'Si twin-scroll configuration', detail: 'Surrogate search against LX and Sport, test-match floor 50%', updated: '2026-10-02' }],
  'p-bolt-std': [{ id: 'cfg-m16', name: 'M16 standard fastener set', detail: 'Reuse Status Preferred or Approved only', updated: '2026-09-18' }],
}

/* ------------------------------ Rules (config, not code) ------------------------------ */

export const DASHBOARD_RULES = {
  /** Severity raw values that make an action row urgent. */
  urgentSeverities: ['Critical', 'High'],
  /** Action kinds that are urgent whatever their severity. */
  urgentKinds: ['dangerous-case', 'no-match'],
  /** D-16: BOM lines have no severity in the dataset, so it comes from this table keyed by the line's match_type. */
  bomSeverityByMatchType: { surrogate: 'Medium', estimated: 'High', new: 'High' } as Record<string, string>,
  /** A surrogate below this match percent is bumped to High severity. */
  weakSurrogatePct: 65,
  /** Connection status texts that count as connected; the first is what a live PLM connector is shown as. */
  connectedStatuses: ['Connected'],
  notConnectedText: 'Not connected',
  /** How many rows each action box lists. */
  boxRows: 4,
}

/** Raw action kinds, labelled through a vocabulary like every other value (unknown kinds render raw). */
export const ACTION_KIND_VOCAB: StatusVocabulary = {
  id: 'actionKind',
  values: [
    { raw: 'dangerous-case', label: 'Dangerous case', tone: 'fail' },
    { raw: 'open-test', label: 'Open test run', tone: 'warn' },
    { raw: 'flagged-req', label: 'Flagged requirement', tone: 'info' },
    { raw: 'surrogate', label: 'Unconfirmed surrogate', tone: 'info' },
    { raw: 'estimated', label: 'Estimated line', tone: 'warn' },
    { raw: 'no-match', label: 'No match line', tone: 'fail' },
  ],
}

/** Outcome pill on recent items. Text first, tone second. */
export const OUTCOME_VOCAB: StatusVocabulary = {
  id: 'recentOutcome',
  values: [
    { raw: 'pass', label: 'Pass', tone: 'pass' },
    { raw: 'warn', label: 'Warn', tone: 'warn' },
    { raw: 'fail', label: 'Fail', tone: 'fail' },
  ],
}

/** Where an audit entry's subject leads when the user picks "Where you left off". */
export const SUBJECT_ROUTES: Record<string, string> = {
  'bom-line': '/create/bom/03', part: '/create/bom/03', requirement: '/create/requirements/06', req: '/create/requirements/06',
  plan: '/create/requirements/07', output: '/projects/p-civic-si',
}
export const DEFAULT_RESUME = '/create/bom/01'

/* ------------------------------ Seed activity and recents ------------------------------ */

export interface ActivitySeed { id: string; at: string; title: string; detail: string; href: string }
export const ACTIVITY_SEED: ActivitySeed[] = [
  { id: 'act-1', at: '2026-10-07T16:40:00Z', title: 'Reviewed carryover for REC-20008', detail: 'Carryover review · Civic Si 1.5T', href: '/create/requirements/06' },
  { id: 'act-2', at: '2026-10-07T11:05:00Z', title: 'Ran surrogate search on the Si BOM', detail: 'BOM review · 13 surrogates proposed', href: '/create/bom/03' },
  { id: 'act-3', at: '2026-10-06T15:20:00Z', title: 'Uploaded the RFQ-26-0512 package', detail: 'RFQ intake', href: '/create/bom/01' },
]

export interface RecentSeed { id: string; title: string; requirements: number; results: number; outcome: string; when: string; href: string }
export const RECENT_SEED: RecentSeed[] = [
  { id: 'rec-1', title: 'Twin-scroll turbine housing, Si', requirements: 4, results: 23, outcome: 'warn', when: '14 min ago', href: '/search/files?q=twin-scroll-housing&modality=part-to-part' },
  { id: 'rec-2', title: 'Charge pipe, water-cooled routing', requirements: 3, results: 47, outcome: 'pass', when: '2 h ago', href: '/search/files?q=charge-pipe&modality=part-to-part' },
  { id: 'rec-3', title: 'Wastegate actuator ELEC-925-C', requirements: 2, results: 0, outcome: 'fail', when: 'Yesterday', href: '/search/files?q=wastegate-actuator&modality=part-to-part' },
]

/* ------------------------------ Connections ------------------------------ */

export const DASHBOARD_CONNECTIONS: Array<{ source: string; status: string }> = [
  { source: 'Horizon Test Labs bookings', status: 'Connected' },
  { source: 'Requirements system (DOORS)', status: 'Not connected' },
  { source: 'Jira feedback', status: 'Connected' },
]

/* ------------------------------ Progress steps ------------------------------ */

export interface StepDef { id: string; label: string; to: string }
export const PROGRESS_STEPS: StepDef[] = [
  { id: 'intake', label: 'RFQ intake', to: '/create/bom/01' },
  { id: 'tree', label: 'Assembly tree', to: '/create/bom/02' },
  { id: 'bom', label: 'BOM review', to: '/create/bom/03' },
  { id: 'mapping', label: 'Test mapping', to: '/create/requirements/05' },
  { id: 'carryover', label: 'Carryover', to: '/create/requirements/06' },
  { id: 'approve', label: 'Approve plan', to: '/create/requirements/07' },
]

/** Run a Workflow card on Home: the workflows listed under Create in the left nav. */
export const HOME_WORKFLOWS = ['BOM Creation', 'Warranty Analysis', 'Part Replacement']
