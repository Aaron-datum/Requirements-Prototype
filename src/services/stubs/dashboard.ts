import type { DashboardService } from '../../domain/types'
import { buildSeries, deriveActionRows, progressSteps, scopeSummary, vizActions, type ActionRow, type Metric, type ScopeSummary, type Step, type VizContext, type VizSeries, type Zoom } from '../../fixtures/derive-projects'
import { ACTIVITY_SEED, DASHBOARD_CONNECTIONS, RECENT_SEED, type ActivitySeed, type RecentSeed } from '../../fixtures/extras/projects/projectData'

// OWNER: Phase 7 (projects). StubId: dashboard-services.
/**
 * The dashboard-services stub: activity, aggregation across program / part / HW level, and connection health, all fixtures
 * and derived rows over the Civic dataset. It extends the `DashboardService` interface with the aggregation methods the
 * dashboard needs; the base methods keep their documented shape (the extras are optional parameters and additive methods).
 */
export interface DashboardServicePlus extends DashboardService {
  actionItems(scope: 'project' | 'output', opts?: { outputId?: string; resolved?: ReadonlySet<string> }): ActionRow[]
  /** Seed activity for "Where you left off" (D-11: merged with ledger audit entries and recents by the screen). */
  activity(): ActivitySeed[]
  recents(): RecentSeed[]
  /** Aggregation across program, part and HW level for one metric. */
  aggregate(zoom: Zoom, metric: Metric, cx: VizContext): VizSeries
  vizActions(zoom: Zoom, metric: Metric, rows: ActionRow[]): Array<{ group: string; items: ActionRow[] }>
  progress(rows: ActionRow[], decisions: Record<string, unknown>): Step[]
  summary(openActions: number): ScopeSummary
}

export const dashboardStub: DashboardServicePlus = {
  actionItems: (scope, opts) => deriveActionRows({ resolved: opts?.resolved, outputId: scope === 'output' ? opts?.outputId : undefined }),
  connections: () => DASHBOARD_CONNECTIONS.map((c) => ({ ...c })),
  activity: () => ACTIVITY_SEED.map((a) => ({ ...a })),
  recents: () => RECENT_SEED.map((r) => ({ ...r })),
  aggregate: (zoom, metric, cx) => buildSeries(zoom, metric, cx),
  vizActions: (zoom, metric, rows) => vizActions(zoom, metric, rows),
  progress: (rows, decisions) => progressSteps(rows, decisions),
  summary: (openActions) => scopeSummary(openActions),
}
