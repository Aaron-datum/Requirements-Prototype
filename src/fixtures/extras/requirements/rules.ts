/**
 * Rule tables for the requirements area. These are config objects, not code (same idea as the autonomy-gate rule table):
 * a different answer to an open question is an edit here.
 */
import type { ImpactFlag, ImpactRole } from './types'

export const REQUIREMENT_RULES = {
  /** Below this Driven-by confidence a carried result cannot be treated as transferable: the flagged item is Undetermined, not Evaluated Elsewhere. */
  transferFloor: 60,
  /** Default threshold in the "Accept all >= N" bulk shortcut. */
  bulkAcceptDefault: 80,
}

/** Carryover event name (raw dataset value) to its lane on the 03c event lanes: DOC source document, PRT part record, TST test record. */
export type Lane = 'DOC' | 'PRT' | 'TST'
export const EVENT_LANE: Record<string, Lane> = {
  Raised: 'DOC',
  'Requirement changed': 'DOC',
  'Interface changed': 'PRT',
  Carried: 'PRT',
  'Test run': 'TST',
  'Test in progress': 'TST',
  'Flagged for review': 'TST',
}
/** Event names that mark a change or an unmet event (warn colour plus text on the lanes and the carryover chain). */
export const WARN_EVENTS: Record<string, 'Changed' | 'Unmet'> = {
  'Requirement changed': 'Changed',
  'Interface changed': 'Changed',
  'Flagged for review': 'Unmet',
  'Test in progress': 'Unmet',
}
export const INTERFACE_EVENT = 'Interface changed'
export const LANES: Lane[] = ['DOC', 'PRT', 'TST']

export interface ScenarioDef {
  id: string
  label: string
  note: string
  rules: Array<{ role: ImpactRole; flag: ImpactFlag; reason: string }>
}

/** "If this changes" scenarios on the impact map. A rule says what happens to a node by its role in the graph. */
export const SCENARIOS: ScenarioDef[] = [
  { id: 'part', label: 'Part design changes', note: 'e.g. a new revision of the linked part', rules: [
    { role: 'linked-test', flag: 're-review', reason: 'The result was measured on the old design, so it may no longer apply.' },
    { role: 'sibling-by-part', flag: 're-review', reason: 'Traces to the same part, so the design change reaches it directly.' },
    { role: 'sibling-by-test', flag: 'check', reason: 'Relies on the same test result. Confirm the margin still holds.' },
    { role: 'surrogate-part', flag: 'check', reason: 'Surrogate source for this part. Confirm the match still holds.' },
    { role: 'donor-evidence', flag: 'check', reason: 'Evidence taken on the earlier design. Confirm it still stands behind the carryover.' },
    { role: 'plan', flag: 'check', reason: 'The plan needs re-approval if its test set changes.' },
  ] },
  { id: 'evidence', label: 'Evidence re-run', note: 'e.g. rerun the linked test at new conditions', rules: [
    { role: 'linked-test', flag: 're-review', reason: 'The re-run replaces this result.' },
    { role: 'sibling-by-test', flag: 're-review', reason: 'Relies on the result being superseded.' },
    { role: 'donor-evidence', flag: 'check', reason: 'Original evidence donor. Confirm it still stands behind the carryover.' },
    { role: 'plan', flag: 'check', reason: 'Carried and closed counts on the plan will change.' },
  ] },
  { id: 'text', label: 'Requirement text changes', note: 'e.g. the OEM revises the source clause', rules: [
    { role: 'linked-test', flag: 're-review', reason: 'The test was chosen for the old clause wording.' },
    { role: 'doc', flag: 'check', reason: 'The citation will need to point at the revised section.' },
    { role: 'sibling-by-test', flag: 'check', reason: 'Shares the test. Confirm it still covers both clauses.' },
    { role: 'plan', flag: 'check', reason: 'Plan content depends on this mapping.' },
  ] },
]
export const DEFAULT_SCENARIO = 'part'
