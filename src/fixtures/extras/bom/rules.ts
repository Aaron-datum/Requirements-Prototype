/**
 * BOM and cost rules that are configuration, not code. Shared by the derive layer, the stubs and the screens.
 * Every raw value below is a vocabulary value (see the `dataType` vocabulary in config/appConfig.ts); screens render them
 * through vocabularies and never compare against them inline.
 */
import type { TraceInput } from '../../../domain/types'

/** Certainty tiers best to worst (the order of the data-type vocabulary's example set). */
export const TIER_ORDER = ['Actual', 'Surrogate', 'Estimated', 'No match', 'Search failed'] as const
/** No CAD caps a line's certainty at this tier or below (docs/01: "No CAD caps certainty at Estimated"). */
export const NO_CAD_CAP = 'Estimated'
/** A confirmed surrogate keeps the Surrogate tier and gains the Confirmed workflow status. */
export const CONFIRMED_AS = 'Surrogate'
export const FAILED_RAW = 'Search failed'
/** Tier a manual or CAD-attached line takes when the engine finds a candidate above the surrogate floor. */
export const SURROGATE_RAW = 'Surrogate'
export const ESTIMATED_RAW = 'Estimated'
export const NO_MATCH_RAW = 'No match'
/** Severity tiers (first N of the severity vocabulary order) that count towards cost risk. */
export const RISK_SEVERITY_TIERS = 2

/** The six fixed cost lines (docs/01: 03d). One canonical structure for the estimate and the BOM price. */
export const COST_LINES = [
  { key: 'material', label: 'Material', formula: '= mass × material price × (1 + scrap)' },
  { key: 'machining', label: 'Machining', formula: '= cycle time × machine rate ÷ yield' },
  { key: 'setup', label: 'Setup and tooling', formula: '= tooling cost ÷ lifetime volume + setup allocation' },
  { key: 'finishing', label: 'Finishing', formula: '= surface area × finish rate' },
  { key: 'overhead', label: 'Overhead and margin', formula: '= (material + machining + setup + finishing) × overhead rate' },
  { key: 'logistics', label: 'Logistics and duty', formula: '= freight + duty rate × landed value' },
] as const
export type CostLineKey = (typeof COST_LINES)[number]['key']

/** Range rule (docs/01: 03d): ±5% at confidence 90 or above, ±9.4% at 80 or above, otherwise ±15%. */
export const RANGE_RULE: Array<{ min: number; pct: number }> = [{ min: 90, pct: 5 }, { min: 80, pct: 9.4 }, { min: 0, pct: 15 }]
export const rangePctFor = (confidence: number): number => (RANGE_RULE.find((r) => confidence >= r.min) ?? RANGE_RULE[RANGE_RULE.length - 1]!).pct

/** Confidence ceiling per tier: a model that only reaches Surrogate cannot show more than this numeric confidence. */
export const CEILING_CAP: Record<string, number> = { Actual: 100, Surrogate: 88, Estimated: 72 }

/** Cost-model families: how to recognise one from a model name, what input it needs, its confidence ceiling and how its lines shift. */
export interface ModelFamily {
  key: string
  match: RegExp
  label: string
  /** Inputs this family needs. Inputs it does not need read "Not needed" in the maturity table. */
  needs: { cad3d: boolean; drawing2d: boolean; materialSpec: boolean }
  ceiling: string
  /** Relative line multipliers: material, machining, setup, finishing, overhead, logistics. */
  shape: [number, number, number, number, number, number]
}
export const MODEL_FAMILIES: ModelFamily[] = [
  { key: 'quote', match: /quot|analog/i, label: 'Supplier-quoted analog', needs: { cad3d: false, drawing2d: false, materialSpec: false }, ceiling: 'Surrogate', shape: [1, 1, 1, 1, 1, 1] },
  { key: 'casting', match: /cast/i, label: 'Casting', needs: { cad3d: true, drawing2d: false, materialSpec: true }, ceiling: 'Surrogate', shape: [0.92, 0.45, 1.9, 1.4, 0.95, 0.98] },
  { key: 'billet', match: /billet|machin|mill/i, label: 'Machined billet', needs: { cad3d: true, drawing2d: true, materialSpec: true }, ceiling: 'Surrogate', shape: [1.15, 1.25, 0.55, 0.9, 1.02, 1.0] },
  { key: 'forging', match: /forg/i, label: 'Forging', needs: { cad3d: true, drawing2d: true, materialSpec: true }, ceiling: 'Estimated', shape: [1.05, 0.85, 1.6, 1.1, 1.0, 1.0] },
  { key: 'assembly', match: /assembl|braz|thermocouple|sensor|should/i, label: 'Should-cost build-up', needs: { cad3d: true, drawing2d: false, materialSpec: true }, ceiling: 'Surrogate', shape: [1, 1, 1, 1, 1, 1] },
  { key: 'parametric', match: /./, label: 'Parametric', needs: { cad3d: true, drawing2d: false, materialSpec: false }, ceiling: 'Estimated', shape: [1.04, 1.1, 1.0, 1.0, 1.0, 1.0] },
]
export const modelFamily = (modelName: string): ModelFamily => MODEL_FAMILIES.find((f) => f.match.test(modelName)) ?? MODEL_FAMILIES[MODEL_FAMILIES.length - 1]!

