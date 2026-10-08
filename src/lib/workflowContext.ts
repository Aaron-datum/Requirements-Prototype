import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { WORKFLOWS, type DecisionActionDef, type WorkflowDef } from '../config/workflows'
import type { AppConfigFull } from '../domain/extra'
import type { AuditService } from '../domain/types'
import { useLedger } from '../stores/ledgerStore'
import { now } from './clock'

/** A workflow context as carried in the URL: ?ctx=bom-review:BOML-0152&ret=/create/bom/review */
export interface WorkflowCtx { workflowId: string; subject: string; returnTo: string; def: WorkflowDef }

export function parseCtx(params: URLSearchParams): WorkflowCtx | null {
  const raw = params.get('ctx')
  if (!raw) return null
  const i = raw.indexOf(':')
  const workflowId = i < 0 ? raw : raw.slice(0, i)
  const def = WORKFLOWS[workflowId]
  if (!def) return null
  return { workflowId, subject: i < 0 ? '' : raw.slice(i + 1), returnTo: params.get('ret') ?? '/', def }
}
/** Hook: the workflow context of the current URL, or null (plain browsing: no decision actions). */
export function useWorkflowCtx(): WorkflowCtx | null {
  const [params] = useSearchParams()
  const raw = params.toString()
  return useMemo(() => parseCtx(new URLSearchParams(raw)), [raw])
}
/** Query-string fragment that carries a workflow context onto another URL. */
export const ctxQuery = (workflowId: string, subject: string, returnTo: string): string => `ctx=${encodeURIComponent(`${workflowId}:${subject}`)}&ret=${encodeURIComponent(returnTo)}`
/** Append the current workflow context (if any) to a URL so Define, Results and Compare keep it. */
export const withCtx = (url: string, ctx: WorkflowCtx | null): string => (ctx ? `${url}${url.includes('?') ? '&' : '?'}${ctxQuery(ctx.workflowId, ctx.subject, ctx.returnTo)}` : url)
/** "Search on" for a part or assembly: opens a new search with that part active. Callers open it with target="_blank". */
export const searchOnHref = (fileId: string, ctx?: WorkflowCtx | null, modality = 'part-to-part'): string => withCtx(`/search/define?file=${encodeURIComponent(fileId)}&modality=${modality}`, ctx ?? null)

/** Ledger key for a decision recorded by a workflow action. e.g. decisionKey('select-surrogate', 'BOML-0152') */
export const decisionKey = (effect: DecisionActionDef['effect'], subject: string): string => `${effect}:${subject}`

/**
 * Apply a decision action: record the decision in the ledger (synced across tabs), write an audit entry (time, actor),
 * and return where to go next. Toasts are the caller's job (success only).
 * The workflow tab reads the ledger (useLedger) to show the change and the audit entry.
 */
export function applyDecisionAction(ctx: WorkflowCtx, action: DecisionActionDef, partId: string, deps: { audit: AuditService; config: Pick<AppConfigFull, 'currentUser'> }): string {
  const by = deps.config.currentUser.name
  useLedger.getState().setDecision(decisionKey(action.effect, ctx.subject), partId, now(), by)
  deps.audit.record({ by, action: `${action.label}: ${partId}`, subject: { type: ctx.def.subjectType, id: ctx.subject }, note: `from ${ctx.def.label}` })
  return ctx.returnTo
}
