/**
 * Seeded result generator (docs/04-fixtures-spec.md section 4). Same query, same rows, always.
 *
 *   generateResults(query) -> rows: the pinned Source Part row (0%) first, then 8 to 14 candidates (fewer if the library has fewer),
 *   similarity spread across all three bands, plus the special cases the spec lists.
 *
 * Nothing here is an algorithm: scores are fixture values seeded from the query, child-part percentages cluster around the parent's
 * score (the spec calls this out as fixture logic), and there is deliberately no "Exact" band. A 100% row is a geometric duplicate
 * (different file, same geometry) or a duplicate file (same file in another vault), derived from the library's geometry hashes.
 */
import type { CapturedMeasurement, SearchModality, SearchQuery } from '../../../domain/types'
import { activeLeaves, assembliesContaining, duplicateKind, fileById, findNode, flattenTree, lineageOf, measurementTypeByKey, searchFiles } from '../../derive-search'
import { hashInt, mulberry32 } from '../../rng'
import type { ChildMatch, ResultRowX, SearchFile, UsedIn } from './types'

export type Special = 'all-three' | 'type-only' | 'none' | 'no-match' | 'failed' | 'different-plm'
const TAIL_SPECIALS: Special[] = ['type-only', 'none', 'no-match', 'failed']
const ALL_SPECIALS: Special[] = ['all-three', 'type-only', 'different-plm', 'none', 'no-match', 'failed']

/** Raw data-type values used in fixtures (vocabulary 'dataType'). Rows with an unsure type start as Review required when a workflow context is present. */
export const DT = { actual: 'Actual', surrogate: 'Surrogate', estimate: 'Estimate', none: 'No match', failed: 'Search failed' } as const
export const UNSURE_TYPES: string[] = [DT.surrogate, DT.estimate]
export const PENDING_APPROVAL = 'Review required'

/**
 * The eight featured query cases (4 modalities x 2 source files). Between them they carry every special case in the spec.
 * Any other (modality, file) still works; it gets a deterministic rotation of the specials instead.
 */
export const FEATURED: Array<{ modality: SearchModality; file: string; part?: string; specials: Special[] }> = [
  { modality: 'part-to-part', file: 'K04-117-RS_BRKT_MOUNT.SLDPRT', specials: ['all-three', 'type-only', 'different-plm'] },
  { modality: 'part-to-part', file: '7100490_0000_AB_ASM_RSB40_DEF.CATPart', specials: ['none', 'no-match', 'failed', 'all-three'] },
  { modality: 'part-to-assembly', file: 'FrameBack_Outer_v8.CATPart', specials: ['all-three', 'type-only', 'no-match'] },
  { modality: 'part-to-assembly', file: 'TrackRail_Upper_24a.CATPart', specials: ['none', 'failed', 'all-three'] },
  { modality: 'assembly-to-assembly', file: '6644321_AA_COMPLETE_SEAT.CATProduct', specials: ['all-three', 'type-only', 'none'] },
  { modality: 'assembly-to-assembly', file: '6651104_BA_COMPLETE_SEAT.CATProduct', specials: ['no-match', 'failed', 'all-three'] },
  { modality: 'part-in-assembly-to-part', file: '6644321_AA_COMPLETE_SEAT.CATProduct', part: 'FrameBack_Outer', specials: ['all-three', 'none', 'type-only'] },
  { modality: 'part-in-assembly-to-part', file: '6644336_AB_COMPLETE_SEAT.CATProduct', part: 'Recliner_Mech_LH', specials: ['failed', 'no-match', 'all-three'] },
]

export const seedKey = (q: Pick<SearchQuery, 'modality' | 'fileId' | 'activePartId'>): string => `${q.modality}|${q.fileId}|${q.activePartId ?? ''}`

const isPartModality = (m: SearchModality): boolean => m === 'part-to-part' || m === 'part-to-assembly' || m === 'part-in-assembly-to-part'

