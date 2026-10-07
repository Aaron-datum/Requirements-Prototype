// Data layer: loads the example dataset (Civic-class 1.5T engine, 3 trims) and
// exposes joined, derived views. The JSON files in datum-requirements-workflow-handoff/data
// are the single source of truth — nothing here is hand-copied.
import programsRaw from '../../../datum-requirements-workflow-handoff/data/programs.json'
import suppliersRaw from '../../../datum-requirements-workflow-handoff/data/suppliers.json'
import partsRaw from '../../../datum-requirements-workflow-handoff/data/parts.json'
import bomRaw from '../../../datum-requirements-workflow-handoff/data/bom_lines.json'
import reqsRaw from '../../../datum-requirements-workflow-handoff/data/requirements.json'
import testsRaw from '../../../datum-requirements-workflow-handoff/data/tests.json'
import linksRaw from '../../../datum-requirements-workflow-handoff/data/requirement_test_links.json'
import runsRaw from '../../../datum-requirements-workflow-handoff/data/test_runs.json'
import eventsRaw from '../../../datum-requirements-workflow-handoff/data/carryover_events.json'
import costRaw from '../../../datum-requirements-workflow-handoff/data/cost_estimates.json'

export const ACTIVE = 'PGM-CIV-SI'
export const SCOPE = {
  rfq: 'RFQ-26-0512',
  due: '2026-10-09',
  gate: 'DV · 2027-01-18',
  bomName: 'Civic Si 1.5T Engine Assembly',
  bomId: 'BOM-CIV-26 rev 1',
  sources: 'SOR-CIV-15 · ES-CIV-0150',
  planId: 'TP-CIV26-0007',
  user: 'Aaron Keller',
  email: 'aaron@datum.co',
}

const by = (arr, k) => Object.fromEntries(arr.map((x) => [x[k], x]))
export const programs = programsRaw
export const programById = by(programsRaw, 'program_id')
export const supplierById = by(suppliersRaw, 'supplier_id')
export const suppliers = suppliersRaw
export const partById = by(partsRaw, 'part_id')
export const testById = by(testsRaw, 'test_id')
export const tests = testsRaw
export const costByPart = by(costRaw, 'part_id')
export const eventsByReq = Object.fromEntries(eventsRaw.map((e) => [e.req_id, e.events]))
export const linkByReq = by(linksRaw, 'req_id')

export const progShort = (id) => ({ 'PGM-CIV-LX': 'LX', 'PGM-CIV-SPT': 'Sport', 'PGM-CIV-SI': 'Si' }[id] || id)

export const bomLines = bomRaw.map((l) => {
  const part = partById[l.part_id]
  return {
    ...l,
    part,
    name: part.name,
    supplier: supplierById[l.supplier_id],
    ext_price: +(l.unit_price_usd * l.quantity).toFixed(2),
  }
})
export const siBom = bomLines.filter((l) => l.program_id === ACTIVE)
export const bomLineById = by(siBom, 'bom_line_id')
export const siBomByPart = by(siBom, 'part_id')

// A part is "used on" the other programs when the same part_id appears in their BOM.
export function programUsage(partId) {
  return bomLines.filter((l) => l.part_id === partId).map((l) => l.program_id)
}

export const SUBASSEMBLIES = [...new Set(siBom.map((l) => l.subassembly))]

// ---------- Requirements ----------
export const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
export const AUTO_ACCEPT_AT = 90 // Unchanged/Unchanged requirements mapped at or above this carry automatically
export const SURROGATE_THRESHOLD = 60

const runsByTest = {}
runsRaw.forEach((r) => (runsByTest[r.test_id] ||= []).push(r))
export const runsForTest = (testId) =>
  (runsByTest[testId] || []).slice().sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))

function evidenceFor(req) {
  const link = linkByReq[req.req_id]
  const test = testById[link.test_id]
  const runs = runsForTest(test.test_id)
  const siRun = runs.find((r) => r.program_id === ACTIVE)
  const source = runs.find((r) => r.program_id !== ACTIVE && r.result === 'Pass')
  let state = 'Open'
  if (siRun?.result === 'Pass') state = 'Verified'
  else if (siRun?.result === 'Carried') state = 'Carried'
  return { link, test, runs, siRun, source, state }
}

