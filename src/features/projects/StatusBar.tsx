import { Check, Circle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LinkButton } from '../../components/ui'
import type { Step } from '../../fixtures/derive-projects'
import { DASHBOARD_RULES } from '../../fixtures/extras/projects/projectData'
import s from './Projects.module.css'

export interface Connection { source: string; status: string; detail?: string }

/**
 * Band 3: one lightweight strip (summary, progress, connections), not another set of cards.
 * Connections are a simple list with a text status each; no states are invented for partial connections.
 */
export function StatusBar({ summary, steps, connections, inputs }: {
  summary: ReactNode
  steps: Step[]
  connections: Connection[]
  inputs: { uploaded: string[]; missing: string[]; label: string }
}) {
  const [open, setOpen] = useState(false)
  const down = connections.filter((c) => !DASHBOARD_RULES.connectedStatuses.includes(c.status))
  const done = steps.filter((x) => x.done).length
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0
  return (
    <div className={s.band}>
      <div className={s.status} role="region" aria-label="Status" data-testid="status-bar">
        <div className={s.seg}><span className="text-label-caps">Summary</span><span>{summary}</span></div>
        <div className={`${s.seg} ${s.segGrow}`}>
          <span className="text-label-caps">Progress · {done} of {steps.length} steps</span>
          <span className="row"><span className={s.meter} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress"><span className={s.meterFill} style={{ width: `${pct}%`, display: 'block' }} /></span><span className="data">{pct}%</span></span>
          <span className={s.steps}>
            {steps.map((x) => <Link key={x.id} to={x.to} className={x.done ? s.stepDone : 'secondary'}>{x.done ? <Check size={12} aria-hidden /> : <Circle size={12} aria-hidden />} {x.label}<span className="sr-only">{x.done ? ' (done)' : ' (open)'}</span></Link>)}
          </span>
        </div>
        <div className={s.seg}>
          <span className="text-label-caps">Connections</span>
          <span data-testid="connections-summary">{connections.filter((c) => DASHBOARD_RULES.connectedStatuses.includes(c.status)).length} of {connections.length} connected</span>
          <span className="muted">{down.length ? `Not connected: ${down.map((c) => c.source).join(', ')}` : 'All connected'}</span>
        </div>
        <div className={s.seg}>
          <span className="text-label-caps">Inputs · {inputs.label}</span>
          <span>{inputs.uploaded.length} uploaded · {inputs.missing.length} missing</span>
          <LinkButton onClick={() => setOpen(!open)} aria-expanded={open} style={{ textAlign: 'left' }}>{open ? 'Hide details' : 'Show details'}</LinkButton>
        </div>
      </div>
      {open && (
        <div className={s.detail} data-testid="inputs-detail">
          <div data-testid="connections"><b style={{ fontWeight: 500 }}>Connections</b><ul>{connections.map((c) => <li key={c.source}>{c.source}: {c.status}{c.detail ? <span className="muted"> · {c.detail}</span> : null}</li>)}</ul></div>
          <div><b style={{ fontWeight: 500 }}>Uploaded</b>{inputs.uploaded.length ? <ul>{inputs.uploaded.map((x) => <li key={x}>{x}</li>)}</ul> : <div className="muted">Nothing uploaded yet.</div>}</div>
          <div><b style={{ fontWeight: 500 }}>Missing</b>{inputs.missing.length ? <ul>{inputs.missing.map((x) => <li key={x}>{x}</li>)}</ul> : <div className="muted">Nothing missing.</div>}</div>
        </div>
      )}
    </div>
  )
}