/** The file the query is "about": the active part for part modalities, the assembly itself for assembly modalities. */
export function sourceOf(q: Pick<SearchQuery, 'modality' | 'fileId' | 'activePartId'>): { file: SearchFile; parentId?: string } | undefined {
  const base = fileById[q.fileId]
  if (!base) return undefined
  if (!isPartModality(q.modality)) return { file: base }
  if (base.kind === 'part') return { file: base, parentId: q.modality === 'part-in-assembly-to-part' ? assembliesContaining(base.id)[0]?.assembly.id : undefined }
  const node = findNode(base, q.activePartId)
  const partFile = node?.node.fileId ? fileById[node.node.fileId] : undefined
  if (partFile) return { file: partFile, parentId: base.id }
  const first = activeLeaves(base).find((l) => l.node.fileId)
  return first ? { file: fileById[first.node.fileId!]!, parentId: base.id } : { file: base }
}

const featuredFor = (modality: SearchModality, src: SearchFile) => FEATURED.find((f) => f.modality === modality && f.file === src.name)

const specialsFor = (modality: SearchModality, src: SearchFile, key: string): Special[] => {
  const f = featuredFor(modality, src)
  if (f) return f.specials
  const start = hashInt(`specials|${key}`, 0, ALL_SPECIALS.length - 1)
  return [0, 1, 2].map((i) => ALL_SPECIALS[(start + i * 2) % ALL_SPECIALS.length]!)
}

const categoryOf = (name: string): string => (/Frame|Buckle|Bracket|BRKT|Mount|MOUNT|AXLE/.test(name) ? 'Structural' : /Cushion|Headrest/.test(name) ? 'Comfort' : /Recliner/.test(name) ? 'Mechanism' : /Track/.test(name) ? 'Track' : /Heater/.test(name) ? 'Electrical' : /Trim/.test(name) ? 'Trim' : 'Hardware')

const round1 = (n: number): number => Math.round(n * 10) / 10
const round2 = (n: number): number => Math.round(n * 100) / 100
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n))

/**
 * Candidate value and deviation for one (row, measurement) pair. Independent stream per pair, so adding or removing a captured
 * measurement never changes the others. `manual` forces the "cannot derive automatically" state.
 */
export function measureCandidate(seed: string, rowFileId: string, m: Pick<CapturedMeasurement, 'id' | 'typeKey' | 'value'>, manual: boolean): { candidate: number | 'manual-required'; deviationPct: number | null } {
  if (manual) return { candidate: 'manual-required', deviationPct: null }
  const rng = mulberry32(`${seed}|m|${rowFileId}|${m.id}|${m.typeKey}`)
  const tol = measurementTypeByKey[m.typeKey]?.tolerancePct ?? 5
  const within = rng() < 0.5
  const sign = rng() < 0.5 ? -1 : 1
  const mag = within ? rng() * tol * 0.9 : tol * (1.25 + rng() * 2.6)
  const dev = sign * mag
  return { candidate: round2(m.value * (1 + dev / 100)), deviationPct: round1(dev) }
}

const WHY = ['Bounding box within 2% of the source', 'Same feature set: bores, flanges and ribs', 'PLM program and product line match the source', 'Same material family', 'Mass within 5% of the source']

