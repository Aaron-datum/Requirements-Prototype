import { AlertTriangle, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MatchQuality } from '../../../../components/quality/MatchQuality'
import { Badge } from '../../../../components/ui'
import { testById } from '../../../../fixtures/civic'
import { chainHops, type ReqView } from '../../../../fixtures/derive-requirements'
import { stepHref } from '../model'
import { useReqVocab } from '../vocab'
import s from '../req.module.css'

/** Screen title, subtitle and actions. One header for every step. */
export function ScreenHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={s.head}>
      <div className="col" style={{ gap: 2, minWidth: 0 }}><h1>{title}</h1>{sub && <div className="secondary">{sub}</div>}</div>
      {actions && <div className={s.headActions}>{actions}</div>}
    </div>
  )
}

const STEPS: Array<{ key: string; no: string; label: string; also?: string[] }> = [
  { key: '05-mapping', no: '05', label: 'Test mapping' },
  { key: '06-carryover', no: '06', label: 'Carryover review' },
  { key: '06c-trace', no: '06c', label: 'Requirement trace' },
  { key: '06b-impact', no: '06b', label: 'Impact map' },
  { key: '07-approve', no: '07', label: 'Approve' },
]
/** The BOM steps 01 to 04 belong to the BOM area. Slugs are an assumption (docs/decisions/requirements.md). */
export const BOM_LAST_STEP = '/create/bom/04-composition'

export function Stepper({ current, counts }: { current: string; counts?: Record<string, number | undefined> }) {
  return (
    <nav className={s.steps} aria-label="Requirements steps">
      <Link className={s.step} to={BOM_LAST_STEP}><span className={s.stepNo}>01-04</span>BOM</Link>
      {STEPS.map((st) => (
        <Link key={st.key} to={stepHref(st.key)} className={`${s.step} ${current === st.key ? s.stepOn : ''}`} aria-current={current === st.key ? 'step' : undefined}>
          <span className={s.stepNo}>{st.no}</span>{st.label}{counts?.[st.key] ? <span className="data muted">{counts[st.key]}</span> : null}
        </Link>
      ))}
    </nav>
  )
}

export function SourceTag({ r }: { r: Pick<ReqView, 'source_type'> }) {
  const v = useReqVocab().resolve('sourceType', r.source_type)
  return <Badge tone="outline" title="Source type">{v.label}</Badge>
}
export function TextBadge({ state }: { state: string }) {
  const v = useReqVocab().resolve('textStatus', state)
  return <Badge tone={v.tone} title="Text: the requirement wording against the prior version">{v.label}</Badge>
}
export function SeverityBadge({ value }: { value: string }) {
  const v = useReqVocab().resolve('severity', value)
  return <Badge tone={v.tone}>{v.label}</Badge>
}
export function ConformancePill({ raw }: { raw: string }) {
  const v = useReqVocab().resolve('conformanceState', raw)
  return <Badge tone={v.tone}>{v.label}</Badge>
}
export function VocabBadge({ vocab, raw, dashed }: { vocab: string; raw: string; dashed?: boolean }) {
  const v = useReqVocab().resolve(vocab, raw)
  return <Badge tone={v.tone} dashed={dashed}>{v.label}</Badge>
}

/** Requirement cell shared by 05 and 06c: title, id, and the standing "Driver changed" text for dangerous cases (never colour alone). */
export function ReqTitle({ r }: { r: ReqView }) {
  return (
    <div className={s.cell}>
      <span>{r.title}</span>
      <span className={s.id}>{r.req_id} · {r.linked_part_id}</span>
      {r.dangerous && (r.rowDanger
        ? <span><Badge tone="fail" icon={<AlertTriangle size={12} aria-hidden />} title="Text is Unchanged but what it traces to has Changed">Driver changed</Badge></span>
        : <span><Badge tone="neutral" title="Text is Unchanged and the changed driver is confirmed">Driver changed · confirmed</Badge></span>)}
    </div>
  )
}

