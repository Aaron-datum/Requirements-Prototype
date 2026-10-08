import { create } from 'zustand'
import type { AuditEntry } from '../domain/types'

/**
 * The prototype ledger: audit entries and the decisions that workflow screens record.
 * Everything else in the prototype is in-memory per tab. The ledger is mirrored to localStorage and synced across tabs
 * because "Search on" opens a new tab and a decision action there (e.g. Select as surrogate) must be visible back in the
 * workflow tab. Reset (dev toolbar / persistence.reset) clears it. Decision D-21.
 */
export interface LedgerState {
  audit: AuditEntry[]
  /** Generic decision records keyed by `${kind}:${id}`, e.g. `surrogate:BOML-0152`. */
  decisions: Record<string, { value: string; at: string; by: string }>
  addAudit: (e: AuditEntry) => void
  setDecision: (key: string, value: string, at: string, by: string) => void
  clearDecision: (key: string) => void
  reset: () => void
}

const KEY = 'datum-fe-ledger'
const read = (): Pick<LedgerState, 'audit' | 'decisions'> => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Pick<LedgerState, 'audit' | 'decisions'> | null
    if (v && Array.isArray(v.audit)) return v
  } catch { /* ignore */ }
  return { audit: [], decisions: {} }
}
const write = (s: Pick<LedgerState, 'audit' | 'decisions'>): void => {
  try { localStorage.setItem(KEY, JSON.stringify({ audit: s.audit, decisions: s.decisions })) } catch { /* ignore */ }
}

export const useLedger = create<LedgerState>((set, get) => ({
  ...read(),
  addAudit: (e) => { set((s) => ({ audit: [e, ...s.audit] })); write(get()) },
  setDecision: (key, value, at, by) => { set((s) => ({ decisions: { ...s.decisions, [key]: { value, at, by } } })); write(get()) },
  clearDecision: (key) => { set((s) => { const d = { ...s.decisions }; delete d[key]; return { decisions: d } }); write(get()) },
  reset: () => { set({ audit: [], decisions: {} }); write(get()) },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) useLedger.setState(read())
  })
}
