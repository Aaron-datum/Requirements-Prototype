import { useCallback, useMemo } from 'react'
import { useConfig } from '../../../config/useConfig'
import {
  buildBomRows, composition, lineMode, requirementScope, trackCounts, treeSummary, type BomViewRow, type KpiConfig, type LineMode,
} from '../../../fixtures/derive-bom'
import { stillOpenList } from '../../../fixtures/derive'
import { RISK_SEVERITY_TIERS } from '../../../fixtures/extras/bom/rules'
import { decisionKey } from '../../../lib/workflowContext'
import { now } from '../../../lib/clock'
import { useService } from '../../../services/context'
import { useLedger } from '../../../stores/ledgerStore'
import { toastSuccess } from '../../../stores/toastStore'
import { useBomStore } from './bomStore'

/** The BOM as the user has shaped it: dataset, tree selection, search state, and decisions recorded in the ledger (this or another tab). */
export function useBomRows(): BomViewRow[] {
  const config = useConfig()
  const tree = useBomStore((s) => s.tree)
  const routes = useBomStore((s) => s.routes)
  const search = useBomStore((s) => s.search)
  const failedRetried = useBomStore((s) => s.failedRetried)
  const decisions = useLedger((l) => l.decisions)
  return useMemo(() => buildBomRows({
    tree, assemblyRouted: trackCounts(routes).assemblyRouted, searched: search === 'done', failedRetried,
    decisionFor: (id) => decisions[decisionKey('select-surrogate', id)], thresholds: config.thresholds,
  }), [tree, routes, search, failedRetried, decisions, config.thresholds])
}

/** Row mode (carry, propose, estimate, unresolved) decided by the autonomy-gate service and config, never by comparing a status string. */
export function useLineMode(): (r: Pick<BomViewRow, 'certainty'>) => LineMode {
  const gate = useService('gate')
  const config = useConfig()
  return useCallback((r) => lineMode(r.certainty, (c) => gate.decide(c), config.matchRules.noSimilarityTypes), [gate, config.matchRules.noSimilarityTypes])
}

/** Raw values for the KPI roll-up: reuse = tiers the agent may carry or propose; risk = tiers always routed to a person. */
export function useKpiConfig(): KpiConfig {
  const gate = useService('gate')
  const config = useConfig()
  return useMemo(() => {
    const types = config.vocabularies.find((v) => v.id === 'dataType')?.values.map((v) => v.raw) ?? []
    const severities = config.vocabularies.find((v) => v.id === 'severity')?.values.map((v) => v.raw) ?? []
    return {
      reuseTypes: types.filter((t) => gate.decide(t) !== 'ask-human'), riskTypes: types.filter((t) => gate.decide(t) === 'ask-human'),
      riskSeverities: severities.slice(0, RISK_SEVERITY_TIERS),
    }
  }, [gate, config.vocabularies])
}

/** Sub-labels of the pipeline stepper, recomputed from state every render. */
export function useStepSubLabels(): Record<string, string> {
  const config = useConfig()
  const routes = useBomStore((s) => s.routes)
  const tree = useBomStore((s) => s.tree)
  const search = useBomStore((s) => s.search)
  const rows = useBomRows()
  const modeOf = useLineMode()
  return useMemo(() => {
    const t = trackCounts(routes), sum = treeSummary(tree)
    const proposed = rows.filter((r) => modeOf(r) === 'propose')
    const comp = composition(rows, config.matchRules.noSimilarityTypes)
    const total = 8
    return {
      '01-intake': `${total} files · ${t.docs.documents} to requirements`,
      '02-tree': t.assemblyRouted ? `${sum.lines} of ${sum.parts + sum.manual} parts selected` : 'No CAD routed to BOM',
      '03-review': search === 'done' ? `${proposed.filter((r) => r.confirmed).length} of ${proposed.length} surrogates confirmed` : search === 'running' ? 'Searching' : 'Not searched',
      '04-composition': search === 'done' ? `${comp.new.length} new · ${comp.carryover.length} carryover · ${comp.uncertain.length} uncertain` : 'After the search',
      '05-mapping': `${requirementScope(routes).traced} requirements to map`,
      '06-carryover': `${stillOpenList().length} flagged for review`,
      '07-approve': `${config.planLabel} not created`,
    }
  }, [routes, tree, search, rows, modeOf, config.matchRules.noSimilarityTypes, config.planLabel])
}

/** Accept (or undo) a surrogate: writes the ledger decision (same key the Search area writes) and an audit entry, then a success toast. */
export function useSurrogateActions() {
  const config = useConfig()
  const audit = useService('audit')
  const accept = useCallback((row: Pick<BomViewRow, 'id' | 'partNumber' | 'matchPct'>, partId: string) => {
    const by = config.currentUser.name
    useLedger.getState().setDecision(decisionKey('select-surrogate', row.id), partId, now(), by)
    audit.record({ by, action: `Accepted surrogate: ${row.partNumber} ← ${partId}`, subject: { type: 'bom-line', id: row.id }, note: row.matchPct != null ? `${row.matchPct}% match` : undefined })
    toastSuccess(`Confirmed surrogate: ${row.partNumber} ← ${partId}`)
  }, [config.currentUser.name, audit])
  const undo = useCallback((row: Pick<BomViewRow, 'id' | 'partNumber'>) => {
    useLedger.getState().clearDecision(decisionKey('select-surrogate', row.id))
    audit.record({ by: config.currentUser.name, action: `Reverted surrogate: ${row.partNumber}`, subject: { type: 'bom-line', id: row.id } })
    toastSuccess(`Surrogate reverted: ${row.partNumber}`)
  }, [config.currentUser.name, audit])
  return { accept, undo }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** The simulated surrogate search: one engine call per line with visible progress (docs/01: 03, matching-engine stub). */
export function useRunSearch() {
  const engine = useService('engine')
  return useCallback(async (rows: BomViewRow[]) => {
    const st = useBomStore.getState()
    st.startSearch()
    for (let i = 0; i < rows.length; i++) {
      await engine.findSurrogateCandidates(rows[i]!.part, { limit: 3 })
      st.setProgress(i + 1)
      await sleep(22)
    }
    st.finishSearch()
    toastSuccess(`Surrogate search complete: ${rows.length} lines matched against Civic LX and Sport`)
  }, [engine])
}

/** Retry the one simulated failure: re-runs the engine for that line, then it resolves to its dataset result. */
export function useRetryLine() {
  const engine = useService('engine')
  return useCallback(async (row: BomViewRow) => {
    const st = useBomStore.getState()
    st.setRetrying(true)
    await engine.findSurrogateCandidates(row.part, { limit: 3 })
    await sleep(700)
    st.retryFailed()
    toastSuccess(`Search re-run: ${row.partNumber} matched`)
  }, [engine])
}
