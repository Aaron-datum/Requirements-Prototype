import { describe, expect, it } from 'vitest'
import { TENANTS, buildAppConfig, resolveValue } from '../../../config/appConfig'
import type { CapturedMeasurement, SearchModality, SearchQuery } from '../../../domain/types'
import { DUPLICATE_LABEL } from '../../../components/quality/MatchQuality'
import { activeLeaves, assembliesContaining, fileById, flattenTree, hasPlm, lineageOf, measurementTypes, pickableGeometry, recentSeeds, searchFiles } from '../../derive-search'
import { FEATURED, generateResults, measureCandidate, seedKey, sourceOf } from './results'
import filesJson from './files.json'

const M: CapturedMeasurement[] = [
  { id: 'm1', typeKey: 'area', geometryRef: 'g1', value: 18250.4 },
  { id: 'm2', typeKey: 'diameter', geometryRef: 'g2', value: 24.5 },
]
const queryFor = (f: (typeof FEATURED)[number], measurements = M): SearchQuery => {
  const file = searchFiles.find((x) => x.name === f.file)!
  const node = f.part ? flattenTree(file.tree).find((n) => n.node.name === f.part) : undefined
  return { modality: f.modality, fileId: file.id, activePartId: node?.node.id, measurements }
}
const featuredSets = FEATURED.map((f) => ({ f, rows: generateResults(queryFor(f)) }))
const allRows = featuredSets.flatMap((s) => s.rows)

