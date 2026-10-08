/**
 * Datum FE prototype: domain types and service interfaces.
 *
 * Purpose
 *  - Domain types mirror the example dataset in /data (Civic-class 1.5T, three trims) and the search PRD.
 *  - Service interfaces are the seams where the prototype fakes something undesigned. Each interface has a
 *    deterministic stub implementation in src/services/stubs/. Real services replace the stub later with no UI change.
 *  - Every stub carries a StubId. The UI wraps simulated output in <Stub id="..."> so a dev flag (?showStubs=1)
 *    can outline everything that is simulated. StubIds match the Simplification register in docs/01-design-requirements.md.
 *
 * Rules
 *  - Status vocabularies, PLM fields, thresholds and tones are CONFIG, never string literals in components.
 *    Types below use `string` for any configurable vocabulary on purpose.
 *  - Role tags in comments: FE, BE, AI show the likely owner of the real component.
 */

/* ------------------------------------------------------------------ */
/* Stub registry                                                       */
/* ------------------------------------------------------------------ */

export type StubId =
  | 'matching-engine'       // AI  geometric engine behind one MCP server
  | 'cad-viewer'            // FE/AI  real viewer, alignment solver, face picking
  | 'mapping-agent'         // AI/BE  maps source data to canonical form + schema config
  | 'plm-connectors'        // BE  Aras, Windchill, Teamcenter, DOORS, Polarion, AUROS
  | 'doc-extraction'        // AI  RFQ documents to requirements
  | 'cad-parser'            // BE  assembly tree and thumbnails from CAD files
  | 'cost-model'            // AI/BE  model router, feature detector, price feeds
  | 'test-matcher'          // AI  requirement to test proposals
  | 'diff-engine'           // AI/BE  requirement text diff, interface change, Driven-by
  | 'evidence-engine'       // AI  carryover / evidence candidates
  | 'evidence-store'        // BE  evidence records, uploads, test library
  | 'impact-graph'          // BE  dependency graph, multi-hop impact
  | 'autonomy-gate'         // AI/BE  certainty tier decides act or ask
  | 'audit-trail'           // BE  who, when
  | 'plan-service'          // BE  plan record, TDM export, PLM write-back
  | 'persistence'           // BE  projects, saved searches, saved views
  | 'dashboard-services'    // BE  activity log, aggregation, connection health
  | 'search-index'          // BE  part-number-first file and catalogue search
  | 'dfmea-retrieval';      // AI/BE  not in v2; direction only

/* ------------------------------------------------------------------ */
/* Config (everything configurable per tenant / data source)           */
/* ------------------------------------------------------------------ */

export type Tone = 'pass' | 'info' | 'warn' | 'fail' | 'neutral';

/** A vocabulary renders whatever values it is given. Unknown raw values fall back to the raw string with tone 'neutral'. */
export interface StatusVocabulary {
  id: string; // e.g. 'reuseStatus', 'releaseStatus', 'conformanceState', 'dataType', 'workflowApproval'
  values: Array<{ raw: string; label: string; tone: Tone; description?: string }>;
}

export type FieldType = 'text' | 'number' | 'enum' | 'multi-enum' | 'date' | 'boolean' | 'range';
export type FilterControl = 'text-search' | 'multi-tag' | 'multi-search' | 'level-seg' | 'range-units' | 'date-preset';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;               // rendered in mono next to the value
  group?: string;              // sidebar grouping, e.g. 'PLM', 'File'
  filter?: FilterControl;      // control chosen by data type rules in the design system
  vocabularyId?: string;       // value-label lookup for opaque IDs (e.g. 'id1055' -> 'Released')
  showInDetail?: boolean;      // File Details and PLM tabs show all fields with this set
  columnEligible?: boolean;    // may appear as a table column when its filter is active
}

export interface SchemaConfig { id: string; label: string; fields: FieldDef[] }

export interface SimilarityBand { label: string; min: number; tone: Tone } // example: High>=85, Medium>=70, Low<70
export interface AppConfig {
  schema: SchemaConfig;
  vocabularies: StatusVocabulary[];
  similarityBands: SimilarityBand[];
  /** Max measurement columns / captured measurements, example values from the PRD. */
  limits: { maxMeasurements: number; maxExtraColumns: number };
  tenantLabel?: string;        // e.g. 'Adient'
  requirementTableLabel: string; // 'Requirement table' by default, 'TDM' for Adient
  planLabel: 'Test plan' | 'ADV P&R';
}