export function generateResults(q: SearchQuery): ResultRowX[] {
  const src = sourceOf(q)
  if (!src) return []
  const key = seedKey(q)
  const rng = mulberry32(key)
  const source = src.file
  const wantAssemblies = q.modality === 'part-to-assembly' || q.modality === 'assembly-to-assembly'
  const specials = specialsFor(q.modality, source, key)

  /* ---- candidate pool, ordered: geometric twins, lineage siblings, then a seeded shuffle ---- */
  let pool = searchFiles.filter((f) => f.id !== source.id && f.id !== q.fileId && (wantAssemblies ? f.kind === 'assembly' : f.kind === 'part'))
  if (q.modality === 'part-in-assembly-to-part') pool = pool.filter((f) => assembliesContaining(f.id).length > 0)
  const siblings = new Set(lineageOf(source).map((f) => f.id))
  const rank = (f: SearchFile): number => (duplicateKind(source, f) ? 0 : siblings.has(f.id) ? 1 : 2)
  pool = [...pool].sort((a, b) => rank(a) - rank(b) || hashInt(`${key}|${a.id}`, 0, 1e6) - hashInt(`${key}|${b.id}`, 0, 1e6))
  if (specials.includes('different-plm')) {
    const idx = pool.findIndex((f) => f.source !== source.source && rank(f) === 2)
    if (idx > 3) { const [f] = pool.splice(idx, 1); pool.splice(3, 0, f!) }
  }
  const want = 8 + Math.floor(rng() * 7)
  const picked = pool.slice(0, Math.min(want, pool.length))
  const tailKinds = specials.filter((s) => TAIL_SPECIALS.includes(s)).slice(0, Math.max(0, picked.length - 5))
  const regular = picked.slice(0, picked.length - tailKinds.length)
  const tailFiles = picked.slice(regular.length)

  /* ---- similarity spread across the three bands ---- */
  const twins = regular.filter((f) => duplicateKind(source, f))
  const rest = regular.filter((f) => !duplicateKind(source, f))
  const hi = Math.max(2, Math.round(rest.length * 0.36))
  const mid = Math.max(2, Math.round(rest.length * 0.4))
  const sims = new Map<string, number>()
  twins.forEach((f) => sims.set(f.id, 100))
  rest.forEach((f, i) => {
    const j = i - hi, k = i - hi - mid
    const v = i < hi ? 97 - i * 2 - Math.floor(rng() * 2) : j < mid ? 83 - j * 3 - Math.floor(rng() * 2) : 67 - k * 3 - Math.floor(rng() * 2)
    sims.set(f.id, i < hi ? clamp(v, 85, 98) : j < mid ? clamp(v, 70, 84) : clamp(v, 50, 69))
  })

  /* ---- measurement helper ---- */
  const manualIdx = twins.length + 2 + Math.floor(rng() * Math.max(1, Math.min(3, rest.length - 2)))
  const measurementsFor = (f: SearchFile, isManualRow: boolean): ResultRowX['measurements'] => Object.fromEntries(
    q.measurements.map((m, mi) => [m.id, measureCandidate(key, f.id, m, isManualRow && mi === 0)] as const),
  )

  const base = (f: SearchFile): Pick<ResultRowX, 'id' | 'fileId' | 'name' | 'source' | 'created' | 'lastEdited' | 'fileKind'> =>
    ({ id: `r-${f.id}`, fileId: f.id, name: f.name, source: f.source, created: f.created.slice(0, 10), lastEdited: f.updated.slice(0, 10), fileKind: f.kind })

  const extras = (f: SearchFile, sim: number): Pick<ResultRowX, 'childMatches' | 'usedIn' | 'parentAssemblyId'> => {
    const out: Pick<ResultRowX, 'childMatches' | 'usedIn' | 'parentAssemblyId'> = {}
    if (f.kind === 'assembly') {
      const leaves = activeLeaves(f)
      const children: ChildMatch[] = leaves.map((l, i) => {
        const off = hashInt(`${key}|${f.id}|${l.node.id}`, -22, 0)
        return { nodeId: l.node.id, name: l.node.name, category: categoryOf(l.node.name), fileId: l.node.fileId, pct: clamp(i === 0 ? sim : sim + off, 38, sim === 100 ? 100 : 99) }
      })
      out.childMatches = children.sort((a, b) => b.pct - a.pct)
    } else {
      const usedIn: UsedIn[] = assembliesContaining(f.id).map(({ assembly, placements }) => ({
        asmId: assembly.id, asmFile: assembly.name, asmProgram: `${assembly.plm.program ?? '—'} · ${assembly.plm.modelYear ?? '—'}`,
        partInstance: placements[0]!.node.name, instances: placements.length, edited: assembly.updated.slice(0, 10),
      }))
      if (usedIn.length) out.usedIn = usedIn
      if (q.modality === 'part-in-assembly-to-part') {
        const parents = assembliesContaining(f.id).map((a) => a.assembly)
        out.parentAssemblyId = (parents.find((p) => p.id !== src.parentId) ?? parents[0])?.id
      }
    }
    return out
  }

  /* ---- rows ---- */
  const approvalOf = (raw: string | undefined) => (raw && UNSURE_TYPES.includes(raw) ? { status: PENDING_APPROVAL, audit: [] } : undefined)
  const regularRows: ResultRowX[] = [...twins, ...rest].map((f, i) => {
    const sim = sims.get(f.id)!
    const dup = duplicateKind(source, f)
    const raw = dup ? DT.actual : i % 4 === 2 ? DT.surrogate : i % 7 === 4 ? DT.estimate : DT.actual
    const score = clamp(sim - 4 + Math.floor(rng() * 9), 35, 99)
    const confNumeric = { score, why: [WHY[i % WHY.length]!, WHY[(i + 2) % WHY.length]!] }
    const confWord = { label: score >= 85 ? 'High' : score >= 65 ? 'Moderate' : 'Low', why: [WHY[(i + 1) % WHY.length]!] }
    const pattern = i % 5
    const allThree = specials.includes('all-three') && i === twins.length + 1
    const quality: ResultRowX['quality'] = { similarity: { percent: sim } }
    if (dup) { quality.duplicate = dup; quality.dataType = { raw }; quality.confidence = { score: 99, why: ['Geometry hash is identical to the source'] } }
    else if (allThree || pattern === 1) { quality.dataType = { raw }; quality.confidence = confNumeric }
    else if (pattern === 3) { quality.confidence = confWord }
    else quality.dataType = { raw }
    const isManualRow = !dup && i === manualIdx
    return { ...base(f), quality, measurements: measurementsFor(f, isManualRow), approval: approvalOf(quality.dataType?.raw), ...extras(f, sim) }
  })
  regularRows.sort((a, b) => b.quality.similarity!.percent - a.quality.similarity!.percent)

  const tailRows: ResultRowX[] = tailFiles.map((f, i) => {
    const kind = tailKinds[i]!
    const quality: ResultRowX['quality'] = kind === 'type-only' ? { dataType: { raw: DT.estimate } } : kind === 'none' ? {} : kind === 'no-match' ? { dataType: { raw: DT.none } } : { dataType: { raw: DT.failed } }
    const hasValues = kind === 'type-only' || kind === 'none'
    return { ...base(f), quality, measurements: hasValues ? measurementsFor(f, false) : {}, approval: approvalOf(quality.dataType?.raw), ...(hasValues ? extras(f, 60) : {}) }
  })

  /* ---- pinned Source Part row: 0% ---- */
  const sourceRow: ResultRowX = {
    ...base(source), id: 'r-source', isSourcePart: true, quality: { similarity: { percent: 0 } },
    measurements: Object.fromEntries(q.measurements.map((m) => [m.id, { candidate: m.value, deviationPct: 0 }] as const)),
    parentAssemblyId: q.modality === 'part-in-assembly-to-part' ? src.parentId : undefined,
    ...(source.kind === 'assembly' ? { childMatches: activeLeaves(source).map((l) => ({ nodeId: l.node.id, name: l.node.name, category: categoryOf(l.node.name), fileId: l.node.fileId, pct: 100 })) } : {}),
  }
  return [sourceRow, ...regularRows, ...tailRows]
}

/** Number of tree nodes in an assembly file (header counts must come from one source: the tree). */
export const partCount = (f: SearchFile): number => activeLeaves(f).length
export const treeSize = (f: SearchFile): number => flattenTree(f.tree).length
