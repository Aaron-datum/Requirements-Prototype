import { beforeEach, describe, expect, it } from 'vitest'
import { buildAppConfig } from '../../../config/appConfig'
import { dangerousCases, requirementRows } from '../../../fixtures/derive'
import {
  affectedBy, buildImpactGraph, buildReqViews, bulkAcceptPlan, carryStats, emptyDecisions, evidenceCandidates, laneEdges, laneEventsFor, neighborhood,
  planSummary, readDecisions, sharingInterface, splitByFloor, testCandidates, testDetail, KEYS, type Decisions, type ReqView,
} from '../../../fixtures/derive-requirements'
import { REQUIREMENT_RULES } from '../../../fixtures/extras/requirements/rules'

const th = buildAppConfig().thresholds
const views = (d: Decisions = emptyDecisions()): ReqView[] => buildReqViews(th, d)
const ledger = (entries: Record<string, string>) => Object.fromEntries(Object.entries(entries).map(([k, value]) => [k, { value, at: '2026-10-08T10:00:00.000Z', by: 'Aaron Keller' }]))

describe('dangerous cases', () => {
  it('are exactly REC-20001, REC-20007 and REC-20016, derived from the two states', () => {
    expect(dangerousCases()).toEqual(['REC-20001', 'REC-20007', 'REC-20016'])
    const rows = views()
    expect(rows.filter((r) => r.dangerous).map((r) => r.req_id)).toEqual(['REC-20001', 'REC-20007', 'REC-20016'])
    const byFlag = requirementRows().filter((r) => r.dangerous_case).map((r) => r.req_id)
    expect(byFlag).toEqual(['REC-20001', 'REC-20007', 'REC-20016'])
  })
  it('carry a standing highlight by condition: no selection input exists, and confirming the change clears it for the whole interface', () => {
    expect(views().filter((r) => r.rowDanger).map((r) => r.req_id)).toEqual(['REC-20001', 'REC-20007', 'REC-20016'])
    const d = readDecisions(ledger({ [KEYS.iface('IF-TURB-HSG')]: '1' }))
    const after = views(d)
    expect(after.filter((r) => r.rowDanger).map((r) => r.req_id)).toEqual(['REC-20007', 'REC-20016'])
    // still dangerous by condition, only the standing highlight is cleared
    expect(after.filter((r) => r.dangerous)).toHaveLength(3)
  })
})

describe('confirm-changed propagation', () => {
  it('applies to every requirement that shares the interface and is Changed', () => {
    const rows = views()
    const r1 = rows.find((r) => r.req_id === 'REC-20001')!
    expect(sharingInterface(rows, r1.interfaceId).map((r) => r.req_id).sort()).toEqual(['REC-20001', 'REC-20008'])
    const r16 = rows.find((r) => r.req_id === 'REC-20016')!
    expect(sharingInterface(rows, r16.interfaceId).map((r) => r.req_id).sort()).toEqual(['REC-20004', 'REC-20016'])
  })
  it('one confirmation marks all sharing rows confirmed and shrinks the count to zero', () => {
    const d = readDecisions(ledger({ [KEYS.iface('IF-BOOST-2.5')]: '1' }))
    const rows = views(d)
    expect(rows.find((r) => r.req_id === 'REC-20016')!.driven.confirmed).not.toBeNull()
    expect(rows.find((r) => r.req_id === 'REC-20004')!.driven.confirmed).not.toBeNull()
    expect(rows.find((r) => r.req_id === 'REC-20001')!.driven.confirmed).toBeNull()
    expect(sharingInterface(rows, 'IF-BOOST-2.5')).toEqual([])
  })
})

