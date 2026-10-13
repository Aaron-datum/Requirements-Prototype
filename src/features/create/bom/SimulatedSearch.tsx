import { Link, useNavigate } from 'react-router-dom'
import { AuditList } from '../../../components/audit/Audit'
import { Stub } from '../../../components/stub/Stub'
import { Badge, Button, EmptyState } from '../../../components/ui'
import { useConfig } from '../../../config/useConfig'
import { useBreadcrumbs } from '../../../components/shell/useBreadcrumbs'
import { parts } from '../../../fixtures/civic'
import { applyDecisionAction, useWorkflowCtx } from '../../../lib/workflowContext'
import { useService } from '../../../services/context'
import { toastSuccess } from '../../../stores/toastStore'
import s from './bom.module.css'

/**
 * TEST-ONLY stand-in for the Search area's Results screen (route /dev/bom-decision), used until Search is merged.
 * It carries the same workflow context (?ctx=bom-review:<line>&ret=...) and offers the context's decision actions, calling the same
 * applyDecisionAction the Search area calls. Not part of the product flow.
 */
export function SimulatedSearch() {
  useBreadcrumbs([{ label: 'Dev' }, { label: 'Simulated search decision' }])
  const ctx = useWorkflowCtx()
  const config = useConfig()
  const audit = useService('audit')
  const nav = useNavigate()
  if (!ctx) return <div className={s.page}><EmptyState title="No workflow context">Open this page with ?ctx=bom-review:&lt;bom_line_id&gt;&amp;ret=&lt;return path&gt;.</EmptyState></div>
  const candidates = parts.filter((p) => /^(TC-404-B|TC-404-A|INT-510-B|ELEC-920-A)$/.test(p.part_id))
  return (
    <div className={s.page} data-testid="sim-search">
      <div className="col" style={{ gap: 4 }}><h1 className="text-page">Search results (stand-in)</h1><span className="secondary">Reached from {ctx.def.label} for <span className="data">{ctx.subject}</span>. The Search area is not merged yet; this page applies the same decision action.</span></div>
      <Stub id="audit-trail" note="Ledger-backed audit">
        <div className={s.tableWrap}>
          <table className={s.tbl}><thead><tr><th>Part</th><th>Name</th><th>Decision</th></tr></thead><tbody>
            {candidates.map((p) => (
              <tr key={p.part_id}><td className="data">{p.part_id}</td><td>{p.name}</td>
                <td>{ctx.def.actions.map((a) => (
                  <Button key={a.id} size="sm" onClick={() => { const to = applyDecisionAction(ctx, a, p.part_id, { audit, config }); toastSuccess(`${a.label}: ${p.part_id}`); void to }}>{a.label}</Button>))}</td></tr>))}
          </tbody></table>
        </div>
      </Stub>
      <div className="row"><Badge tone="outline">Return to</Badge><Link to={ctx.returnTo} data-testid="return-link">{ctx.returnTo}</Link><Button size="sm" onClick={() => nav(ctx.returnTo)}>Back to BOM review</Button></div>
      <AuditList subject={{ type: ctx.def.subjectType, id: ctx.subject }} />
    </div>
  )
}
