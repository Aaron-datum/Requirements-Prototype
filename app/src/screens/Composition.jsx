import { go } from '../router'
import { useStore } from '../store'
import { Badge, Btn, Certainty, PageHead } from '../components/ui'
import { composition, requirements, siBom } from '../data'

export default function Composition() {
  const { state } = useStore()
  const c = composition()
  const confirmedSurr = c.Surrogate.filter((l) => state.surrogate[l.bom_line_id])
  const buckets = [
    { title: 'New', tone: 'info', lines: [...c.New, ...c.Uncertain], note: 'No production evidence to inherit. Requirements are routed to new tests.', action: 'Review Requirement Mapping', to: '/mapping' },
    { title: 'Carryover', tone: 'pass', lines: [...c.Carryover, ...confirmedSurr], note: 'Identical or confirmed-surrogate parts. Evidence can transfer from LX and Sport.', action: 'Review Carryover', to: '/carryover' },
    { title: 'Uncertain', tone: 'warn', lines: c.Surrogate.filter((l) => !state.surrogate[l.bom_line_id]), note: 'Surrogate matches not yet confirmed. Confirm the match before evidence can transfer.', action: 'Resolve Evidence', to: '/bom' },
  ]
  const reqCount = (lines) => requirements.filter((r) => lines.some((l) => l.part_id === r.linked_part_id)).length
  return (
    <div className="page">
      <PageHead title="Program composition" sub="Civic Si 1.5T · MY2026 · what's new, what carries over, what's still uncertain">
        <div className="card tight"><span className="caps">Extracted</span> <b className="mono">{requirements.length}</b></div>
        <div className="card tight"><span className="caps">Implicated by this BOM</span> <b className="mono">{requirements.filter((r) => r.bomLine).length}</b></div>
      </PageHead>
      <div className="grid g3">
        {buckets.map((b) => (
          <section key={b.title} className="card col">
            <div className="row"><Badge tone={b.tone}>{b.title}</Badge><span className="right stat">{b.lines.length}</span></div>
            <span className="muted">lines · {reqCount(b.lines)} requirements</span>
            <span>{b.note}</span>
            <div className="col" style={{ gap: 0 }}>
              {b.lines.slice(0, 5).map((l) => (
                <div key={l.bom_line_id} className="act-item"><span className="grow trunc">{l.name} <span className="mono muted">{l.part_id}</span></span>
                  <span className="muted">{requirements.filter((r) => r.linked_part_id === l.part_id).length} req</span><Certainty v={l.certainty} /></div>))}
              {b.lines.length > 5 && <span className="muted" style={{ paddingTop: 6 }}>+ {b.lines.length - 5} more</span>}
            </div>
            <Btn primary onClick={() => go(b.to)}>{b.action}</Btn>
          </section>
        ))}
      </div>
      <div className="banner"><b>How lineage carries into requirements.</b> A Carryover line pre-sets its requirements to <Badge>Text · Unchanged</Badge> and leans them toward Evaluated Elsewhere. The lean is a proposal, not an inherited state — anything whose interface changed is flagged for review.</div>
    </div>
  )
}
