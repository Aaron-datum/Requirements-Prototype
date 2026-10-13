/**
 * StubId: search-index. Client-side file search, part-number-first.
 *   - case-insensitive; spaces, underscores, dashes and dots are ignored on both sides ("k04 117 rs" finds "K04-117-RS_...")
 *   - `*` is a wildcard ("7100490*", "*RSB40*", "7100490*DEF*")
 *   - ranking: part-number prefix first, then file-name match, then description match; within a rank, preferred release values first
 *     (the caller derives them from the vocabulary order, not from a status string), then most recently modified.
 */
import type { SearchFile } from '../../fixtures/extras/search/types'
import { normalizeName } from '../../fixtures/derive-search'

export interface SearchOptions {
  /** Release-status raw values that should sort first (derived from config by the caller). */
  preferValues?: string[]
  /** Which PLM field holds the release status. */
  statusKey?: string
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Compile a query into a matcher over normalised text. Returns null for an empty query. */
export function compileQuery(query: string): { test: (text: string) => boolean; prefix: (text: string) => boolean } | null {
  const q = query.trim()
  if (!q) return null
  if (q.includes('*')) {
    const body = q.split('*').map((part) => escapeRe(normalizeName(part))).join('.*')
    const full = new RegExp(body)
    const anchored = new RegExp(`^${body}`)
    return { test: (t) => full.test(t), prefix: (t) => anchored.test(t) }
  }
  const n = normalizeName(q)
  return { test: (t) => t.includes(n), prefix: (t) => t.startsWith(n) }
}

export function searchFiles(files: SearchFile[], query: string, opts: SearchOptions = {}): SearchFile[] {
  const m = compileQuery(query)
  if (!m) return files
  const prefer = opts.preferValues ?? []
  const statusKey = opts.statusKey ?? 'releaseStatus'
  const scored = files.flatMap((f) => {
    const name = normalizeName(f.name), pn = normalizeName(f.partNumber), desc = normalizeName(f.description)
    const rank = m.prefix(pn) || m.prefix(name) ? 0 : m.test(name) || m.test(pn) ? 1 : m.test(desc) ? 2 : -1
    if (rank < 0) return []
    const status = f.plm[statusKey]
    const preferred = status != null && prefer.includes(String(status)) ? 0 : 1
    return [{ f, rank, preferred }]
  })
  return scored.sort((a, b) => a.rank - b.rank || a.preferred - b.preferred || b.f.updated.localeCompare(a.f.updated) || a.f.name.localeCompare(b.f.name)).map((s) => s.f)
}
