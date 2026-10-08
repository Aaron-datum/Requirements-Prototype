import type { StubId } from '../../domain/types'

/**
 * The stub registry. One row per StubId from the simplification register in docs/01-design-requirements.md and the stub
 * table in docs/02-implementation-plan.md section 6. /dev/stubs renders this. `screens` lists where the stub shows up.
 */
export interface StubInfo { id: StubId; owner: 'FE' | 'BE' | 'AI' | 'FE/AI' | 'AI/BE'; does: string; screens: string[] }

export const STUB_REGISTRY: StubInfo[] = [
  { id: 'matching-engine', owner: 'AI', does: 'Deterministic scores from fixtures. Same inputs, same ranking. Surrogate search ranks candidates by a hash-seeded score with the five-metric breakdown from the dataset where it exists.', screens: ['Results', 'Compare', 'BOM review', 'Catalogue', '03b Compare parts'] },
  { id: 'cad-viewer', owner: 'FE/AI', does: 'Placeholder viewport with real toolbar state (view modes, linked cameras, overlay legend). Face and edge picking is a list of named geometry the user chooses from.', screens: ['Define', 'Compare', '03b Compare parts', 'Catalogue compare'] },
  { id: 'mapping-agent', owner: 'AI/BE', does: 'None. Components read canonical JSON directly. The Settings schema picker swaps the SchemaConfig to prove configurability.', screens: ['Files', 'Results', 'BOM review'] },
  { id: 'plm-connectors', owner: 'BE', does: 'Toggles, last-sync strings and disabled "Open in PLM" links with the tooltip "Not connected in prototype".', screens: ['Intake', 'Files', 'Drawers', 'Dashboard'] },
  { id: 'doc-extraction', owner: 'AI', does: 'Static package list with detected types, counts and routes.', screens: ['Intake', 'Composition'] },
  { id: 'cad-parser', owner: 'BE', does: 'Fixed assembly tree and counts from fixtures.', screens: ['Intake', 'Assembly tree', 'Files'] },
  { id: 'cost-model', owner: 'AI/BE', does: 'Three models for the worked part. Lines from cost_estimates.json.', screens: ['BOM review', '03d Cost estimate'] },
  { id: 'test-matcher', owner: 'AI', does: 'Static mappings from requirement_test_links.json. The 50% floor comes from config.', screens: ['05 Mapping', '06 Carryover', '03c'] },
  { id: 'diff-engine', owner: 'AI/BE', does: 'Lookup from requirement statuses in the dataset.', screens: ['05 Mapping', '06c Trace'] },
  { id: 'evidence-engine', owner: 'AI', does: 'Ranked candidates from carryover events.', screens: ['06 Carryover'] },
  { id: 'evidence-store', owner: 'BE', does: 'Eight hard-coded records. Uploads create an in-memory record flagged "asserted, not computed".', screens: ['06 Carryover', 'Test detail'] },
  { id: 'impact-graph', owner: 'BE', does: 'Adjacency built from dataset links. One or two hops, direction filter.', screens: ['06b Impact map', '03c', '06c Trace'] },
  { id: 'autonomy-gate', owner: 'AI/BE', does: 'Rule table: Actual carries forward, Surrogate proposes, everything else asks a human. A config object, not code.', screens: ['05 Mapping', '06 Carryover'] },
  { id: 'audit-trail', owner: 'BE', does: 'In-memory list (mirrored across tabs). Every confirm, approve and decision action writes an entry, visible in the UI.', screens: ['Results', '05', '06', '06b', '07'] },
  { id: 'plan-service', owner: 'BE', does: 'Hard-coded plan ID. Export and Open in PLM are inert.', screens: ['07 Approve'] },
  { id: 'persistence', owner: 'BE', does: 'In-memory. Save buttons add to the visible Project tree and show a success toast. Reset in the dev toolbar.', screens: ['My Projects', 'Save Search', 'Save View'] },
  { id: 'dashboard-services', owner: 'BE', does: 'Fixtures for activity, aggregation and connection health.', screens: ['Projects dashboard'] },
  { id: 'search-index', owner: 'BE', does: 'Client-side filter with part-number-first matching (case, spacing and wildcard tolerant).', screens: ['Files', 'Home search', 'Catalogue'] },
  { id: 'dfmea-retrieval', owner: 'AI/BE', does: 'Not built. Direction only.', screens: [] },
]
export const STUB_IDS = STUB_REGISTRY.map((s) => s.id)
