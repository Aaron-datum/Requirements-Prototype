import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { InlineError, Seg, SkeletonRows } from '../../components/ui'
import { Stub } from '../../components/stub/Stub'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { useConfig } from '../../config/useConfig'
import { sortBySeverity } from '../../fixtures/derive-projects'
import { DASHBOARD_RULES, DEFAULT_RESUME, SUBJECT_ROUTES, type OutputDef } from '../../fixtures/extras/projects/projectData'
import { delay } from '../../services/latency'
import { useService } from '../../services/context'
import type { DashboardServicePlus } from '../../services/stubs/dashboard'
import { useLedger } from '../../stores/ledgerStore'
import { useProjectStore } from '../../stores/projectStore'
import { ActionBox, type BoxItem } from './ActionBox'
import { ActionTable } from './ActionTable'
import { GROUP_PREFIX, GROUP_STEPS, allOutputs, hasDashboardData, outputName } from './outputs'
import { SeverityBadge, useVocabOrder } from './shared'
import { StatusBar, type Connection } from './StatusBar'
import { VizSlot } from './VizSlot'
import s from './Projects.module.css'

const stamp = (iso: string): string => iso.slice(0, 16).replace('T', ' ')
const money = (n: number): string => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

/**
 * One dashboard shell, two scopes (D-11, low-fi brief): Project overview (`/projects/:id`) and Output overview
 * (`/projects/:id/outputs/:outputId`). Five bands in order: global nav (the app shell), three action boxes, status bar,
 * data-visualisation slot, overflow table. Content changes with scope; layout does not.
 */
