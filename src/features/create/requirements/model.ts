import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConfig } from '../../../config/useConfig'
import { buildReqViews, carryStats, planSummary, readDecisions } from '../../../fixtures/derive-requirements'
import { useLedger } from '../../../stores/ledgerStore'

/** All requirements view models, derived live from the ledger decisions (05 and 06 decisions feed 06c and 07). */
export function useReqModel() {
  const config = useConfig()
  const ledger = useLedger((l) => l.decisions)
  return useMemo(() => {
    const decisions = readDecisions(ledger)
    const rows = buildReqViews(config.thresholds, decisions)
    return { config, decisions, rows, byId: new Map(rows.map((r) => [r.req_id, r])), summary: planSummary(rows), stats: carryStats(rows) }
  }, [ledger, config])
}
export type ReqModel = ReturnType<typeof useReqModel>

/** Deep-linkable single value in the query string, e.g. the selected requirement (?req=REC-20007). */
export function useParam(name: string): [string | null, (v: string | null) => void] {
  const [params, setParams] = useSearchParams()
  const value = params.get(name)
  const set = (v: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (v == null) n.delete(name); else n.set(name, v); return n }, { replace: true })
  return [value, set]
}

/** Change several query parameters in one navigation (two separate setters in one tick would overwrite each other). */
export function useQueryPatch(): (patch: Record<string, string | null>) => void {
  const [, setParams] = useSearchParams()
  return (patch) => setParams((p) => { const n = new URLSearchParams(p); Object.entries(patch).forEach(([k, v]) => (v == null ? n.delete(k) : n.set(k, v))); return n }, { replace: true })
}

export const BASE = '/create/requirements'
export const stepHref = (step: string, query = ''): string => `${BASE}/${step}${query ? `?${query}` : ''}`

/** Narrow viewports start with the table sidebar collapsed so the table keeps room beside the panel. */
export const startCollapsed = (): boolean => typeof window !== 'undefined' && window.innerWidth < 1500
