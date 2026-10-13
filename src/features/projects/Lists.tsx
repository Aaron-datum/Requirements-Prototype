import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { TableShell } from '../../components/table/TableShell'
import type { ColumnDef } from '../../components/table/types'
import { InlineError } from '../../components/ui'
import { useConfig } from '../../config/useConfig'
import { CONFIGURATIONS } from '../../fixtures/extras/projects/projectData'
import { delay } from '../../services/latency'
import { useProjectStore, type Project } from '../../stores/projectStore'
import { allOutputs, outputName } from './outputs'
import s from './Projects.module.css'

function useReady(key: string): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => { let on = true; setReady(false); void delay(true).then(() => on && setReady(true)); return () => { on = false } }, [key])
  return ready
}

function ListPage({ title, sub, children }: { title: string; sub: ReactNode; children: ReactNode }) {
  return (
    <div className={s.listPage}>
      <div className="col" style={{ gap: 2 }}><h1 className="text-page">{title}</h1><span className={s.sub}>{sub}</span></div>
      {children}
    </div>
  )
}
const wrap = (children: ReactNode, h = 360) => <div className={s.tableWrap} style={{ height: h }}>{children}</div>

/** `/projects`: the project list. Every row opens that project's overview. */
export function ProjectsList() {
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'My Projects' }])
  const projects = useProjectStore((p) => p.projects)
  const ready = useReady('projects')
  const columns = useMemo<Array<ColumnDef<Project>>>(() => [
    { key: 'name', label: 'Project', get: (p) => p.name, filter: 'text-search', pinned: true, render: (p) => <Link to={`/projects/${p.id}`}>{p.name}</Link> },
    { key: 'savedSearches', label: 'Saved searches', get: (p) => p.savedSearches, align: 'right', filter: 'none' },
    { key: 'outputs', label: 'Outputs', get: (p) => p.outputs, align: 'right', filter: 'none', render: (p) => <Link to={`/projects/${p.id}/outputs`}>{p.outputs}</Link> },
    { key: 'configurations', label: 'Configurations', get: (p) => p.configurations, align: 'right', filter: 'none', render: (p) => <Link to={`/projects/${p.id}/configurations`}>{p.configurations}</Link> },
  ], [])
  return (
    <ListPage title="My Projects" sub="Each project has saved searches, outputs and configurations. Open one to see its dashboard.">
      {wrap(<TableShell<Project> id="projects" noun="projects" columns={columns} rows={projects} rowId={(p) => p.id} sidebar={false} loading={!ready}
        rowActions={(p) => <Link to={`/projects/${p.id}`}>Open overview</Link>} actionsLabel="Dashboard"
        empty={{ title: 'No projects yet', body: 'Use the plus beside My Projects in the left navigation to create one.' }} />)}
    </ListPage>
  )
}

interface OutputRow { id: string; name: string; kind: string; due: string; updated: string; uploaded: number; missing: number }

/** `/projects/:id/outputs`: outputs of the project plus anything saved into it from anywhere. */
export function OutputsList() {
  const { id = '' } = useParams()
  const config = useConfig()
  const project = useProjectStore((p) => p.projects.find((x) => x.id === id))
  const saved = useProjectStore((p) => p.saved)
  const ready = useReady(`outputs-${id}`)
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'My Projects', to: '/projects' }, { label: project?.name ?? 'Project', to: `/projects/${id}` }, { label: 'Outputs' }])
  const rows = useMemo<OutputRow[]>(() => (project ? allOutputs(project, saved).map((o) => ({ id: o.id, name: outputName(o, config.planLabel), kind: o.kind, due: o.due || 'No due date', updated: o.updated, uploaded: o.uploaded.length, missing: o.missing.length })) : []), [project, saved, config.planLabel])
  const columns = useMemo<Array<ColumnDef<OutputRow>>>(() => [
    { key: 'name', label: 'Output', get: (r) => r.name, filter: 'text-search', pinned: true, render: (r) => <Link to={`/projects/${id}/outputs/${r.id}`}>{r.name}</Link> },
    { key: 'kind', label: 'Kind', get: (r) => r.kind, filter: 'multi-tag' },
    { key: 'due', label: 'Due', get: (r) => r.due, filter: 'none', render: (r) => <span className="data">{r.due}</span> },
    { key: 'uploaded', label: 'Uploaded', get: (r) => r.uploaded, align: 'right', filter: 'none' },
    { key: 'missing', label: 'Missing', get: (r) => r.missing, align: 'right', filter: 'none' },
    { key: 'updated', label: 'Updated', get: (r) => r.updated, filter: 'none', render: (r) => <span className="data">{r.updated}</span> },
  ], [id])
  if (!project) return <ListPage title="Outputs" sub=""><InlineError>No project with id <span className="data">{id}</span>. <Link to="/projects">Back to My Projects</Link></InlineError></ListPage>
  return (
    <ListPage title={`Outputs · ${project.name}`} sub="BOMs, cost estimates, requirement mappings and plans created in this project. Saved items appear here.">
      {wrap(<TableShell<OutputRow> id="outputs" noun="outputs" columns={columns} rows={rows} rowId={(r) => r.id} sidebar={false} loading={!ready}
        rowActions={(r) => <Link to={`/projects/${id}/outputs/${r.id}`}>Open overview</Link>} actionsLabel="Dashboard"
        empty={{ title: 'No outputs yet', body: 'Run a workflow from Create to produce one.' }} />)}
    </ListPage>
  )
}

interface ConfigRow { id: string; name: string; detail: string; updated: string }

/** `/projects/:id/configurations`: saved configurations and saved views of the project. */
export function ConfigurationsList() {
  const { id = '' } = useParams()
  const project = useProjectStore((p) => p.projects.find((x) => x.id === id))
  const views = useProjectStore((p) => p.views)
  const ready = useReady(`configs-${id}`)
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'My Projects', to: '/projects' }, { label: project?.name ?? 'Project', to: `/projects/${id}` }, { label: 'Configurations' }])
  const rows = useMemo<ConfigRow[]>(() => [
    ...(CONFIGURATIONS[id] ?? []),
    ...views.filter((v) => (v.projectId ?? 'p-civic-si') === id).map((v) => ({ id: v.id, name: v.title, detail: 'Saved view', updated: v.at.slice(0, 10) })),
  ], [id, views])
  const columns = useMemo<Array<ColumnDef<ConfigRow>>>(() => [
    { key: 'name', label: 'Configuration', get: (r) => r.name, filter: 'text-search', pinned: true, render: (r) => r.name },
    { key: 'detail', label: 'Detail', get: (r) => r.detail, filter: 'none' },
    { key: 'updated', label: 'Updated', get: (r) => r.updated, filter: 'none', render: (r) => <span className="data">{r.updated}</span> },
  ], [])
  if (!project) return <ListPage title="Configurations" sub=""><InlineError>No project with id <span className="data">{id}</span>. <Link to="/projects">Back to My Projects</Link></InlineError></ListPage>
  return (
    <ListPage title={`Configurations · ${project.name}`} sub="Saved search configurations and views. A view saved from any table appears here.">
      {wrap(<TableShell<ConfigRow> id="configurations" noun="configurations" columns={columns} rows={rows} rowId={(r) => r.id} sidebar={false} loading={!ready}
        empty={{ title: 'No configurations yet', body: 'Use Save Current View on any table to add one.' }} />)}
    </ListPage>
  )
}
