import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Services } from '../domain/types'
import { createServices } from './index'

const Ctx = createContext<Services | null>(null)

export function ServicesProvider({ children, services }: { children: ReactNode; services?: Services }) {
  const value = useMemo(() => services ?? createServices(), [services])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/**
 * Screens reach a service through this hook, one key at a time: `const engine = useService('engine')`.
 * The stub-usage test scans for useService('<key>') and requires a matching <Stub id> in the same file.
 */
export function useService<K extends keyof Services>(key: K): Services[K] {
  const s = useContext(Ctx)
  if (!s) throw new Error('ServicesProvider missing')
  return s[key]
}

/** Which StubId each service key is simulated by. Used by the stub-usage test and the /dev/stubs page. */
export const SERVICE_STUB: Record<keyof Services, string[]> = {
  engine: ['matching-engine'], viewer: ['cad-viewer'], compare: ['cad-viewer', 'matching-engine'], catalogue: ['search-index'],
  plm: ['plm-connectors'], mapping: ['mapping-agent'], docs: ['doc-extraction'], cost: ['cost-model'], tests: ['test-matcher'],
  diff: ['diff-engine'], evidence: ['evidence-engine', 'evidence-store'], impact: ['impact-graph'], gate: ['autonomy-gate'],
  audit: ['audit-trail'], plan: ['plan-service'], persistence: ['persistence'], dashboard: ['dashboard-services'],
}
