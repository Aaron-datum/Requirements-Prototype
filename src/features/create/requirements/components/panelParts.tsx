import { Stub } from '../../../../components/stub/Stub'
import { Badge } from '../../../../components/ui'
import type { ReqView } from '../../../../fixtures/derive-requirements'
import { useService } from '../../../../services/context'
import { useVocab } from '../../../../config/useConfig'
import { Section, VocabBadge } from './shared'
import s from '../req.module.css'

/** Delta line for Changed and New rows, e.g. "Limit tightened 12% to 15% · no surrogate at the new limit". From the diff-engine. */
export function DeltaLine({ r }: { r: ReqView }) {
  const diff = useService('diff')
  const d = diff.textDelta(r.req_id)
  if (!d.delta) return null
  return (
    <Stub id="diff-engine" note="Lookup from requirement statuses"><div className={`${s.banner} ${s.bannerInfo}`} data-testid="delta-line"><span className={s.strong}>{d.state}</span><span>{d.delta}</span></div></Stub>
  )
}

/** The Si BOM line behind the requirement, its data type, and what the autonomy gate says about it (keyed by data type only, D-17). */
export function BomLineSection({ r }: { r: ReqView }) {
  const gate = useService('gate')
  const vocab = useVocab()
  const line = r.bomLine
  if (!line) return <Section title="BOM line"><span className="muted">No BOM line for this part.</span></Section>
  const dt = vocab.resolve('dataType', line.certainty)
  return (
    <Section title="BOM line">
      <div className="row wrap">
        <span className="data">{line.bom_line_id}</span><span className="data muted">{line.part_id}</span><Badge tone={dt.tone} title={dt.description}>{dt.label}</Badge>
        <Stub id="autonomy-gate" note="Rule table keyed by data type"><span title="Autonomy gate: what the agent may do without a person"><VocabBadge vocab="gateDecision" raw={gate.decide(line.certainty, r.severity)} /></span></Stub>
      </div>
      <span className="secondary">{line.name}</span>
      <span className="muted">Severity is shown but does not change the gate.</span>
    </Section>
  )
}
