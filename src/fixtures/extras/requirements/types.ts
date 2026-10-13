/** Types for the requirements and traceability area (steps 05 to 07). Kept with the fixtures so stubs and screens share them. */

export type EvidenceOrigin = 'computed' | 'user-supplied'

/** An evidence record: a test report or analysis that could close a requirement. Eight are hard-coded; uploads add more. */
export interface EvidenceRecord {
  id: string
  title: string
  /** Free label ("Civic LX 1.5T", "Supplier archive"): not every record belongs to a program in the dataset. */
  programLabel: string
  partId: string | null
  date: string | null
  /** Raw test-result value (vocabulary testResult). */
  result: string
  /** One-line measured outcome, e.g. "2.3x design energy". */
  metric: string
  testId: string | null
  origin: EvidenceOrigin
  uploadedBy?: string
  verifiedBy?: string
  verifiedAt?: string
}

/** A ranked evidence candidate for one requirement. score null = added by a person (no computed score). */
export interface EvidenceCandidateRow { recordId: string; score: number | null; provenance: 'computed' | 'manual' | 'user-supplied' }

/** One proposed test for a requirement. confidence null = no score exists (the driving geometry or clause is new). */
export interface TestCandidateRow { testId: string; confidence: number | null; tags: string[]; reasoning: string[] }

export interface TestProcedure { setup: string; profile: string; samples: string; acceptance: string; durationDays: number }

/** The evidence-store seam (StubId evidence-store): eight records, uploads create an in-memory record flagged "asserted, not computed". */
export interface EvidenceStore {
  list(): EvidenceRecord[]
  get(id: string): EvidenceRecord | undefined
  search(query: string): EvidenceRecord[]
  upload(input: { fileName: string; by: string; reqId: string }): EvidenceRecord
  verify(id: string, by: string): void
}

export type ImpactRole = 'doc' | 'anchor-part' | 'surrogate-part' | 'donor-evidence' | 'linked-test' | 'plan' | 'sibling-by-test' | 'sibling-by-part'
export type ImpactFlag = 're-review' | 'check'