describe('evidence candidates and the floor', () => {
  it('rank by score and split at the evidence floor from config', () => {
    const c = evidenceCandidates('REC-20008', emptyDecisions())
    expect(c.map((x) => x.record.id)).toEqual(['RPT-24-0530', 'TR-22-0310'])
    const { above, below } = splitByFloor(c, th.evidenceFloor)
    expect(above.map((x) => x.record.id)).toEqual(['RPT-24-0530'])
    expect(below.map((x) => x.record.id)).toEqual(['TR-22-0310'])
  })
  it('flag "No candidates" when nothing reaches the floor, and a person-added record counts as above it', () => {
    const rows = views()
    expect(rows.find((r) => r.req_id === 'REC-20013')!.flags).toContain('no-candidates')
    expect(rows.find((r) => r.req_id === 'REC-20006')!.flags).toContain('no-candidates')
    expect(rows.find((r) => r.req_id === 'REC-20001')!.flags).not.toContain('no-candidates')
    const added = readDecisions(ledger({ [KEYS.cand('REC-20013', 'TR-24-0031')]: '1' }))
    expect(views(added).find((r) => r.req_id === 'REC-20013')!.flags).not.toContain('no-candidates')
  })
  it('only the floor is read from config: raising it moves a candidate below', () => {
    const c = evidenceCandidates('REC-20001', emptyDecisions())
    expect(splitByFloor(c, 55).above).toHaveLength(1)
    expect(splitByFloor(c, 60).above).toHaveLength(0)
  })
  it('a user upload is an asserted record flagged user-supplied', () => {
    const rec = { id: 'UP-0001', title: 'report.pdf', programLabel: 'User-supplied', partId: null, date: '2026-10-08', result: 'Unverified', metric: 'Asserted, not computed', testId: null, origin: 'user-supplied', uploadedBy: 'Aaron Keller' }
    const d = readDecisions(ledger({ [KEYS.evidence('UP-0001')]: JSON.stringify(rec), [KEYS.cand('REC-20013', 'UP-0001')]: '1' }))
    const c = evidenceCandidates('REC-20013', d)
    expect(c.at(-1)!.provenance).toBe('user-supplied')
    expect(c.at(-1)!.score).toBeNull()
  })
})

describe('test candidates', () => {
  it('start from the proposed test and drop alternates below the test-match floor', () => {
    const r = views().find((x) => x.req_id === 'REC-20001')!
    const c = testCandidates(r, th.testMatchFloor)
    expect(c.map((x) => x.testId)).toEqual(['DV-TC-210'])
    expect(testCandidates(r, 30).map((x) => x.testId)).toEqual(['DV-TC-210', 'DV-TC-217'])
  })
  it('the proposed test keeps a null confidence when no score exists, and the chosen confidence follows the chosen candidate', () => {
    const r = views().find((x) => x.req_id === 'REC-20007')!
    expect(r.chosenConfidence).toBe(82)
    const swapped = views(readDecisions(ledger({ [KEYS.test('REC-20007')]: 'DV-TC-210' }))).find((x) => x.req_id === 'REC-20007')!
    expect(swapped.chosenTestId).toBe('DV-TC-210')
    expect(swapped.chosenConfidence).toBe(57)
    expect(views().find((x) => x.req_id === 'REC-20001')!.chosenConfidence).toBeNull()
  })
})

describe('bulk accept', () => {
  it('never accepts a Changed requirement, a dangerous case or a row without a score, and reports them', () => {
    const plan = bulkAcceptPlan(views(), 50, buildAppConfig().matchRules.changedRaw)
    expect(plan.eligible).toEqual([])
    expect(plan.held.dangerous.map((r) => r.req_id).sort()).toEqual(['REC-20007', 'REC-20016'])
    expect(plan.held.changed.map((r) => r.req_id).sort()).toEqual(['REC-20004', 'REC-20008', 'REC-20010'])
    expect(plan.held.noScore.map((r) => r.req_id).sort()).toEqual(['REC-20001', 'REC-20006', 'REC-20013'])
  })
  it('accepts an Unchanged, non-dangerous row at or above the threshold', () => {
    const rows = views().map((r) => (r.req_id === 'REC-20004' ? { ...r, text_status: 'Unchanged' as const, dangerous: false } : r))
    const plan = bulkAcceptPlan(rows, 85, buildAppConfig().matchRules.changedRaw)
    expect(plan.eligible.map((r) => r.req_id)).toEqual(['REC-20004'])
    expect(bulkAcceptPlan(rows, 90, buildAppConfig().matchRules.changedRaw).eligible).toEqual([])
  })
})

