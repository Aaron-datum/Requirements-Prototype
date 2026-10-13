import { CATALOGUE_FACETS, facetByKey, facetValue, type CatalogueFacetDef } from '../../config/catalogueConfig'
import type { CatalogueNode, CatalogueQueryResult, CatalogueRowX, CatalogueServiceFull, ComparePair, FacetSelection, HeadTypeCard, ParsedQuery } from '../../domain/catalogue'
import boltsJson from '../../fixtures/extras/catalogue/bolts.json'
import pairsJson from '../../fixtures/extras/catalogue/pairs.json'
import searchJson from '../../fixtures/extras/catalogue/search.json'
import treeJson from '../../fixtures/extras/catalogue/tree.json'

// OWNER: Phase 4 (catalogue). StubId: search-index. Client-side filtering over fixture rows. Facet counts are computed from rows, not typed.

export const CATALOGUE_ROWS: CatalogueRowX[] = (boltsJson.rows as unknown as CatalogueRowX[])

/* ------------------------------ tree ---------------------------------- */
interface RawNode { id: string; label: string; description?: string; types?: number; rowBacked?: boolean; scope?: FacetSelection; scopeAxis?: string; axes?: string[]; count?: number; children?: RawNode[] }

function build(raw: RawNode, parentId?: string): CatalogueNode {
  const children = raw.children?.map((c) => build(c, raw.id))
  return { id: raw.id, label: raw.label, description: raw.description, types: raw.types, rowBacked: raw.rowBacked, scope: raw.scope, scopeAxis: raw.scopeAxis, axes: raw.axes, parentId, children, count: raw.count ?? 0 }
}
const ROOTS: CatalogueNode[] = (treeJson.categories as RawNode[]).map((c) => build(c))
const NODES = new Map<string, CatalogueNode>()
const index = (n: CatalogueNode) => { NODES.set(n.id, n); n.children?.forEach(index) }
ROOTS.forEach(index)

const ownsRows = (n: CatalogueNode): boolean => !!n.rowBacked || !!n.children?.some(ownsRows)

/* ------------------------------ facets -------------------------------- */
const isActiveSel = (v: string[] | undefined, def: CatalogueFacetDef): boolean => !!v && (def.kind === 'range' ? v.some((x) => x !== '') : v.length > 0)

function matchesFacet(row: CatalogueRowX, def: CatalogueFacetDef, sel: string[]): boolean {
  const raw = facetValue(row, def)
  if (def.kind === 'range') {
    const n = raw == null || raw === '' ? null : Number(raw)
    if (n == null || Number.isNaN(n)) return false
    const [lo, hi] = sel
    return (lo === undefined || lo === '' || n >= Number(lo)) && (hi === undefined || hi === '' || n <= Number(hi))
  }
  if (def.kind === 'text') return String(raw ?? '').toLowerCase().includes((sel[0] ?? '').toLowerCase())
  return sel.includes(String(raw ?? ''))
}

function applyAll(rows: CatalogueRowX[], facets: FacetSelection, text: string | undefined, skip?: string): CatalogueRowX[] {
  const active = Object.entries(facets).flatMap(([k, v]) => { const d = facetByKey(k); return d && d.kind !== 'text' && k !== skip && isActiveSel(v, d) ? [[d, v] as const] : [] })
  const t = (text ?? '').trim().toLowerCase()
  return rows.filter((r) => active.every(([d, v]) => matchesFacet(r, d, v)) && (!t || r.partNumber.toLowerCase().includes(t)))
}

const EFFECTIVE = (node: CatalogueNode, facets: FacetSelection): FacetSelection => ({ ...facets, ...(node.scope ?? {}) })

function nodeRows(node: CatalogueNode): CatalogueRowX[] { return ownsRows(node) ? CATALOGUE_ROWS : [] }

function query(nodeId: string, facets: FacetSelection, text?: string): CatalogueQueryResult {
  const node = NODES.get(nodeId)
  if (!node) return { rows: [], facetCounts: {} }
  const base = nodeRows(node)
  const eff = EFFECTIVE(node, facets)
  const rows = applyAll(base, eff, text)
  const facetCounts: Record<string, Record<string, number>> = {}
  CATALOGUE_FACETS.filter((d) => d.kind === 'enum').forEach((d) => {
    const counts: Record<string, number> = {}
    base.forEach((r) => { const v = facetValue(r, d); if (v != null && v !== '' && !(String(v) in counts)) counts[String(v)] = 0 })
    applyAll(base, eff, text, d.key).forEach((r) => { const v = facetValue(r, d); if (v != null && v !== '') counts[String(v)] = (counts[String(v)] ?? 0) + 1 })
    facetCounts[d.key] = counts
  })
  return { rows, facetCounts }
}