/* ------------------------------------------------------------------ */
/* Match quality: three independent dimensions                         */
/* ------------------------------------------------------------------ */

export interface MatchQuality {
  confidence?: { score?: number; label?: string; why?: string[] };   // how sure
  similarity?: { percent: number };                                   // how close; band derived from config
  dataType?: { raw: string };                                         // Actual, Estimate, Surrogate... (vocabulary 'dataType')
  /** Top-of-scale classification. 'Exact' is NOT a status. */
  duplicate?: 'geometric-duplicate' | 'duplicate-file';               // different file 100% same geometry | same file
  provenance?: Provenance;
}

export interface Provenance {
  origin: 'computed' | 'manual' | 'user-supplied' | 'confirmed';
  /** user-supplied evidence is "asserted, not computed" until a reviewer verifies it */
  verifiedBy?: string; verifiedAt?: string;
  tags?: string[];             // reasoning tags: RFQ, Carryover, PLM, Supplier, CAD features, Internal
}

/** Workflow approval lifecycle. Not a quality dimension. */
export interface ApprovalState {
  status: string;              // vocabulary 'workflowApproval': e.g. 'Review required' -> 'Confirmed'
  audit: AuditEntry[];
}

export interface AuditEntry {
  id: string; at: string; by: string; action: string; subject: { type: string; id: string }; note?: string;
}

/* ------------------------------------------------------------------ */
/* Example dataset entities (mirror /data/*.json)                      */
/* ------------------------------------------------------------------ */

export interface Program { program_id: string; name: string; model_year: number; status: 'in_production' | 'quoting'; rfq_id: string | null; description: string; owner: string }
export interface Supplier { supplier_id: string; name: string; region: string; category: string }
export interface Part {
  part_id: string; name: string; subsystem: string; material: string; manufacture_method: string;
  complexity: 'Low' | 'Med' | 'High'; weight_kg: number; base_price_usd: number; lead_time_wk: number; supplier_id: string;
}
export interface SurrogateBreakdown { geometry: number; manufacture_complexity: number; material: number; supplier_location: number; order_of_magnitude: number }
export interface BomLine {
  bom_line_id: string; program_id: string; part_id: string; subassembly: string; quantity: number;
  unit_price_usd: number; currency: string; price_source: string; supplier_id: string; region: string;
  certainty: string;           // vocabulary 'dataType' example set: Actual | Surrogate | Estimated | No match
  surrogate_match_pct: number | null; surrogate_breakdown: SurrogateBreakdown | null;
  provenance: string; other_candidates: Array<{ part_id: string; program_id: string; match_pct: number }>;
  carry_note: string | null; match_type: 'duplicate' | 'surrogate' | 'estimated' | 'new' | null;
}
export interface Requirement {
  req_id: string; title: string; subsystem: string; linked_part_id: string; source_type: string; citation: string;
  requirement_text: string; text_status: 'New' | 'Changed' | 'Unchanged'; driven_by_status: 'New' | 'Changed' | 'Unchanged';
  driven_by_confidence: number | null; dangerous_case: boolean; severity: string; owner: string; notes: string;
}
export interface TestDef { test_id: string; name: string; standard: string; lab: string; procedure: string; req_ids: string[] }
export interface RequirementTestLink { req_id: string; test_id: string; match_confidence: number | null; why_matched: string[]; reasoning: string }
export interface TestRun { run_id: string; test_id: string; program_id: string; date: string | null; result: string; samples: number | null; notes: string }
export interface CarryoverEvent { req_id: string; events: Array<{ date: string; event: string; program_id: string; note: string }> }
export interface CostEstimate {
  part_id: string; program_id: string; routing_score: number; routing_status: string; suggested_model: string;
  next_best_alternative: string; why_this_model: Array<{ tag: string; note: string }>;
  input_maturity: { '3d_cad': string; '2d_drawing': string; material_spec: string };
  cost_breakdown: Array<{ line: string; amount_usd: number; confidence: string }>;
}