export const requirements = reqsRaw.map((r) => {
  const ev = evidenceFor(r)
  const part = partById[r.linked_part_id]
  const conf = r.driven_by_confidence
  const open = ev.state === 'Open'
  // Flagged for carryover review == the Si test run has not happened yet.
  // Bucket: no/low transfer confidence cannot be justified from elsewhere -> Undetermined.
  const bucket = !open ? null : conf == null || conf < 60 ? 'undetermined' : 'evaluated_elsewhere'
  const autoAccept =
    r.text_status === 'Unchanged' && r.driven_by_status === 'Unchanged' && (ev.link.match_confidence ?? 0) >= AUTO_ACCEPT_AT
  return {
    ...r,
    part,
    ev,
    proposedTest: ev.test,
    matchConf: ev.link.match_confidence,
    evState: ev.state,
    flagged: open,
    bucket,
    autoAccept,
    dangerous: r.text_status === 'Unchanged' && r.driven_by_status === 'Changed',
    events: eventsByReq[r.req_id] || [],
    bomLine: siBomByPart[r.linked_part_id],
  }
})
export const reqById = by(requirements, 'req_id')
export const reqsForTest = (testId) => (testById[testId]?.req_ids || []).map((id) => reqById[id]).filter(Boolean)
export const subsystems = [...new Set(requirements.map((r) => r.subsystem))]

// Candidate evidence for a requirement: the linked test first (with its own score, if it has one),
// then library tests ranked by title overlap, capped below 50% — those are "weak" suggestions.
const tok = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3))
export function candidateEvidence(req) {
  const out = []
  const link = req.ev.link
  if (link.match_confidence != null)
    out.push({ test: req.ev.test, score: link.match_confidence, prov: 'Computed', why: link.why_matched, reasoning: link.reasoning })
  const t0 = tok(req.title + ' ' + req.subsystem)
  tests
    .filter((t) => t.test_id !== req.ev.test.test_id)
    .forEach((t) => {
      const t1 = tok(t.name)
      let hit = 0
      t0.forEach((w) => t1.has(w) && hit++)
      const score = Math.min(49, Math.round((hit / Math.max(1, t0.size)) * 100))
      if (score >= 10) out.push({ test: t, score, prov: 'Computed', why: ['Internal'], reasoning: 'Title overlap only — weak signal.' })
    })
  return out.sort((a, b) => b.score - a.score).slice(0, 4)
}

// ---------- Aggregates ----------
export function certaintyCounts(lines = siBom) {
  const c = { Actual: 0, Surrogate: 0, Estimated: 0, 'No match': 0 }
  lines.forEach((l) => c[l.certainty]++)
  return c
}
export const money = (n, d = 2) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
export const sum = (a, f) => a.reduce((s, x) => s + f(x), 0)

// Composition buckets as on the Program composition screen.
export function composition() {
  return {
    New: siBom.filter((l) => l.match_type === 'new'),
    Carryover: siBom.filter((l) => l.match_type === 'duplicate'),
    Surrogate: siBom.filter((l) => l.match_type === 'surrogate'),
    Uncertain: siBom.filter((l) => l.match_type === 'estimated'),
  }
}

// Rows for the Sourcing table: same-category suppliers with deterministic landed-cost spread.
export function sourcingOptions(line) {
  const cat = line.supplier.category
  const pool = suppliers.filter((s) => s.category === cat || s.supplier_id === line.supplier_id)
  return pool.map((s, i) => {
    const cur = s.supplier_id === line.supplier_id
    const f = cur ? 1 : 0.94 + ((i * 7) % 13) / 100
    return {
      supplier: s,
      current: cur,
      cost: +(line.unit_price_usd * f).toFixed(2),
      lead: line.part.lead_time_wk + (cur ? 0 : (i % 3) * 2 - 1),
      cert: cur ? line.certainty : 'Estimated',
      src: cur ? line.price_source : 'Rate-card estimate',
    }
  })
}
