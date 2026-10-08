/**
 * Domain additions that are not in docs/03-domain-and-service-interfaces.ts (kept separate so that file stays a clean copy).
 */
import type { AppConfig, Tone } from './types'

export interface Thresholds {
  /** Surrogate floor: below this the BOM tier becomes Estimated (dataset uses 58 and 55). */
  surrogateFloor: number
  estimatedFloor: number
  /** Test-match confidence floor for requirement → test proposals. */
  testMatchFloor: number
  /** Unchanged/Unchanged requirements at or above this carry automatically. */
  autoAcceptAt: number
  /** Evidence candidates below this are "weak" (carryover review empty state). */
  evidenceFloor: number
}

export interface CurrentUser { id: string; name: string; email: string; initials: string }

/** Behaviour switches that would otherwise be hard-coded status comparisons. All values are raw vocabulary values. */
export interface MatchRules {
  /** Data types that have no meaningful similarity percentage (the bar is not drawn). */
  noSimilarityTypes: string[]
  /** Data types that offer a retry affordance. */
  retryTypes: string[]
  /** Workflow approval lifecycle: pending raw value and the raw value it becomes when confirmed. */
  approval: { pendingRaw: string; confirmedRaw: string }
  /** Raw values of the requirement text / driven-by state vocabulary that mean "changed". */
  changedRaw: string[]
  /** Source type tags for evidence that is user supplied (shown dashed, "asserted, not computed"). */
  assertedOrigins: string[]
}

export interface AppConfigFull extends AppConfig {
  matchRules: MatchRules
  tenantId: string
  thresholds: Thresholds
  currentUser: CurrentUser
  /** Example list of accepted CAD formats, used everywhere (requirements doc: pick one list). */
  acceptedFormats: string[]
}

export interface ResolvedValue { raw: string; label: string; tone: Tone; description?: string; known: boolean }

export type ThemeId = 'white' | 'tan' | 'dark'
export type DensityId = 'compact' | 'default' | 'comfy'

/** A decision action handed to a screen by the workflow it was reached from. */
export interface WorkflowContextState {
  workflowId: string
  returnTo: string
  /** Free-form payload the originating workflow needs when the action fires (e.g. bom_line_id). */
  payload: Record<string, string>
  decisionActions: Array<{ id: string; label: string; effect: 'select-surrogate' | 'select-replacement' | 'add-to-assembly' | 'use-part' }>
}