describe('search fixtures: library', () => {
  it('has 40 files, 28 parts and 12 assemblies in six formats and three sources', () => {
    expect(searchFiles).toHaveLength(40)
    expect(searchFiles.filter((f) => f.kind === 'part')).toHaveLength(28)
    expect(searchFiles.filter((f) => f.kind === 'assembly')).toHaveLength(12)
    expect([...new Set(searchFiles.map((f) => f.format))].sort()).toEqual(['CATPart', 'CATProduct', 'JT', 'PRT', 'SLDPRT', 'STEP'])
    expect([...new Set(searchFiles.map((f) => f.source))].sort()).toEqual(['CAD Library', 'Teamcenter', 'Windchill'])
  })
  it('ids are unique (files, tree nodes per file, pickable geometry refs)', () => {
    expect(new Set(searchFiles.map((f) => f.id)).size).toBe(searchFiles.length)
    for (const f of searchFiles) {
      const ids = flattenTree(f.tree).map((n) => n.node.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    const refs = searchFiles.flatMap((f) => pickableGeometry(f.id).map((g) => g.ref))
    expect(new Set(refs).size).toBe(refs.length)
    expect(new Set(recentSeeds.map((r) => r.id)).size).toBe(recentSeeds.length)
  })
  it('foreign keys resolve (tree files, supersededBy, recents, pickable geometry per file)', () => {
    for (const f of searchFiles) {
      if (f.supersededBy) expect(fileById[f.supersededBy], `${f.name} supersededBy`).toBeDefined()
      flattenTree(f.tree).forEach((n) => { if (n.node.fileId) expect(fileById[n.node.fileId], `${f.name} tree`).toBeDefined() })
      expect(pickableGeometry(f.id).length, `${f.name} geometry`).toBeGreaterThanOrEqual(6)
      expect(pickableGeometry(f.id).length).toBeLessThanOrEqual(12)
    }
    recentSeeds.forEach((r) => expect(searchFiles.some((f) => f.name === r.fileName), r.fileName).toBe(true))
  })
  it('has a revision lineage of at least 5 files (Rev A, B, C, AA, AB, AC)', () => {
    const lineage = lineageOf(searchFiles.find((f) => f.name.includes('_0001_A_'))!)
    expect(lineage.map((f) => f.revision)).toEqual(['A', 'B', 'C', 'AA', 'AB', 'AC'])
  })
  it('has three files with no PLM record, and names that exercise part-number search', () => {
    expect(searchFiles.filter((f) => !hasPlm(f))).toHaveLength(3)
    const names = searchFiles.map((f) => f.name)
    expect(names).toContain('7100490_0000_AB_ASM_RSB40_DEF.CATPart')
    expect(names).toContain('K04-117-RS_BRKT_MOUNT.SLDPRT')
    expect(names).toContain('K04_117_RS_BRKT_MOUNT_B.SLDPRT')
  })
  it('Complete Seat carries 12 active seat parts and reference parts across 3 to 5 levels', () => {
    const seat = searchFiles.find((f) => f.name === '6644321_AA_COMPLETE_SEAT.CATProduct')!
    expect(activeLeaves(seat)).toHaveLength(12)
    expect(flattenTree(seat.tree).some((n) => n.node.reference)).toBe(true)
    const depth = Math.max(...flattenTree(seat.tree).map((n) => n.depth)) + 1
    for (const f of searchFiles.filter((x) => x.kind === 'assembly')) {
      const d = Math.max(...flattenTree(f.tree).map((n) => n.depth)) + 1
      expect(d).toBeGreaterThanOrEqual(3); expect(d).toBeLessThanOrEqual(5)
      expect(flattenTree(f.tree).length).toBeGreaterThanOrEqual(6); expect(flattenTree(f.tree).length).toBeLessThanOrEqual(40)
    }
    expect(depth).toBeGreaterThanOrEqual(3)
    expect(assembliesContaining(searchFiles.find((f) => f.name === 'FrameBack_Outer_v8.CATPart')!.id).length).toBeGreaterThan(1)
  })
  it('measurement types are data and include Volume, each with a unit', () => {
    expect(measurementTypes.map((t) => t.key)).toEqual(expect.arrayContaining(['area', 'perimeter', 'height', 'diameter', 'length', 'volume']))
    measurementTypes.forEach((t) => { expect(t.unit).toBeTruthy(); expect(t.applicableTo.length).toBeGreaterThan(0) })
  })
})

describe('search fixtures: vocabularies and both tenants', () => {
  it('every PLM vocabulary value resolves in both tenants except the one intended unknown record', () => {
    const unknown: string[] = []
    for (const tenant of Object.values(TENANTS)) {
      const config = buildAppConfig(tenant.id)
      for (const f of searchFiles) for (const def of config.schema.fields.filter((d) => d.vocabularyId)) {
        const raw = f.plm[def.key]
        if (raw == null || raw === '') continue
        if (!resolveValue(config, def.vocabularyId!, raw).known) unknown.push(`${tenant.id}:${f.name}:${def.key}=${raw}`)
      }
    }
    expect(new Set(unknown.map((u) => u.split(':').slice(1).join(':'))).size).toBe(1)
    expect(unknown.some((u) => u.includes('Pending Sign-off'))).toBe(true)
  })
  it('one record carries the opaque id id1055 and it resolves in both tenants', () => {
    const rec = searchFiles.filter((f) => f.plm.releaseStatus === 'id1055')
    expect(rec).toHaveLength(1)
    expect(resolveValue(buildAppConfig('company-a'), 'releaseStatus', 'id1055').label).toBe('Released')
    expect(resolveValue(buildAppConfig('company-b'), 'releaseStatus', 'id1055').label).toBe('Approved for use')
  })
  it('both schemas render from the same records: every schema field key has data, company B has Supplier lead time', () => {
    for (const tenant of Object.values(TENANTS)) {
      for (const def of tenant.schema.fields) {
        const filled = searchFiles.filter((f) => f.plm[def.key] != null && f.plm[def.key] !== '')
        expect(filled.length, `${tenant.id}.${def.key}`).toBeGreaterThan(5)
      }
    }
    expect(TENANTS['company-b']!.schema.fields.some((f) => f.key === 'supplierLeadTime')).toBe(true)
    searchFiles.filter(hasPlm).forEach((f) => expect(typeof f.plm.supplierLeadTime).toBe('number'))
  })
  it('data types and approval raw values in results resolve in both tenants', () => {
    for (const tenant of Object.values(TENANTS)) {
      const config = buildAppConfig(tenant.id)
      for (const r of allRows) {
        if (r.quality.dataType) expect(resolveValue(config, 'dataType', r.quality.dataType.raw).known, r.quality.dataType.raw).toBe(true)
        if (r.approval) expect(resolveValue(config, 'workflowApproval', r.approval.status).known).toBe(true)
      }
    }
  })
  it('the word Exact appears in no label, fixture string or vocabulary', () => {
    expect(JSON.stringify(filesJson)).not.toMatch(/exact/i)
    expect(JSON.stringify(allRows)).not.toMatch(/exact/i)
    expect(JSON.stringify(Object.values(DUPLICATE_LABEL))).not.toMatch(/exact/i)
    for (const t of Object.values(TENANTS)) expect(JSON.stringify(t.vocabularies)).not.toMatch(/exact/i)
  })
})

describe('search fixtures: generated results', () => {
  it('every featured set starts with the pinned Source Part at 0%, then 8 to 14 candidates', () => {
    expect(featuredSets).toHaveLength(8)
    for (const { f, rows } of featuredSets) {
      expect(rows[0]!.isSourcePart, f.file).toBe(true)
      expect(rows[0]!.quality.similarity?.percent).toBe(0)
      expect(rows.length - 1, `${f.modality} ${f.file}`).toBeGreaterThanOrEqual(8)
      expect(rows.length - 1).toBeLessThanOrEqual(14)
    }
  })
  it('covers four modalities with at least two source files each', () => {
    const by = new Map<SearchModality, Set<string>>()
    FEATURED.forEach((f) => by.set(f.modality, (by.get(f.modality) ?? new Set()).add(f.file)))
    expect(by.size).toBe(4)
    by.forEach((s) => expect(s.size).toBeGreaterThanOrEqual(2))
  })
  it('ids are unique per set and foreign keys resolve', () => {
    for (const { rows } of featuredSets) {
      expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
      rows.forEach((r) => {
        expect(fileById[r.fileId]).toBeDefined()
        if (r.parentAssemblyId) expect(fileById[r.parentAssemblyId]).toBeDefined()
        r.usedIn?.forEach((u) => expect(fileById[u.asmId]).toBeDefined())
        r.childMatches?.forEach((c) => { if (c.fileId) expect(fileById[c.fileId]).toBeDefined() })
      })
    }
  })
  it('similarity is within 0 to 100; candidate rows spread across all three bands', () => {
    const config = buildAppConfig('company-a')
    for (const { rows } of featuredSets) {
      const bands = new Set<string>()
      rows.filter((r) => !r.isSourcePart).forEach((r) => {
        const p = r.quality.similarity?.percent
        if (p == null) return
        expect(p).toBeGreaterThanOrEqual(0); expect(p).toBeLessThanOrEqual(100)
        bands.add([...config.similarityBands].sort((a, b) => b.min - a.min).find((b) => p >= b.min)!.label)
      })
      expect(bands.size, 'bands').toBe(3)
    }
  })
  it('duplicates have similarity 100 and a classification; 100% is never anything else', () => {
    for (const r of allRows.filter((x) => !x.isSourcePart)) {
      if (r.quality.duplicate) expect(r.quality.similarity?.percent).toBe(100)
      if (r.quality.similarity?.percent === 100) expect(r.quality.duplicate).toBeDefined()
    }
  })
  it('every special case in docs/04 section 4 exists across the featured sets', () => {
    const rows = allRows.filter((r) => !r.isSourcePart)
    const q = (r: (typeof rows)[number]) => r.quality
    expect(rows.some((r) => q(r).duplicate === 'geometric-duplicate')).toBe(true)
    expect(rows.some((r) => q(r).duplicate === 'duplicate-file')).toBe(true)
    expect(rows.some((r) => q(r).confidence && q(r).similarity && q(r).dataType)).toBe(true)
    expect(rows.some((r) => q(r).dataType && !q(r).similarity && !q(r).confidence && q(r).dataType!.raw === 'Estimate')).toBe(true)
    expect(rows.some((r) => !q(r).dataType && !q(r).similarity && !q(r).confidence && !q(r).duplicate)).toBe(true)
    expect(rows.some((r) => q(r).dataType?.raw === 'No match' && !q(r).similarity)).toBe(true)
    expect(rows.some((r) => q(r).dataType?.raw === 'Search failed' && !q(r).similarity)).toBe(true)
    expect(featuredSets.some(({ rows: rs }) => rs.slice(1).some((r) => r.source !== rs[0]!.source))).toBe(true)
    expect(rows.some((r) => Object.values(r.measurements).some((m) => m.candidate === 'manual-required' && m.deviationPct === null))).toBe(true)
    expect(rows.some((r) => typeof q(r).confidence?.score === 'number')).toBe(true)
    expect(rows.some((r) => typeof q(r).confidence?.label === 'string')).toBe(true)
    expect(rows.some((r) => r.approval?.status === 'Review required')).toBe(true)
  })
  it('each featured set has exactly one manual-required measurement row when measurements exist', () => {
    for (const { rows } of featuredSets) {
      const n = rows.filter((r) => Object.values(r.measurements).some((m) => m.candidate === 'manual-required')).length
      expect(n).toBe(1)
    }
  })
  it('part-in-assembly rows carry a parent assembly; assembly rows carry child matches (one source for the count)', () => {
    const pia = featuredSets.filter((s) => s.f.modality === 'part-in-assembly-to-part')
    pia.forEach(({ rows }) => rows.filter((r) => !r.isSourcePart && r.quality.similarity).forEach((r) => expect(r.parentAssemblyId, r.name).toBeDefined()))
    featuredSets.filter((s) => s.f.modality.endsWith('assembly') && s.f.modality !== 'part-in-assembly-to-part').forEach(({ rows }) => {
      rows.filter((r) => r.quality.similarity && !r.isSourcePart).forEach((r) => expect(r.childMatches!.length).toBe(activeLeaves(fileById[r.fileId]!).length))
    })
    const seatSet = featuredSets.find((s) => s.f.file.startsWith('6644321') && s.f.modality === 'assembly-to-assembly')!
    expect(seatSet.rows[0]!.childMatches).toHaveLength(12)
  })
  it('is deterministic: the same query gives the same rows, and measurements never reshuffle them', () => {
    for (const f of FEATURED) {
      const a = generateResults(queryFor(f)), b = generateResults(queryFor(f))
      expect(b).toEqual(a)
      const none = generateResults(queryFor(f, []))
      expect(none.map((r) => r.id)).toEqual(a.map((r) => r.id))
      expect(none.map((r) => r.quality)).toEqual(a.map((r) => r.quality))
    }
    const x = measureCandidate('s', 'f1', M[0]!, false), y = measureCandidate('s', 'f1', M[0]!, false)
    expect(y).toEqual(x)
  })
  it('a different query gives different rows', () => {
    const a = generateResults(queryFor(FEATURED[0]!)), b = generateResults(queryFor(FEATURED[1]!))
    expect(a.map((r) => r.fileId)).not.toEqual(b.map((r) => r.fileId))
  })
  it('works for any file and modality, not only the featured ones', () => {
    for (const f of searchFiles) for (const modality of ['part-to-part', 'part-to-assembly', 'assembly-to-assembly', 'part-in-assembly-to-part'] as SearchModality[]) {
      const rows = generateResults({ modality, fileId: f.id, measurements: [] })
      expect(rows[0]?.isSourcePart).toBe(true)
      expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
    }
    expect(generateResults({ modality: 'part-to-part', fileId: 'nope', measurements: [] })).toEqual([])
    expect(seedKey({ modality: 'part-to-part', fileId: 'a' })).toBe('part-to-part|a|')
    expect(sourceOf({ modality: 'part-to-part', fileId: 'nope' })).toBeUndefined()
  })
})