export function ProjectDashboard({ scope }: { scope: 'project' | 'output' }) {
  const { id = '', outputId } = useParams()
  const config = useConfig()
  const nav = useNavigate()
  const dash = useService('dashboard') as DashboardServicePlus
  const plm = useService('plm')
  const projects = useProjectStore((p) => p.projects)
  const recents = useProjectStore((p) => p.recents)
  const saved = useProjectStore((p) => p.saved)
  const audit = useLedger((l) => l.audit)
  const decisions = useLedger((l) => l.decisions)
  const severityOrder = useVocabOrder('severity')

  const project = projects.find((p) => p.id === id)
  const outputs = useMemo(() => (project ? allOutputs(project, saved) : []), [project, saved])
  const output: OutputDef | undefined = scope === 'output' ? outputs.find((o) => o.id === outputId) : undefined
  const planLabel = config.planLabel

  const [ready, setReady] = useState(false)
  useEffect(() => { let on = true; setReady(false); void delay(true).then(() => on && setReady(true)); return () => { on = false } }, [id, outputId])

  const crumbs = project
    ? scope === 'output'
      ? [{ label: 'Home', to: '/' }, { label: 'My Projects', to: '/projects' }, { label: project.name, to: `/projects/${project.id}` }, { label: 'Outputs', to: `/projects/${project.id}/outputs` }, { label: output ? outputName(output, planLabel) : 'Output' }]
      : [{ label: 'Home', to: '/' }, { label: 'My Projects', to: '/projects' }, { label: project.name }]
    : [{ label: 'Home', to: '/' }, { label: 'My Projects', to: '/projects' }, { label: 'Not found' }]
  useBreadcrumbs(crumbs)

  const resolved = useMemo(() => new Set(Object.keys(decisions).map((k) => k.split(':')[1] ?? '')), [decisions])
  const hasData = !!project && hasDashboardData(project.id)
  const rows = useMemo(() => (hasData ? dash.actionItems(scope, { outputId: output?.id, resolved }) : []), [dash, hasData, scope, output?.id, resolved])
  const sorted = useMemo(() => sortBySeverity(rows, severityOrder), [rows, severityOrder])
  const urgent = sorted.filter((r) => r.urgent)
  const review = sorted.filter((r) => !r.urgent)

  const prefix = output ? GROUP_PREFIX[output.group] : undefined
  const left = useMemo<BoxItem[]>(() => {
    const live: BoxItem[] = [
      ...audit.map((e) => ({ id: e.id, at: e.at, title: e.action, sub: `${e.subject.type} ${e.subject.id} · ${e.by} · ${stamp(e.at)}`, to: SUBJECT_ROUTES[e.subject.type] ?? DEFAULT_RESUME })),
      ...recents.map((r) => ({ id: `r-${r.id}`, at: r.at, title: `Searched: ${r.title}`, sub: `Recent search · ${stamp(r.at)}`, to: r.href ?? '/search/new' })),
      ...saved.filter((i) => (i.projectId ?? 'p-civic-si') === id).map((i) => ({ id: `s-${i.id}`, at: i.at, title: `Saved: ${i.title}`, sub: `Saved ${i.kind === 'search' ? 'search' : 'item'} · ${stamp(i.at)}`, to: i.href ?? '/' })),
    ].sort((a, b) => b.at.localeCompare(a.at)).map(({ at: _at, ...rest }) => rest)
    const seeds: BoxItem[] = dash.activity().map((a) => ({ id: a.id, title: a.title, sub: `${a.detail} · ${stamp(a.at)}`, to: a.href }))
    const all = [...live, ...seeds]
    return hasData ? (prefix ? all.filter((i) => i.to.startsWith(prefix)) : all) : live
  }, [audit, recents, saved, dash, id, prefix, hasData])

  const stepsAll = useMemo(() => (hasData ? dash.progress(rows, decisions) : []), [dash, hasData, rows, decisions])
  const steps = output ? stepsAll.filter((x) => GROUP_STEPS[output.group].includes(x.id)) : stepsAll
  const connections = useMemo<Connection[]>(() => [
    ...plm.syncState().map((c) => ({ source: c.source, status: c.connected ? DASHBOARD_RULES.connectedStatuses[0]! : DASHBOARD_RULES.notConnectedText, detail: c.connected ? undefined : `last sync ${c.lastSync}` })),
    ...dash.connections(),
  ], [plm, dash])

  const scopeOutputs = output ? [output] : outputs
  const inputs = {
    label: output ? outputName(output, planLabel) : 'all outputs',
    uploaded: scopeOutputs.flatMap((o) => o.uploaded.map((u) => (output ? u : `${outputName(o, planLabel)}: ${u}`))),
    missing: scopeOutputs.flatMap((o) => o.missing.map((u) => (output ? u : `${outputName(o, planLabel)}: ${u}`))),
  }

  if (!project) return <div className={s.page}><InlineError>No project with id <span className="data">{id}</span>. <Link to="/projects">Back to My Projects</Link></InlineError></div>
  if (scope === 'output' && !output) return <div className={s.page}><InlineError>No output <span className="data">{outputId}</span> in {project.name}. <Link to={`/projects/${project.id}/outputs`}>See the outputs of this project</Link></InlineError></div>

  const title = scope === 'output' ? 'Output overview' : 'Project overview'
  const sub = scope === 'output' && output
    ? `${outputName(output, planLabel)} · ${project.name}${output.due ? ` · due ${output.due}` : ''} · what is uploaded, what is missing, what is still open`
    : hasData ? `${project.name} · RFQ-26-0512 · due 2026-11-20 · what needs doing, who owns it, where the data came from` : `${project.name} · no program data is connected to this project yet`
  const dueLine = urgent.length ? [...urgent].map((r) => r.due).sort()[0] : undefined
  const actions = output?.actions ?? { urgent: { label: 'Review Carryover', to: '/create/requirements/06' }, review: { label: 'Review Surrogates', to: '/create/bom/03' }, resume: { label: 'Continue Where You Left Off', to: left[0]?.to ?? DEFAULT_RESUME } }
  const lead = (sev: string) => <SeverityBadge raw={sev} />
  const toItem = (r: (typeof rows)[number]): BoxItem => ({ id: r.id, lead: lead(r.severity), title: r.title, sub: `${r.status} · ${r.owner.replace(/\s*\(.*\)\s*$/, '')}`, to: r.to })

  const scopeSeg: Array<[string, string]> = [['project', 'Project overview'], ...['BOM', 'Plan'].flatMap((k) => outputs.filter((o) => o.kind === k).slice(0, 1)).map((o): [string, string] => [o.id, `Output overview · ${o.kind === 'Plan' ? planLabel : o.kind}`])]
  const scopeValue = scope === 'output' && output ? output.id : 'project'

  return (
    <div className={s.page} data-testid="dashboard" data-scope={scope}>
      <div className={s.head}>
        <div className="grow col" style={{ gap: 2 }}>
          <h1>{title}</h1>
          <span className={s.sub} data-testid="dashboard-sub">{sub}</span>
        </div>
        <Seg value={scopeValue} label="Dashboard scope" options={scopeSeg} onChange={(v) => nav(v === 'project' ? `/projects/${project.id}` : `/projects/${project.id}/outputs/${v}`)} />
        <Link to={`/projects/${project.id}/outputs`}>All outputs</Link>
      </div>

      {!ready ? <SkeletonRows rows={12} label="Loading dashboard" /> : (
        <>
          <Stub id="dashboard-services" note="Action rows derived from the Civic dataset; activity from the ledger plus seed">
            <div className={s.boxes} data-testid="band-actions">
              <ActionBox id="urgent" title="Urgent or risky action items" count={urgent.length} rows={DASHBOARD_RULES.boxRows}
                line={urgent.length ? `Critical or high severity, dangerous cases and lines with no usable match. Earliest due ${dueLine}.` : 'Nothing urgent in this scope.'}
                items={urgent.map(toItem)} empty="Nothing urgent. Every risky item has a decision." action={actions.urgent} />
              <ActionBox id="review" title="Review items" count={review.length} rows={DASHBOARD_RULES.boxRows}
                line="Surrogates and test mappings waiting for a human decision."
                items={review.map(toItem)} empty="Nothing is waiting for review." action={actions.review} />
              <ActionBox id="left-off" title="Where you left off" count={left.length} rows={DASHBOARD_RULES.boxRows}
                line="Most recent work from this session, the audit trail and recent searches."
                items={left} empty="No activity yet. Start with a search or the RFQ intake." action={left.length ? actions.resume : { label: 'Start at RFQ Intake', to: DEFAULT_RESUME }} />
            </div>
          </Stub>

          <Stub id="plm-connectors" note="Connection health is simulated; Open in PLM stays disabled">
            <StatusBar
              summary={output
                ? <>{outputName(output, planLabel)} · {rows.length} open action{rows.length === 1 ? '' : 's'} · updated {output.updated}</>
                : hasData ? (() => { const m = dash.summary(rows.length); return <>{m.bomLines} BOM lines · {m.requirements} requirements · {m.tests} tests · {money(m.firstOrderCost)} first order · <b style={{ fontWeight: 500 }}>{m.openActions} open actions</b></> })()
                : <>{project.savedSearches} saved searches · {project.outputs} outputs · {project.configurations} configurations</>}
              steps={steps} connections={connections} inputs={inputs} />
          </Stub>

          <VizSlot rows={rows} hasData={hasData} outputGroup={output?.group} />

          <ActionTable rows={sorted} scopeLabel={output ? outputName(output, planLabel) : project.name} />
          <span className="muted">Due dates follow the scope.</span>
        </>
      )}
    </div>
  )
}
