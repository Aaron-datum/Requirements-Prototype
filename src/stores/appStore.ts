import { create } from 'zustand'
import { DEFAULT_TENANT } from '../config/appConfig'
import type { DensityId, ThemeId } from '../domain/extra'

/** UI preferences. Persisted locally (theme/density are user preferences, not product data). */
interface AppState {
  theme: ThemeId
  density: DensityId
  tenantId: string
  planLabel: 'Test plan' | 'ADV P&R'
  showStubs: boolean
  /** Dev option: artificial latency (ms) added to async stub services, to prove skeleton states. */
  latency: number
  set: (patch: Partial<Omit<AppState, 'set'>>) => void
}

const KEY = 'datum-fe-prefs'
const load = (): Partial<AppState> => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<AppState> } catch { return {} }
}
const saved = load()

export const useAppStore = create<AppState>((set, get) => ({
  theme: saved.theme ?? 'white',
  density: saved.density ?? 'default',
  tenantId: saved.tenantId ?? DEFAULT_TENANT,
  planLabel: saved.planLabel ?? 'Test plan',
  showStubs: false,
  latency: 0,
  set: (patch) => {
    set(patch)
    const { theme, density, tenantId, planLabel } = get()
    try { localStorage.setItem(KEY, JSON.stringify({ theme, density, tenantId, planLabel })) } catch { /* storage unavailable */ }
  },
}))
