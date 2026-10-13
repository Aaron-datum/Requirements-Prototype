import { Info } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MatchQuality } from '../../../components/quality/MatchQuality'
import { Stub } from '../../../components/stub/Stub'
import { Badge, Button, EmptyState } from '../../../components/ui'
import { useConfig } from '../../../config/useConfig'
import { composition, qualityOf, requirementCountFor, requirementScope } from '../../../fixtures/derive-bom'
import { COMPOSITION_CARDS, COMPOSITION_RULE, titleCase } from './bomConfig'
import { useBomStore } from './bomStore'
import { useBomRows, useLineMode } from './useBomData'
import s from './bom.module.css'

/** 04 Program composition: New, Carryover and Uncertain, each with count, note, line list and one primary action. */
export function Composition() {
  const config = useConfig()
  const rows = useBomRows()
  const modeOf = useLineMode()
  const routes = useBomStore((st) => st.routes)
  const search = useBomStore((st) => st.search)
  const [all, setAll] = useState<Record<string, boolean>>({})
  const scope = requirementScope(routes)

  if (search !== 'done') {
    return <div className={s.page}><EmptyState title="Composition needs a matched BOM" action={<Link to="/create/bom/03-review"><Button primary>Go to BOM review</Button></Link>}>Run the surrogate search first, then lines are sorted into New, Carryover and Uncertain.</EmptyState></div>
  }
  const buckets = composition(rows, config.matchRules.noSimilarityTypes)
  const label = (a: 'generate' | 'carryover' | 'resolve') => (a === 'generate' ? `Generate ${titleCase(config.planLabel)}` : a === 'carryover' ? 'Review Carryover' : 'Resolve Evidence')

  return (
    <div className={s.page} data-testid="composition">
      <div className={s.pageHead}>
        <div className="col" style={{ gap: 4 }}><h1 className="text-page">Program composition</h1><span className="secondary">Civic Si 1.5T · what is new, what carries over, what is still uncertain</span></div>
        <div className={s.stats} data-testid="composition-counts">
          <div className={s.stat}><span className="text-label-caps">Extracted</span><span className={s.statN}>{scope.extracted}</span></div>
          <div className={s.stat}><span className="text-label-caps">Implicated by this BOM</span><span className={s.statN}>{scope.inScope}</span></div>
          <div className={s.stat}><span className="text-label-caps">Traced to a line</span><span className={s.statN}>{scope.traced}</span></div>
        </div>
      </div>
      <span className="muted row" data-testid="scope-help" style={{ alignItems: 'flex-start' }}><Info size={14} aria-hidden style={{ flex: 'none', marginTop: 3 }} />Extracted {scope.extracted} from the RFQ documents; {scope.inScope} are scoped to parts in this BOM, and {scope.traced} of those are traced to a line and a test. The {scope.olderDocuments} in older carryover documents are reference only.</span>
      <Stub id="matching-engine" note="Buckets follow simulated certainty">
        <div className={s.grid3}>
          {COMPOSITION_CARDS.map((c) => {
            const lines = buckets[c.id]
            const reqs = lines.reduce((n, r) => n + requirementCountFor(r), 0)
            const shown = all[c.id] ? lines : lines.slice(0, 6)
            return (
              <section key={c.id} className={`${s.card} ${c.id === 'new' ? s.cardOn : ''}`} aria-label={c.title} data-testid={`bucket-${c.id}`}>
                <div className="row"><Badge tone={c.tone}>{c.title}</Badge><span className={s.cardCount} data-testid={`count-${c.id}`}>{lines.length}</span></div>
                <span className="data muted">lines · {reqs} requirements traced</span>
                <span>{c.note}</span>
                <div className={s.cardList}>
                  {shown.map((r) => (
                    <div key={r.id} className={s.cardRow}><span className="grow trunc">{r.name} <span className="data muted">{r.partNumber}</span></span><span className="data muted">{requirementCountFor(r)} req</span><MatchQuality quality={{ dataType: qualityOf(r, modeOf(r)).dataType }} /></div>))}
                  {lines.length > 6 && <button type="button" style={{ background: 'none', border: 0, color: 'var(--accent)', textAlign: 'left', paddingTop: 'var(--gap-2)' }} onClick={() => setAll({ ...all, [c.id]: !all[c.id] })}>{all[c.id] ? 'Show fewer' : `+ ${lines.length - 6} more`}</button>}
                  {lines.length === 0 && <span className="muted">No lines.</span>}
                </div>
                <Link to={c.href}><Button primary={c.id === 'new'} style={{ width: '100%' }}>{label(c.action)}</Button></Link>
              </section>
            )
          })}
        </div>
      </Stub>
      <div className={s.rule}><b>How lineage carries into requirements</b><span className="secondary grow">{COMPOSITION_RULE}</span></div>
    </div>
  )
}