/* ------------------------------------------------------------------ */
/* Search domain (fixtures generated per docs/04-fixtures-spec.md)      */
/* ------------------------------------------------------------------ */

export type SearchModality = 'part-to-part' | 'part-to-assembly' | 'assembly-to-assembly' | 'part-in-assembly-to-part';

export interface CadFile {
  id: string; name: string; kind: 'part' | 'assembly'; format: string; sizeBytes: number; source: string;
  createdBy: string; created: string; updated: string; lastSynced: string;
  plm: Record<string, string | number | boolean | null>; // keyed by FieldDef.key
  tree?: TreeNode[];            // assemblies only
  thumbnail?: string;
}
export interface TreeNode { id: string; partId?: string; fileId?: string; name: string; children?: TreeNode[]; reference?: boolean }

export interface MeasurementType { key: string; label: string; unit: string } // data-driven: area, perimeter, height, diameter, length...
export interface CapturedMeasurement { id: string; typeKey: string; geometryRef: string; bodyRef?: string; value: number }

export interface SearchQuery {
  modality: SearchModality; fileId: string; activePartId?: string; measurements: CapturedMeasurement[];
}
export interface SearchResultRow {
  id: string; fileId: string; name: string; source: string; created: string; lastEdited: string;
  quality: MatchQuality;
  isSourcePart?: boolean;      // pinned first row, labeled "Source Part", 0%
  measurements: Record<string, { candidate: number | 'manual-required'; deviationPct: number | null }>;
  parentAssemblyId?: string;   // modality 4
  approval?: ApprovalState;    // only when reached from a workflow
}

/* ------------------------------------------------------------------ */
/* Workflow context and decision actions                               */
/* ------------------------------------------------------------------ */

/** A decision action is configured by the workflow the user came from. No hard-coded destination. */
export interface WorkflowContext {
  workflowId: string; returnTo: string;
  decisionActions: Array<{ id: string; label: string; apply: (partId: string) => Promise<void> | void }>;
}

/* ------------------------------------------------------------------ */
/* Service interfaces (each has a stub in src/services/stubs)          */
/* ------------------------------------------------------------------ */

export interface GeometricEngine {          // StubId: matching-engine. Real: one sealed MCP server.
  findSurrogateCandidates(part: Part | CadFile, opts: { limit: number; programs?: string[] }): Promise<Array<{ partId: string; matchPct: number; breakdown: SurrogateBreakdown }>>;
  scorePairSimilarity(a: string, b: string): Promise<{ matchPct: number; breakdown: SurrogateBreakdown }>;
  runSearch(q: SearchQuery): Promise<SearchResultRow[]>;
  deriveMeasurement(fileId: string, typeKey: string, geometryRef: string): Promise<number | 'manual-required'>;
}

export interface ViewerController {         // StubId: cad-viewer. Prototype renders a placeholder with real toolbar state.
  viewMode: 'shaded' | 'x-ray' | 'wireframe' | 'hidden-line';
  setViewMode(m: ViewerController['viewMode']): void;
  /** Simulated picking: the prototype lets the user choose from a list of faces/edges. */
  listPickableGeometry(fileId: string): Array<{ ref: string; kind: 'face' | 'edge' | 'body'; label: string }>;
}

export interface CompareService {           // StubId: cad-viewer + matching-engine
  inferConstraint(faceA: string, faceB: string): 'coplanar' | 'coaxial' | 'concentric' | 'parallel-planes'; // placeholder rule, see PRD section 8
  computeOverlap(a: string, b: string, constraints: number): { queryOnly: number; overlap: number; resultOnly: number; maxDeviationMm: number; bboxDelta: { x: number; y: number; z: number }; volumeMatchPct: number };
}

export interface CatalogueService {         // StubId: search-index
  tree(): Array<{ id: string; label: string; count: number; children?: CatalogueNodeRef[] }>;
  query(nodeId: string, facets: Record<string, string[]>, text?: string): { rows: CatalogueRow[]; facetCounts: Record<string, Record<string, number>> };
}
export type CatalogueNodeRef = { id: string; label: string; count: number; children?: CatalogueNodeRef[] };
export interface CatalogueRow { partNumber: string; fields: Record<string, string | number>; reuseStatus: string }