/** Tooling label by manufacture-method keyword (the dataset has no tooling field). First match wins. */
export const TOOLING_BY_METHOD: Array<{ match: RegExp; tooling: string }> = [
  { match: /die cast|casting|forging|stamping|molding|molded|extrusion|powder/i, tooling: 'Hard tooling' },
  { match: /machin|milling|bending|winding|grinding/i, tooling: 'Fixtures' },
  { match: /assembly|sensor|thermocouple|smt/i, tooling: 'Test rigs' },
]
export const toolingFor = (method: string): string => TOOLING_BY_METHOD.find((t) => t.match.test(method))?.tooling ?? 'None'

/** Connected sources and what disconnecting them does downstream (docs/01: intake). */
export interface SourceDef { id: string; plmSource: string; label: string; widensRiskBy: number; relabelsQuotes: boolean; note: string }
export const SOURCES: SourceDef[] = [
  { id: 'sap', plmSource: 'SAP S/4HANA', label: 'SAP S/4HANA', widensRiskBy: 2.4, relabelsQuotes: true, note: 'Supplier quotes and part master. Disconnecting relabels quote sources "Cached quote".' },
  { id: 'lme', plmSource: 'LME aluminium · nickel', label: 'LME aluminium · nickel', widensRiskBy: 1.2, relabelsQuotes: false, note: 'Commodity index behind material cost. Disconnecting widens the cost-risk band.' },
  { id: 'ecb', plmSource: 'ECB reference rates', label: 'ECB reference rates', widensRiskBy: 0.9, relabelsQuotes: false, note: 'FX rates behind non-USD quotes. Disconnecting widens the cost-risk band.' },
]
/** Price-source raw values (dataset) and how a disconnected quote source is shown. */
export const QUOTE_SOURCE_RAW = 'Supplier quote'
export const CACHED_QUOTE_LABEL = 'Cached quote'

/** Region prefix to logistics factor and FX exposure (illustrative lookups: the dataset has no logistics data). */
export const REGION_LOGISTICS: Record<string, { factor: number; fx: number; tariff: number }> = {
  US: { factor: 1.0, fx: 0, tariff: 0 }, CA: { factor: 0.9, fx: 1.8, tariff: 0.4 }, MX: { factor: 0.8, fx: 2.6, tariff: 0.8 },
  DE: { factor: 1.2, fx: 3.4, tariff: 2.4 }, FR: { factor: 1.2, fx: 3.4, tariff: 2.4 }, JP: { factor: 1.3, fx: 4.1, tariff: 2.8 },
}
export const regionKey = (region: string): string => region.slice(0, 2)

/** Cost-estimate parameters used by trace inputs when a part has no seeded extras. */
export interface CostParams {
  massKg: number; materialSpec: string; materialPricePerKg: number; scrapPct: number; cycleMin: number; machineRate: string; yieldPct: number
  toolingCost: number; lifetimeVolume: number; surfaceDm2: number; ohPct: number; freight: number; dutyPct: number; plant: string; faces: string
}

export const TRACE_TAGS: TraceInput['tag'][] = ['CAD features', 'PLM or contract', 'Live feed', 'Assumed', 'Computed']
/** Compare mode: at most this many alternates, from three groups (docs/01: 03d). */
export const MAX_ALTERNATES = 3
/** Confidence points lost per month since the price date (the dataset has no decay data; docs/01 marks the literal as a stub). */
export const DECAY_PTS_PER_MONTH = 1.5
export const PRICE_DATE = '2026-06'

/** Requirement count scaling: how many extracted requirements are in scope for this BOM (docs/05 D-09). */
export const EXTRACTED_REQUIREMENTS_FULL = 244

/** Price source as displayed: quote sources read "Cached quote" while SAP is disconnected. */
export const priceSourceLabel = (raw: string, sapConnected: boolean): string => (!sapConnected && raw === QUOTE_SOURCE_RAW ? CACHED_QUOTE_LABEL : raw)