function liveTree(facets: FacetSelection, text?: string): CatalogueNode[] {
  const anyActive = !!text?.trim() || Object.entries(facets).some(([k, v]) => { const d = facetByKey(k); return !!d && isActiveSel(v, d) })
  const walk = (n: CatalogueNode): CatalogueNode => {
    const children = n.children?.map(walk)
    let count: number
    if (n.rowBacked) count = query(n.id, facets, text).rows.length
    else if (children?.length) count = children.reduce((a, c) => a + c.count, 0)
    else count = anyActive ? 0 : n.count
    return { ...n, children, count }
  }
  // Typed counts of non-row-backed leaves only matter while no filter is active; the sum rule above keeps parents consistent.
  return ROOTS.map(walk)
}

/* ------------------------------ parse --------------------------------- */
const ENUM_FACETS = CATALOGUE_FACETS.filter((d) => d.kind === 'enum')
const OPTION_INDEX: Array<{ facet: string; value: string; lower: string }> = ENUM_FACETS.flatMap((d) => {
  const vals = new Set<string>()
  CATALOGUE_ROWS.forEach((r) => { const v = facetValue(r, d); if (v != null && v !== '') vals.add(String(v)) })
  return [...vals].map((value) => ({ facet: d.key, value, lower: value.toLowerCase() }))
})
const SYNONYMS = searchJson.synonyms as Array<{ tokens: string[]; facet: string; values: string[] }>
const IGNORE = new Set(searchJson.ignore)

function parse(text: string): ParsedQuery {
  const facets: FacetSelection = {}
  const add = (facet: string, values: string[]) => { const cur = facets[facet] ?? []; values.forEach((v) => { if (!cur.includes(v)) cur.push(v) }); facets[facet] = cur }
  let rest = ` ${text.toLowerCase().replace(/[,]+/g, ' ')} `
  // Multi-word option values first ("socket head", "iso 4014", "cad library").
  OPTION_INDEX.filter((o) => o.lower.includes(' ')).forEach((o) => {
    const needle = ` ${o.lower} `
    if (rest.includes(needle)) { add(o.facet, [o.value]); rest = rest.replace(needle, ' ') }
  })
  const left: string[] = []
  const nums: number[] = []
  rest.split(/\s+/).filter(Boolean).forEach((tok) => {
    const thread = tok.match(/^m(\d+)(x[\d.]+)?$/)
    const threadHit = thread && OPTION_INDEX.find((o) => o.facet === 'thread' && o.lower === `m${thread[1]}`)
    if (threadHit) { add('thread', [threadHit.value]); return }
    const syn = SYNONYMS.find((s) => s.tokens.includes(tok))
    if (syn) { add(syn.facet, syn.values); return }
    const opt = OPTION_INDEX.find((o) => o.lower === tok)
    if (opt) { add(opt.facet, [opt.value]); return }
    const n = tok.match(/^(\d+)(mm)?$/)
    if (n) { nums.push(Number(n[1])); return }
    if (IGNORE.has(tok)) return
    left.push(tok)
  })
  if (nums.length) facets.length = [String(Math.min(...nums)), String(Math.max(...nums))]
  return { facets, text: left.join(' ') }
}

/* ------------------------------ service ------------------------------- */
const pathTo = (id: string): CatalogueNode[] => {
  const out: CatalogueNode[] = []
  let cur = NODES.get(id)
  while (cur) { out.unshift(cur); cur = cur.parentId ? NODES.get(cur.parentId) : undefined }
  return out
}
const BY_PN = new Map(CATALOGUE_ROWS.map((r) => [r.partNumber.toLowerCase(), r]))

export const catalogueStub: CatalogueServiceFull = {
  tree: () => liveTree({}),
  liveTree,
  node: (id) => NODES.get(id),
  path: pathTo,
  rows: (id) => { const n = NODES.get(id); return n ? nodeRows(n) : [] },
  query,
  part: (pn) => BY_PN.get(pn.toLowerCase()),
  parse,
  recent: () => searchJson.recent,
  headTypes: () => treeJson.headTypes as HeadTypeCard[],
  pairs: () => pairsJson.pairs as ComparePair[],
}