export interface PlmConnector {             // StubId: plm-connectors. All "Open in PLM" actions render disabled.
  isLive(): false;
  syncState(): Array<{ source: string; connected: boolean; lastSync: string }>;
}
export interface MappingAgent {             // StubId: mapping-agent. I/O contract is NOT defined in any doc. Prototype reads canonical JSON directly.
  mapRecords(raw: unknown[], sourceId: string): Promise<{ records: unknown[]; mappingConfidence?: number }>;
}

export interface DocExtraction { listPackage(rfqId: string): Promise<RfqFile[]>; countRequirements(rfqId: string): Promise<{ extracted: number; implicated: number }> } // StubId: doc-extraction
export interface RfqFile { name: string; detectedAs: string; sizeLabel: string; found: string; route: 'cad-bom' | 'requirements' | 'columns' | 'kept'; requirementCount?: number }

export interface CostModelService {         // StubId: cost-model
  route(partId: string, programId: string): Promise<{ models: Array<{ name: string; score: number }>; why: Array<{ tag: string; note: string }> }>;
  estimate(partId: string, model: string, opts?: { surrogatePartId?: string; supplierId?: string }): Promise<{ lines: Array<{ line: string; amount: number; confidence: number; trace: TraceInput[] }>; landed: number; rangePct: number }>;
}
export interface TraceInput { name: string; value: string; source: string; freshness: string; tag: 'CAD features' | 'PLM or contract' | 'Live feed' | 'Assumed' | 'Computed' }

export interface TestMatcher { proposeTests(reqId: string): Promise<Array<{ testId: string; confidence: number; tags: string[]; reasoning: string[] }>> } // StubId: test-matcher
export interface DiffEngine { textDelta(reqId: string): { state: 'New' | 'Changed' | 'Unchanged'; delta?: string }; drivenBy(reqId: string): { interface: string; state: 'New' | 'Changed' | 'Unchanged'; score: number | null; confirmed: boolean } } // StubId: diff-engine
export interface EvidenceEngine { candidates(reqId: string): Promise<Array<{ recordId: string; score: number; provenance: Provenance['origin'] }>> } // StubId: evidence-engine
export interface ImpactGraph { neighbors(nodeId: string, hops: 1 | 2, direction: 'both' | 'back' | 'forward'): { nodes: Array<{ id: string; type: 'REQ' | 'DOC' | 'PRT' | 'TST' | 'PLN'; needsReview?: boolean }>; edges: Array<{ from: string; to: string; kind: 'depends-on' | 'donates-evidence' }> } } // StubId: impact-graph

export interface AutonomyGate { decide(certainty: string, severity?: string): 'carry-forward' | 'propose' | 'ask-human' } // StubId: autonomy-gate. Rule table: Actual -> carry-forward; Surrogate -> propose; others -> ask-human.
export interface AuditService { record(e: Omit<AuditEntry, 'id' | 'at'>): AuditEntry; list(subject?: { type: string; id: string }): AuditEntry[] } // StubId: audit-trail. Prototype: in-memory, shown in UI.
export interface PlanService { create(input: { name: string; owners: Record<string, string> }): Promise<{ planId: string }> }       // StubId: plan-service. Export and Open in PLM stay inert.
export interface PersistenceService { save<T>(kind: 'view' | 'search' | 'project-item', value: T): Promise<{ id: string }>; reset(): void } // StubId: persistence
export interface DashboardService { actionItems(scope: 'project' | 'output'): Array<{ id: string; title: string; severity: string; owner: string; due?: string; impact?: string }>; connections(): Array<{ source: string; status: string }> } // StubId: dashboard-services

export interface Services {
  engine: GeometricEngine; viewer: ViewerController; compare: CompareService; catalogue: CatalogueService; plm: PlmConnector;
  mapping: MappingAgent; docs: DocExtraction; cost: CostModelService; tests: TestMatcher; diff: DiffEngine; evidence: EvidenceEngine;
  impact: ImpactGraph; gate: AutonomyGate; audit: AuditService; plan: PlanService; persistence: PersistenceService; dashboard: DashboardService;
}
