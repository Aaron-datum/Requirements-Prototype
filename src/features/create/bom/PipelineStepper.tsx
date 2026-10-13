import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PIPELINE, familyOf, stepHref, type StepKey } from './bomConfig'
import { useBomStore } from './bomStore'
import { useBomRows, useStepSubLabels } from './useBomData'
import s from './bom.module.css'

/**
 * The Create pipeline stepper (steps 01 to 07). Clickable at any time; sub-labels recompute from state on every render.
 * Steps 05 to 07 belong to the requirements area, so they link to /create/requirements/<step>.
 * Exported so the requirements screens can render the same stepper with `current` set to their own step.
 */
export function PipelineStepper({ current }: { current: string }) {
  const sub = useStepSubLabels()
  const lastLine = useBomStore((st) => st.lastLine)
  const rows = useBomRows()
  const family = familyOf(current as StepKey)
  const idx = PIPELINE.findIndex((p) => p.key === family)
  const line = lastLine ?? rows.find((r) => r.state === 'ready' && r.certainty !== 'Actual')?.id ?? rows[0]?.id
  const inReview = family === '03-review'
  return (
    <>
      <nav className={s.stepper} aria-label="Create pipeline" data-testid="pipeline-stepper">
        {PIPELINE.map((p, i) => (
          <Link key={p.key} to={stepHref(p)} className={`${s.step} ${p.key === family ? s.stepOn : ''} ${i < idx ? s.stepDone : ''}`} aria-current={p.key === family ? 'step' : undefined} data-step={p.key}>
            <span className={s.num}>{i < idx ? <Check size={12} aria-hidden /> : p.num}</span>
            <span className={s.stepText}><span className={s.stepLabel}>{p.label}</span><span className={s.stepSub} data-testid={`sub-${p.key}`}>{sub[p.key]}</span></span>
          </Link>
        ))}
      </nav>
      {inReview && (
        <div className={s.subs} aria-label="BOM review sub-screens">
          <Link to="/create/bom/03-review" className={`${s.subLink} ${current === '03-review' ? s.subLinkOn : ''}`}>Table</Link>
          {PIPELINE.find((p) => p.key === '03-review')!.subs!.map((x) => (
            <Link key={x.key} to={`/create/bom/${x.key}${line ? `?line=${encodeURIComponent(line)}` : ''}`} className={`${s.subLink} ${current === x.key ? s.subLinkOn : ''}`}>{x.num} {x.label}</Link>
          ))}
        </div>
      )}
    </>
  )
}
