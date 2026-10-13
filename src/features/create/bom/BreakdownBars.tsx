import type { SurrogateBreakdown } from '../../../domain/types'
import { SIMILARITY_DIMENSIONS } from '../../../fixtures/semantics'
import s from './bom.module.css'

/** The five-bar similarity breakdown (Geometry, Manufacture complexity, Material, Supplier / location, Order of magnitude). */
export function BreakdownBars({ breakdown }: { breakdown: SurrogateBreakdown }) {
  return (
    <div className={s.bars} data-testid="breakdown">
      {SIMILARITY_DIMENSIONS.map((d) => (
        <div key={d.key} className={s.barRow}>
          <span>{d.label}</span>
          <div className={s.bar} role="meter" aria-label={d.label} aria-valuenow={breakdown[d.key]} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${breakdown[d.key]}%` }} /></div>
          <span className="data" style={{ textAlign: 'right' }}>{breakdown[d.key]}</span>
        </div>
      ))}
    </div>
  )
}