export function SourceCell({ r }: { r: ReqView }) {
  return <div className={s.cell}><span><SourceTag r={r} /></span><span className={s.id}>{r.citation}</span></div>
}

/** Driven by: the interface, its state, and ALWAYS a score or an explicit n/a while computed; a check mark once confirmed. */
export function DrivenByCell({ r }: { r: ReqView }) {
  const st = useReqVocab().resolve('textStatus', r.driven.state)
  const { score, confirmed } = r.driven
  return (
    <div className={s.cell}>
      <span className="trunc">{r.interfaceLabel}</span>
      <span>
        <Badge tone={st.tone} title={confirmed ? `Confirmed by ${confirmed.by}` : 'Computed by Datum, not yet confirmed'}>
          {st.label}
          {confirmed ? <Check size={12} aria-label="Confirmed" /> : score != null ? <span className="data">{score}%</span> : <span title="No score: the driving geometry or clause is new">n/a</span>}
        </Badge>
      </span>
    </div>
  )
}

/** Two different confidences on one requirement, labelled differently, each with a "why" popover (D-07). */
export function ConfidencePair({ r }: { r: ReqView }) {
  const transfer = r.link.match_confidence
  const computed = r.driven.score
  return (
    <div className={s.sec}>
      <div className="row"><span className="secondary grow">Transfer confidence</span>
        <MatchQuality quality={{ confidence: transfer != null ? { score: transfer, why: ['How well the earlier test result transfers to this requirement.', ...r.link.why_matched.map((t) => `Matched on ${t}`)] } : { label: 'No score' } }} /></div>
      <div className="row"><span className="secondary grow">Computed confidence</span>
        <MatchQuality quality={{ confidence: computed != null ? { score: computed, why: ['How sure Datum is of the Driven by assessment (interface and state).', 'A different measure from transfer confidence.'] } : { label: 'No score' }, provenance: { origin: r.driven.confirmed ? 'confirmed' : 'computed' } }} /></div>
    </div>
  )
}

export function Section({ title, children, right }: { title: ReactNode; children: ReactNode; right?: ReactNode }) {
  return <section className={s.sec}><div className={s.secHead}><span className="grow">{title}</span>{right}</div>{children}</section>
}

/** The literal clause, source tag and citation, Text badge: the top of every requirement panel. */
export function ClauseSection({ r }: { r: ReqView }) {
  return (
    <Section title="Requirement">
      <div>{r.requirement_text}</div>
      <div className="row wrap"><SourceTag r={r} /><span className="data muted">{r.citation}</span><TextBadge state={r.text_status} /></div>
    </Section>
  )
}

/** Associated test card with a warning line when the run predates the interface change, and View Test. */
export function AssociatedTest({ r, back }: { r: ReqView; back: string }) {
  const test = testById[r.chosenTestId]
  const run = r.runs.find((x) => x.program_id === r.siRun?.program_id) ?? r.siRun
  const hops = chainHops(r)
  const change = [...hops].reverse().find((h) => h.warn === 'Changed')
  const old = r.sourceRun
  const predates = !!old?.date && !!change && old.date < change.date && r.dangerous
  const v = useReqVocab()
  return (
    <Section title="Associated test">
      <div className={s.card}>
        <span className={s.strong}>{test?.name ?? r.chosenTestId}</span>
        <span className={s.id}>{r.chosenTestId} · {test?.standard}</span>
        {run ? <span className="secondary">{run.run_id} · {v.label('testResult', run.result)}{run.samples ? ` · ${run.samples} samples` : ''}{run.date ? ` · ${run.date}` : ''}</span> : <span className="secondary">No run on this program yet</span>}
        {predates && <span className="row" style={{ color: 'var(--status-warn-fg)' }}><AlertTriangle size={14} aria-hidden /> Last passing run {old!.date} predates the interface change on {change!.date}.</span>}
        <Link to={stepHref('test', `test=${r.chosenTestId}&from=${r.req_id}&back=${back}`)}>View Test</Link>
      </div>
    </Section>
  )
}
