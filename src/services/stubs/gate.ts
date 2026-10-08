import type { AutonomyGate } from '../../domain/types'

/** StubId: autonomy-gate. A config object, not code (D-17: keyed by data type only; severity is shown but not used). */
export const AUTONOMY_RULES: Record<string, 'carry-forward' | 'propose' | 'ask-human'> = {
  Actual: 'carry-forward',
  Surrogate: 'propose',
  Estimated: 'ask-human',
  Estimate: 'ask-human',
  'No match': 'ask-human',
  'Search failed': 'ask-human',
}
export const gateStub: AutonomyGate = {
  decide: (certainty) => AUTONOMY_RULES[certainty] ?? 'ask-human',
}
