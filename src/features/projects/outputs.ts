import { CIVIC_PROJECT_ID, PROJECT_SCOPES, placeholderOutputs, type OutputDef, type OutputGroup } from '../../fixtures/extras/projects/projectData'
import { SEED_PROJECTS, type Project, type SavedItem } from '../../stores/projectStore'

/** Outputs of a project: the dataset-backed list for the Civic Si project, titles-only placeholders for the others. */
export function projectOutputs(project: Pick<Project, 'id' | 'name'>): OutputDef[] {
  const scope = PROJECT_SCOPES[project.id]
  return scope ? scope.outputs : placeholderOutputs(project.id, project.name, SEED_PROJECTS.find((p) => p.id === project.id)?.outputs ?? 0)
}

export const hasDashboardData = (projectId: string): boolean => projectId in PROJECT_SCOPES
export const isCivic = (projectId: string): boolean => projectId === CIVIC_PROJECT_ID

/** Progress steps and the Create route family that belong to each output group. */
export const GROUP_STEPS: Record<OutputGroup, string[]> = { bom: ['intake', 'tree', 'bom'], tests: ['mapping', 'carryover', 'approve'] }
export const GROUP_PREFIX: Record<OutputGroup, string> = { bom: '/create/bom', tests: '/create/requirements' }

export const outputName = (o: Pick<OutputDef, 'name'>, planLabel: string): string => o.name.replace('{plan}', planLabel)

/** Everything the Outputs list shows: the project's outputs plus items saved into it from anywhere (persistence stub). */
export function allOutputs(project: Pick<Project, 'id' | 'name'>, saved: SavedItem[]): OutputDef[] {
  const base = projectOutputs(project)
  const extra: OutputDef[] = saved.filter((i) => i.kind === 'project-item' && (i.projectId ?? CIVIC_PROJECT_ID) === project.id).map((i) => ({
    id: i.id, name: i.title, group: 'bom' as const, kind: 'Saved item', due: '', updated: i.at.slice(0, 10), uploaded: [], missing: [],
    actions: { urgent: { label: 'Open', to: i.href ?? '/' }, review: { label: 'Open', to: i.href ?? '/' }, resume: { label: 'Open', to: i.href ?? '/' } },
  }))
  return [...base, ...extra]
}
