/**
 * Evidence store content: eight hard-coded records (docs/02 section 6, StubId evidence-store) and the ranked candidate
 * scores per requirement (StubId evidence-engine). All values are fake and shaped to fit the Civic dataset: the records
 * are the earlier-program reports the carryover events refer to, plus a few weaker neighbours so ranking has something to rank.
 */
import type { EvidenceCandidateRow, EvidenceRecord } from './types'

export const EVIDENCE_RECORDS: EvidenceRecord[] = [
  { id: 'TR-24-0031', title: 'Turbine burst containment report, single-scroll', programLabel: 'Civic LX 1.5T', partId: 'TC-404-A', date: '2024-02-14', result: 'Pass', metric: '2.3x design energy at containment speed', testId: 'DV-TC-210', origin: 'computed' },
  { id: 'TR-23-0218', title: 'Turbine housing containment, legacy casting', programLabel: 'Supplier archive', partId: null, date: '2023-07-11', result: 'Pass', metric: '1.72x design energy', testId: 'DV-TC-210', origin: 'computed' },
  { id: 'RPT-24-0420', title: 'Charge pipe burst test, single-bore routing', programLabel: 'Civic LX 1.5T', partId: 'INT-515-A', date: '2024-04-20', result: 'Pass', metric: 'Held 4.5 bar(g), no joint separation', testId: 'DV-TC-216', origin: 'computed' },
  { id: 'RPT-24-0530', title: 'Exhaust manifold thermal fatigue, 1,000 cycles', programLabel: 'Civic LX 1.5T', partId: 'EXH-710-A', date: '2024-05-30', result: 'Pass', metric: '1,000 cycles at 950 C, no cracks', testId: 'DV-TC-217', origin: 'computed' },
  { id: 'TR-22-0310', title: 'Manifold thermal shock, legacy single-scroll flange', programLabel: 'Supplier archive', partId: null, date: '2022-10-19', result: 'Pass', metric: '600 cycles at 900 C', testId: 'DV-TC-217', origin: 'computed' },
  { id: 'TR-24-0098', title: 'Air-to-air intercooler delta-T dyno run', programLabel: 'Civic LX 1.5T', partId: 'INT-510-A', date: '2024-03-27', result: 'Pass', metric: 'Delta-T 38 K above ambient', testId: 'DV-TC-215', origin: 'computed' },
  { id: 'RPT-24-0628', title: 'Ignition coil validation at LX boost target', programLabel: 'Civic LX 1.5T', partId: 'ELEC-910', date: '2024-06-28', result: 'Pass', metric: 'Dwell and energy in spec at 1.8 bar(a)', testId: 'DV-TC-225', origin: 'computed' },
  { id: 'TC-CAL-23-0044', title: 'Thermocouple calibration, 400 to 800 C', programLabel: 'Datum Sensor Cal Lab', partId: null, date: '2023-09-05', result: 'Pass', metric: 'Within 0.4% of reference', testId: null, origin: 'computed' },
]

/**
 * Ranked candidates per requirement, [recordId, score]. Only the six requirements flagged for carryover review need them.
 * Scores below the evidence floor (config thresholds.evidenceFloor) are returned too: the screen decides what to show.
 */
export const EVIDENCE_SCORES: Record<string, Array<[string, number]>> = {
  'REC-20001': [['TR-24-0031', 56], ['TR-23-0218', 51]],
  'REC-20006': [['TR-24-0098', 41]],
  'REC-20007': [['RPT-24-0420', 82]],
  'REC-20008': [['RPT-24-0530', 62], ['TR-22-0310', 48]],
  'REC-20013': [['TC-CAL-23-0044', 34]],
  'REC-20016': [['RPT-24-0628', 78]],
}

export const toCandidateRows = (reqId: string): EvidenceCandidateRow[] =>
  [...(EVIDENCE_SCORES[reqId] ?? [])].sort((a, b) => b[1] - a[1]).map(([recordId, score]) => ({ recordId, score, provenance: 'computed' as const }))