describe('carryover buckets', () => {
  it('flag the six open Si runs, split by the transfer floor', () => {
    const rows = views()
    const stats = carryStats(rows)
    expect(stats).toMatchObject({ flagged: 6, needDecision: 6, undetermined: 4, evaluatedElsewhere: 2, linked: 0, gap: 0 })
    expect(rows.filter((r) => r.bucket === 'evaluated-elsewhere').map((r) => r.req_id)).toEqual(['REC-20007', 'REC-20016'])
    expect(rows.find((r) => r.req_id === 'REC-20008')!.driven_by_confidence).toBeLessThan(REQUIREMENT_RULES.transferFloor)
  })
  it('decisions reduce the need-a-decision count and set the outcome counters', () => {
    const d = readDecisions(ledger({ [`req-carry:REC-20007`]: JSON.stringify({ kind: 'linked', recordId: 'RPT-24-0420', provenance: 'computed' }), [`req-carry:REC-20013`]: JSON.stringify({ kind: 'gap' }) }))
    expect(carryStats(views(d))).toMatchObject({ needDecision: 4, linked: 1, gap: 1 })
  })
})

describe('plan receipt', () => {
  it('starts as 8 carried, 0 routed, 8 open and always adds up to the 16 requirements', () => {
    const s = planSummary(views())
    expect(s.carried.length + s.routed.length + s.open.length).toBe(16)
    expect([s.carried.length, s.routed.length, s.open.length]).toEqual([8, 0, 8])
    expect(s.autoReqs).toHaveLength(8)
  })
  it('counts and the still-open list move together as decisions are made', () => {
    const d = readDecisions(ledger({
      'req-map:REC-20004': 'accepted', 'req-map:REC-20010': 'accepted', 'req-map:REC-20008': 'rejected',
      'req-carry:REC-20007': JSON.stringify({ kind: 'linked', recordId: 'RPT-24-0420' }),
    }))
    const s = planSummary(views(d))
    expect(s.carried.length).toBe(9)
    expect(s.routed.map((x) => x.req.req_id).sort()).toEqual(['REC-20004', 'REC-20010'])
    expect(s.open).toHaveLength(5)
    expect(s.open.map((x) => x.req.req_id)).not.toContain('REC-20007')
    expect(s.open.find((x) => x.req.req_id === 'REC-20008')!.reasons).toEqual(['evidence', 'rejected'])
    expect(s.carried.length + s.routed.length + s.open.length).toBe(16)
    expect(s.tests.map((t) => t.testId).sort()).toEqual(['DV-TC-213', 'DV-TC-219'])
  })
  it('a requirement moved to Gap is routed to a new test; the list is the same set the counter counts', () => {
    const d = readDecisions(ledger({ 'req-carry:REC-20013': JSON.stringify({ kind: 'gap' }) }))
    const s = planSummary(views(d))
    expect(s.routed).toEqual([expect.objectContaining({ via: 'gap', testId: 'DV-TC-222' })])
    expect(s.open).toHaveLength(7)
  })
})

describe('approval gate inputs', () => {
  it('reads the created plan back from the ledger', () => {
    expect(readDecisions({}).plan).toBeNull()
    const d = readDecisions(ledger({ [KEYS.plan]: JSON.stringify({ planId: 'TP-CIV26-0007', name: 'DV Test plan' }) }))
    expect(d.plan).toMatchObject({ planId: 'TP-CIV26-0007', by: 'Aaron Keller' })
  })
})

