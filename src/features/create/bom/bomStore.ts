import { create } from 'zustand'
import { emptyTreeState, nextRoute, type EstimateVariant, type ManualLine, type RouteMap, type TreeState } from '../../../fixtures/derive-bom'
import { SOURCES } from '../../../fixtures/extras/bom/rules'
import { useLedger } from '../../../stores/ledgerStore'

/**
 * Feature-local state for the BOM and cost flow. In memory only (the requirements doc: "the state of every step is held in memory").
 * Confirmed surrogates are NOT here: they live in the ledger (decisions + audit), which is synced across tabs, so a decision made
 * in the Search area's tab shows up here.
 */
export type SearchPhase = 'idle' | 'running' | 'done'
export interface CostChoice { status?: 'confirmed' | 'overridden'; current: EstimateVariant }

interface BomState {
  routes: RouteMap
  sources: Record<string, boolean>
  confirmedTemplateColumns: string[]
  tree: TreeState
  search: SearchPhase
  progress: number
  failedRetried: boolean
  retrying: boolean
  lastStep: string
  lastLine: string | null
  cost: Record<string, CostChoice>
  cycleRoute: (fileId: string, current: string) => void
  toggleSource: (id: string) => void
  confirmTemplateColumn: (header: string) => void
  setIncluded: (ids: string[], on: boolean) => void
  addManual: (m: Omit<ManualLine, 'id' | 'partNumber'>) => ManualLine
  removeManual: (id: string) => void
  attachCad: (id: string) => void
  startSearch: () => void
  setProgress: (n: number) => void
  finishSearch: () => void
  setRetrying: (on: boolean) => void
  retryFailed: () => void
  setLastStep: (s: string) => void
  setLastLine: (id: string | null) => void
  setCost: (partId: string, patch: Partial<CostChoice>) => void
  reset: () => void
}

const STEP_KEY = 'datum-bom-step'
/** The current step is a per-tab convenience, remembered in sessionStorage so a reload of /create/bom returns to it. */
const savedStep = (): string => { try { return sessionStorage.getItem(STEP_KEY) ?? '01-intake' } catch { return '01-intake' } }

const initial = () => ({
  routes: {} as RouteMap,
  sources: Object.fromEntries(SOURCES.map((s) => [s.id, true])) as Record<string, boolean>,
  confirmedTemplateColumns: [] as string[],
  tree: emptyTreeState(),
  search: 'idle' as SearchPhase,
  progress: 0,
  failedRetried: false,
  retrying: false,
  lastStep: savedStep(),
  lastLine: null as string | null,
  cost: {} as Record<string, CostChoice>,
})

export const useBomStore = create<BomState>((set, get) => ({
  ...initial(),
  cycleRoute: (fileId, current) => set((s) => ({ routes: { ...s.routes, [fileId]: nextRoute(current) } })),
  toggleSource: (id) => set((s) => ({ sources: { ...s.sources, [id]: !s.sources[id] } })),
  confirmTemplateColumn: (header) => set((s) => ({ confirmedTemplateColumns: s.confirmedTemplateColumns.includes(header) ? s.confirmedTemplateColumns : [...s.confirmedTemplateColumns, header] })),
  setIncluded: (ids, on) => set((s) => ({ tree: { ...s.tree, included: { ...s.tree.included, ...Object.fromEntries(ids.map((id) => [id, on])) } } })),
  addManual: (m) => {
    const n = get().tree.manual.length + 1
    const line: ManualLine = { ...m, id: `MAN-${String(n).padStart(2, '0')}`, partNumber: `MAN-${String(n).padStart(2, '0')}` }
    set((s) => ({ tree: { ...s.tree, manual: [...s.tree.manual, line] } }))
    return line
  },
  removeManual: (id) => set((s) => ({ tree: { ...s.tree, manual: s.tree.manual.filter((x) => x.id !== id) } })),
  attachCad: (id) => set((s) => ({ tree: { ...s.tree, cadAttached: { ...s.tree.cadAttached, [id]: true } } })),
  startSearch: () => set({ search: 'running', progress: 0 }),
  setProgress: (progress) => set({ progress }),
  finishSearch: () => set({ search: 'done' }),
  setRetrying: (retrying) => set({ retrying }),
  retryFailed: () => set({ failedRetried: true, retrying: false }),
  setLastStep: (lastStep) => { try { sessionStorage.setItem(STEP_KEY, lastStep) } catch { /* storage unavailable */ } set({ lastStep }) },
  setLastLine: (lastLine) => set({ lastLine }),
  setCost: (partId, patch) => set((s) => ({ cost: { ...s.cost, [partId]: { ...s.cost[partId], current: s.cost[partId]?.current ?? {}, ...patch } } })),
  reset: () => set(initial()),
}))

/** The dev toolbar's Reset clears the ledger; the BOM flow's in-memory state follows it. */
useLedger.subscribe((s, prev) => {
  if ((prev.audit.length || Object.keys(prev.decisions).length) && !s.audit.length && !Object.keys(s.decisions).length) useBomStore.getState().reset()
})
