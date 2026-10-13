import { ExternalLink, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Stub } from '../../components/stub/Stub'
import { Button } from '../../components/ui'
import { useConfig } from '../../config/useConfig'
import { useService } from '../../services/context'
import { PLM_DISABLED_TIP } from '../../services/stubs/plm'
import { toastSuccess } from '../../stores/toastStore'
import { applyDecisionAction, searchOnHref, useWorkflowCtx } from '../../lib/workflowContext'
import s from './catalogue.module.css'

/** "Search on": a real link that opens a new search with this part active, in a new tab. Keeps the workflow context. */
export function SearchOnLink({ partNumber, iconOnly, ghost }: { partNumber: string; iconOnly?: boolean; ghost?: boolean }) {
  const ctx = useWorkflowCtx()
  return (
    <a className={`${s.linkBtn} ${iconOnly ? s.linkIcon : ''} ${ghost ? s.ghostLink : ''}`} href={searchOnHref(partNumber, ctx)} target="_blank" rel="noopener noreferrer"
      aria-label={`Search on ${partNumber}`} title={`Search on ${partNumber} (new tab)`} data-testid="search-on">
      <Search size={14} aria-hidden />{!iconOnly && 'Search on'}
    </a>
  )
}

/** Open in PLM is never live in the prototype: rendered disabled with the standard tooltip. */
export function OpenInPlm({ partNumber }: { partNumber: string }) {
  return (
    <Stub id="plm-connectors" note="Disabled, not connected">
      <span title={PLM_DISABLED_TIP} data-testid="open-in-plm-wrap" style={{ display: 'inline-flex' }}>
        <Button size="sm" disabled aria-label={`Open ${partNumber} in PLM (${PLM_DISABLED_TIP})`}><ExternalLink size={14} aria-hidden />Open in PLM</Button>
      </span>
    </Stub>
  )
}

/**
 * The decision actions of the workflow this catalogue was reached from (label and effect come from the registry).
 * Renders nothing when there is no workflow context (plain browsing). Applying one writes the decision and an audit entry,
 * toasts, and returns to where the workflow came from.
 */
export function DecisionButtons({ partNumber, size = 'sm', primary = true }: { partNumber: string; size?: 'sm' | 'md'; primary?: boolean }) {
  const ctx = useWorkflowCtx()
  const audit = useService('audit')
  const config = useConfig()
  const nav = useNavigate()
  if (!ctx) return null
  return (
    <Stub id="audit-trail" note="In-memory audit entry">
      {ctx.def.actions.map((a) => (
        <Button key={a.id} size={size} primary={primary} data-testid="decision-action" aria-label={`${a.label}: ${partNumber}`}
          onClick={() => { const to = applyDecisionAction(ctx, a, partNumber, { audit, config }); toastSuccess(`${a.label}: ${partNumber}`); nav(to) }}>{a.label}</Button>
      ))}
    </Stub>
  )
}
