import { buildAppConfig } from '../../config/appConfig'
import type { ImpactGraph } from '../../domain/types'
import { buildImpactGraph, KEYS, neighborhood } from '../../fixtures/derive-requirements'
import { useAppStore } from '../../stores/appStore'
import { useLedger } from '../../stores/ledgerStore'

// OWNER: Phase 6 (requirements). StubId: impact-graph.
/**
 * Adjacency built from the dataset links (requirements, documents, parts, tests and runs, the plan). One or two hops, direction filter.
 * Edges point from the upstream node to the dependent one: back follows what a node depends on, forward follows what depends on it.
 * Contradicts and Supersedes exist in the edge type union (D-10) but this stub never emits them. needsReview is true for nodes a person flagged.
 */
export const impactStub: ImpactGraph = {
  neighbors(nodeId, hops, direction) {
    const floor = buildAppConfig(useAppStore.getState().tenantId).thresholds.evidenceFloor
    const hood = neighborhood(buildImpactGraph(floor), nodeId, hops, direction)
    const flags = useLedger.getState().decisions
    return {
      nodes: hood.nodes.map((n) => ({ ...n, needsReview: !!flags[KEYS.flag(n.id)] })),
      edges: hood.edges.map((e) => ({ from: e.from, to: e.to, kind: e.kind, label: e.label })),
    }
  },
}
