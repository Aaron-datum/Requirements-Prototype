import { useMemo } from 'react'
import { Badge } from '../../components/ui'
import { resolveValue } from '../../config/appConfig'
import { useConfig, useVocab } from '../../config/useConfig'
import { ACTION_KIND_VOCAB } from '../../fixtures/extras/projects/projectData'

/** Raw values of a configured vocabulary, in the order the vocabulary lists them (best-known first). */
export function useVocabOrder(vocabularyId: string): string[] {
  const config = useConfig()
  return useMemo(() => config.vocabularies.find((v) => v.id === vocabularyId)?.values.map((x) => x.raw) ?? [], [config, vocabularyId])
}

/** Severity text first, tone second. Unknown severities render raw with a neutral tone. */
export function SeverityBadge({ raw }: { raw: string }) {
  const { resolve } = useVocab()
  const r = resolve('severity', raw)
  return <Badge tone={r.tone} title={r.description}>{r.label}</Badge>
}

/** The kind of action row (dangerous case, open test run, ...), labelled through the actionKind vocabulary. */
export function KindBadge({ raw }: { raw: string }) {
  const r = resolveValue({ vocabularies: [ACTION_KIND_VOCAB] }, 'actionKind', raw)
  return <Badge tone="outline" title={r.description}>{r.label}</Badge>
}
export const kindLabel = (raw: string): string => resolveValue({ vocabularies: [ACTION_KIND_VOCAB] }, 'actionKind', raw).label

/** Compact owner: "M. Okafor (Validation Engineer)" stays whole in tables, name only in tight lists. */
export const ownerName = (owner: string): string => owner.replace(/\s*\(.*\)\s*$/, '')
