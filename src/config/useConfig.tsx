import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { AppConfigFull, ResolvedValue } from '../domain/extra'
import { useAppStore } from '../stores/appStore'
import { buildAppConfig, resolveValue, similarityBand } from './appConfig'

const Ctx = createContext<AppConfigFull | null>(null)

export function ConfigProvider({ children, config }: { children: ReactNode; config?: AppConfigFull }) {
  const tenantId = useAppStore((s) => s.tenantId)
  const planLabel = useAppStore((s) => s.planLabel)
  const value = useMemo(() => config ?? buildAppConfig(tenantId, planLabel), [config, tenantId, planLabel])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useConfig(): AppConfigFull {
  const c = useContext(Ctx)
  if (!c) throw new Error('ConfigProvider missing')
  return c
}

/** Resolve a raw value through a vocabulary of the active tenant: label, tone, known flag. */
export function useVocab() {
  const config = useConfig()
  return useMemo(() => ({
    resolve: (vocabularyId: string, raw: string | number | boolean | null | undefined): ResolvedValue => resolveValue(config, vocabularyId, raw),
    band: (percent: number) => similarityBand(config, percent),
  }), [config])
}
