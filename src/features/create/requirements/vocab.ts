/**
 * Vocabularies that only the requirements area needs. They follow the rules of AppConfig vocabularies (label, tone, unknown raw values
 * fall back to raw text with a neutral tone) and ship for BOTH tenant profiles, so the Settings schema switch relabels them.
 * They live here rather than in src/config/appConfig.ts so this area stays inside its own folder; merge them into appConfig when convenient.
 */
import { useMemo } from 'react'
import { resolveValue } from '../../../config/appConfig'
import { useConfig } from '../../../config/useConfig'
import type { ResolvedValue } from '../../../domain/extra'
import type { StatusVocabulary } from '../../../domain/types'

const A: StatusVocabulary[] = [
  { id: 'carryFlag', values: [{ raw: 'no-candidates', label: 'No candidates', tone: 'warn' }, { raw: 'interface-changed', label: 'Interface changed', tone: 'warn' }] },
  { id: 'mappingState', values: [
    { raw: 'accepted', label: 'Accepted', tone: 'pass' }, { raw: 'rejected', label: 'Test plan needed', tone: 'warn' },
    { raw: 'auto', label: 'Auto-accepted', tone: 'info' }, { raw: 'proposed', label: 'Proposed', tone: 'neutral' } ] },
  { id: 'testStatus', values: [
    { raw: 'has-test', label: 'Has test', tone: 'pass' }, { raw: 'no-test', label: 'No test', tone: 'warn' }, { raw: 'scope-unclear', label: 'Scope unclear', tone: 'warn' } ] },
  { id: 'refState', values: [
    { raw: 'alternate', label: 'Alternate candidate', tone: 'neutral' }, { raw: 'accepted', label: 'Mapped · accepted', tone: 'pass' }, { raw: 'rejected', label: 'Mapping rejected', tone: 'warn' },
    { raw: 'proposed', label: 'Proposed', tone: 'info' }, { raw: 'evidence', label: 'Evidence', tone: 'pass' }, { raw: 'ran', label: 'Ran for this program', tone: 'pass' } ] },
  { id: 'confidenceKind', values: [{ raw: 'confirmed', label: 'Confirmed', tone: 'pass' }, { raw: 'computed', label: 'Computed', tone: 'info' }] },
  { id: 'gateDecision', values: [
    { raw: 'carry-forward', label: 'Carries forward', tone: 'pass' }, { raw: 'propose', label: 'Proposes only', tone: 'info' }, { raw: 'ask-human', label: 'Needs a person', tone: 'warn' } ] },
  { id: 'impactFlag', values: [{ raw: 're-review', label: 'Re-review', tone: 'warn' }, { raw: 'check', label: 'Check', tone: 'neutral' }] },
  { id: 'carryOutcome', values: [
    { raw: 'linked:computed', label: 'No Gap · evidence linked', tone: 'pass' }, { raw: 'linked:manual', label: 'No Gap · manual link', tone: 'pass' },
    { raw: 'linked:user-supplied', label: 'No Gap · user-supplied', tone: 'warn' }, { raw: 'gap', label: 'Moved to Gap', tone: 'fail' } ] },
  { id: 'openReason', values: [
    { raw: 'evidence', label: 'Evidence not linked', tone: 'warn' }, { raw: 'rejected', label: 'Mapping rejected, test plan needed', tone: 'warn' }, { raw: 'unreviewed', label: 'Mapping not reviewed', tone: 'neutral' } ] },
  { id: 'laneWarn', values: [{ raw: 'Changed', label: 'Changed', tone: 'warn' }, { raw: 'Unmet', label: 'Unmet', tone: 'warn' }] },
  { id: 'evidenceOrigin', values: [
    { raw: 'computed', label: 'Computed', tone: 'info' }, { raw: 'manual', label: 'Manual link', tone: 'neutral' },
    { raw: 'user-supplied', label: 'User-supplied', tone: 'warn' }, { raw: 'verified', label: 'Verified', tone: 'pass' } ] },
]

const B: StatusVocabulary[] = A.map((v) => {
  const rename: Record<string, Record<string, string>> = {
    carryFlag: { 'no-candidates': 'Nothing found', 'interface-changed': 'Interface moved' },
    mappingState: { accepted: 'Agreed', rejected: 'New test needed', auto: 'Auto-agreed', proposed: 'Suggested' },
    testStatus: { 'has-test': 'Covered', 'no-test': 'Uncovered', 'scope-unclear': 'Scope open' },
    impactFlag: { 're-review': 'Reassess', check: 'Verify' },
    carryOutcome: { 'linked:computed': 'Met · evidence linked', 'linked:manual': 'Met · manual link', 'linked:user-supplied': 'Met · user-supplied', gap: 'Not met' },
  }
  const map = rename[v.id]
  return map ? { ...v, values: v.values.map((x) => ({ ...x, label: map[x.raw] ?? x.label })) } : v
})

const BY_TENANT: Record<string, StatusVocabulary[]> = { 'company-a': A, 'company-b': B }

/** Resolve a raw value through the active tenant's vocabularies plus the requirements-area ones. */
export function useReqVocab() {
  const config = useConfig()
  return useMemo(() => {
    const vocabularies = [...config.vocabularies, ...(BY_TENANT[config.tenantId] ?? A)]
    const resolve = (id: string, raw: string | number | boolean | null | undefined): ResolvedValue => resolveValue({ vocabularies }, id, raw)
    return { resolve, label: (id: string, raw: string): string => resolve(id, raw).label }
  }, [config])
}