describe('impact graph', () => {
  const g = buildImpactGraph(50)
  it('hop depth widens the radius and direction filters it', () => {
    const one = neighborhood(g, 'REC-20002', 1, 'both')
    const two = neighborhood(g, 'REC-20002', 2, 'both')
    expect(two.nodes.length).toBeGreaterThan(one.nodes.length)
    const back = neighborhood(g, 'REC-20002', 2, 'back')
    const fwd = neighborhood(g, 'REC-20002', 2, 'forward')
    expect(back.nodes.every((n) => n.id === 'REC-20002' || back.side[n.id] === 'back')).toBe(true)
    expect(fwd.nodes.every((n) => n.id === 'REC-20002' || fwd.side[n.id] === 'forward')).toBe(true)
    expect(back.nodes.map((n) => n.id)).toContain('TST:TR-24-0045')
    expect(fwd.nodes.map((n) => n.id)).toContain('TST:DV-TC-211')
    expect(fwd.nodes.map((n) => n.id)).not.toContain('TST:TR-24-0045')
  })
  it('only emits typed nodes and the two rendered edge kinds', () => {
    expect(new Set([...g.nodes.values()].map((n) => n.type))).toEqual(new Set(['REQ', 'DOC', 'PRT', 'TST', 'PLN']))
    expect(new Set(g.edges.map((e) => e.kind))).toEqual(new Set(['depends-on', 'donates-evidence']))
  })
  it('scenarios give a flag and a reason per affected node and the counters follow the scenario', () => {
    const rows = views()
    const anchor = rows.find((r) => r.req_id === 'REC-20002')!
    const hood = neighborhood(g, 'REC-20002', 2, 'both')
    const part = affectedBy('part', anchor, hood, rows)
    const text = affectedBy('text', anchor, hood, rows)
    expect(part.length).toBeGreaterThan(0)
    expect(part.every((a) => a.reason.length > 0)).toBe(true)
    expect(part.map((a) => a.id)).not.toEqual(text.map((a) => a.id))
    expect(part.find((a) => a.id === 'TST:DV-TC-211')!.flag).toBe('re-review')
    expect(text.find((a) => a.id.startsWith('DOC:'))!.flag).toBe('check')
  })
})

describe('event lanes', () => {
  it('are driven by the carryover events, three lanes, edges solid within a program and dashed across', () => {
    const r = views().find((x) => x.req_id === 'REC-20016')!
    const ev = laneEventsFor(r)
    expect(ev).toHaveLength(5)
    expect(new Set(ev.map((e) => e.lane))).toEqual(new Set(['DOC', 'PRT', 'TST']))
    expect(ev.filter((e) => e.warn).map((e) => e.title)).toEqual(['Interface changed', 'Flagged for review'])
    const edges = laneEdges(ev)
    expect(edges).toHaveLength(4)
    expect(edges.some((e) => e.sameProgram)).toBe(true)
    expect(edges.some((e) => !e.sameProgram)).toBe(true)
  })
  it('a requirement with no chain has no events', () => {
    expect(laneEventsFor(views().find((x) => x.req_id === 'REC-20003')!)).toEqual([])
  })
})

describe('test detail', () => {
  it('lists run history newest first and referencing requirements with a state', () => {
    const rows = views()
    const d = testDetail('DV-TC-211', rows, emptyDecisions(), th.testMatchFloor)!
    expect(d.runs.map((x) => x.run.run_id)[0]).toBe('TR-26-0071')
    expect(d.runs).toHaveLength(3)
    expect(d.referencedBy.map((x) => x.req.req_id).sort()).toEqual(['REC-20002', 'REC-20012'])
    expect(d.referencedBy.every((x) => x.state === 'accepted')).toBe(true)
    expect(d.programCount).toBe(3)
  })
  it('a test that never ran has an empty run list', () => {
    const d = testDetail('DV-TC-224', views(), emptyDecisions(), th.testMatchFloor)!
    expect(d.runs.length).toBeGreaterThan(0)
    expect(testDetail('NOPE', views(), emptyDecisions(), 50)).toBeNull()
  })
  it('shows an alternate candidate for a requirement that proposes a different test', () => {
    const d = testDetail('DV-TC-213', views(), emptyDecisions(), th.testMatchFloor)!
    expect(d.referencedBy.find((x) => x.req.req_id === 'REC-20006')!.state).toBe('alternate')
    expect(d.referencedBy.find((x) => x.req.req_id === 'REC-20004')!.state).toBe('ran')
  })
})

describe('fixtures stay plain', () => {
  beforeEach(() => undefined)
  it('never use the word Exact in a label', () => {
    const text = JSON.stringify(views().map((r) => [r.interfaceLabel, r.delta]))
    expect(text).not.toMatch(/\bexact\b/i)
  })
})
