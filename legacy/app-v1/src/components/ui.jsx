import Icon from './Icon'
import { useState } from 'react'
import { useStore } from '../store'

export const Badge = ({ tone = 'neutral', children, title }) => (
  <span className={`badge b-${tone}`} title={title}>{children}</span>
)

export const Btn = ({ primary, size, className = '', ...p }) => (
  <button className={`btn ${primary ? 'primary' : ''} ${size || ''} ${className}`} {...p} />
)

export const Seg = ({ value, options, onChange }) => (
  <div className="seg" role="group">
    {options.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o]
      return <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>
    })}
  </div>
)

export const Tabs = ({ value, tabs, onChange }) => (
  <div className="tabs">
    {tabs.map((t) => <button key={t} className={t === value ? 'on' : ''} onClick={() => onChange(t)}>{t}</button>)}
  </div>
)

export const KV = ({ rows }) => (
  <dl className="kv">
    {rows.filter(Boolean).map(([k, v]) => (
      <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>
    ))}
  </dl>
)

export const Meter = ({ pct, tone }) => (
  <div className={`meter ${tone || (pct >= 80 ? 'pass' : pct >= 60 ? '' : pct >= 40 ? 'warn' : 'fail')}`} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
    <i style={{ width: `${pct}%` }} />
  </div>
)

// ---- domain badges: always text-labelled ----
export const CERT_TONE = { Actual: 'pass', Surrogate: 'info', Estimated: 'warn', 'No match': 'fail' }
export const Certainty = ({ v }) => <Badge tone={CERT_TONE[v]}>{v}</Badge>
export const SEV_TONE = { Critical: 'fail', High: 'warn', Medium: 'info', Low: 'neutral' }
export const Severity = ({ v }) => <Badge tone={SEV_TONE[v]} title="Placeholder DFMEA-style scale">{v}</Badge>
const STATE_TONE = { New: 'info', Changed: 'warn', Unchanged: 'neutral' }
export const TextStatus = ({ v }) => <Badge tone={STATE_TONE[v]}>{v}</Badge>
export const SourceTag = ({ v }) => <Badge tone="outline">{v}</Badge>
export const RESULT_TONE = { Pass: 'pass', Fail: 'fail', Carried: 'info', Scheduled: 'neutral', 'In progress': 'warn' }
export const Result = ({ v }) => <Badge tone={RESULT_TONE[v]}>{v}</Badge>

// Decision 2d: the Driven-by score is ALWAYS shown. No score gets an explicit "n/a" instead of blank.
export function DrivenBy({ status, conf, why }) {
  const tone = status === 'Changed' ? 'warn' : status === 'New' ? 'info' : 'neutral'
  return (
    <span className="row" style={{ gap: 4 }}>
      <Badge tone={tone}>{status === 'Unchanged' ? '✓ Unchanged' : status}</Badge>
      <span className="mono muted" title={conf == null ? why || 'No transfer score: the driving geometry is new' : 'Transfer confidence'}>
        {conf == null ? 'n/a' : conf + '%'}
      </span>
    </span>
  )
}

export const Owner = ({ v }) => {
  if (!v) return <span className="muted">Unassigned</span>
  const m = v.match(/^(.*?) \((.*)\)$/)
  return m ? <span title={m[2]}>{m[1]}</span> : <span>{v}</span>
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="grow">
        <h1 className="h1">{title}</h1>
        {sub && <div className="sec" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="row">{children}</div>
    </div>
  )
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="hd"><span className="h3 grow">{title}</span><Btn size="sm" className="ghost icon" onClick={onClose} aria-label="Close"><Icon n="x" /></Btn></div>
        <div className="bd">{children}</div>
        {footer && <div className="ft">{footer}</div>}
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismiss } = useStore()
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="grow">{t.text}</span>
          <button onClick={t.undo}>Undo</button>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss"><Icon n="x" /></button>
        </div>
      ))}
    </div>
  )
}

// Small inline "who/when" stamp shown after a confirmed action.
export function Stamp({ audit, match }) {
  const e = audit.find((a) => match(a))
  if (!e) return null
  return <span className="muted" style={{ fontSize: 13 }}>{e.user} · {new Date(e.ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
}

export function useLocal(key, init) {
  const [v, set] = useState(() => {
    try { const x = sessionStorage.getItem(key); return x == null ? init : JSON.parse(x) } catch { return init }
  })
  return [v, (n) => { set(n); try { sessionStorage.setItem(key, JSON.stringify(n)) } catch {} }]
}
