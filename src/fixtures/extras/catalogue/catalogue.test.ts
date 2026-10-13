import { describe, expect, it } from 'vitest'
import { CATALOGUE_FACETS, facetValue } from '../../../config/catalogueConfig'
import { TENANTS } from '../../../config/appConfig'
import type { CatalogueNode } from '../../../domain/catalogue'
import { buildCompareRows, diffSummary } from '../../../features/catalogue/compareLogic'
import { catalogueStub, CATALOGUE_ROWS } from '../../../services/stubs/catalogue'
import boltsJson from './bolts.json'
import pairsJson from './pairs.json'
import treeJson from './tree.json'

const rows = CATALOGUE_ROWS
const walk = (n: CatalogueNode, f: (n: CatalogueNode) => void) => { f(n); n.children?.forEach((c) => walk(c, f)) }

describe('catalogue fixtures', () => {
  it('has 60 to 120 rows with unique part numbers and ids', () => {
    expect(rows.length).toBeGreaterThanOrEqual(60)
    expect(rows.length).toBeLessThanOrEqual(120)
    expect(new Set(rows.map((r) => r.partNumber)).size).toBe(rows.length)
    const ids: string[] = []
    treeJson.categories.forEach((c) => walk(c as unknown as CatalogueNode, (n) => ids.push(n.id)))
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('every row carries the concept field set, in consistent units', () => {
    for (const r of rows) {
      for (const k of ['thread', 'length', 'grade', 'head', 'material', 'finish', 'standard', 'supplier', 'source']) expect(r.fields[k], `${r.partNumber}.${k}`).toBeTruthy()
      expect(typeof r.fields.length).toBe('number')
      expect(r.usedOn.length).toBeGreaterThan(0)
      expect(JSON.stringify(r)).not.toMatch(/\bcm\b/)
    }
  })
  it('every Reuse Status raw value has a vocabulary entry in both tenant profiles', () => {
    for (const t of Object.values(TENANTS)) {
      const vocab = t.vocabularies.find((v) => v.id === 'reuseStatus')!
      for (const r of rows) expect(vocab.values.map((v) => v.raw), `${t.id} ${r.reuseStatus}`).toContain(r.reuseStatus)
    }
    for (const r of rows) {
      const rel = TENANTS['company-a']!.vocabularies.find((v) => v.id === 'releaseStatus')!
      expect(rel.values.map((v) => v.raw)).toContain(String(r.plm.releaseStatus))
    }
  })
  it('never uses the word "Exact"', () => { expect(JSON.stringify(boltsJson) + JSON.stringify(treeJson) + JSON.stringify(pairsJson)).not.toMatch(/exact/i) })
  it('tree counts are consistent with rows', () => {
    const tree = catalogueStub.tree()
    const find = (id: string) => { let hit: CatalogueNode | undefined; tree.forEach((r) => walk(r, (n) => { if (n.id === id) hit = n })); return hit! }
    expect(find('bolts').count).toBe(rows.length)
    const sizes = find('bolts').children!
    expect(sizes.reduce((a, n) => a + n.count, 0)).toBe(rows.length)
    for (const n of sizes) expect(n.count).toBe(rows.filter((r) => r.fields.thread === n.label).length)
    const fast = find('fasteners')
    expect(fast.count).toBe(fast.children!.reduce((a, n) => a + n.count, 0))
    expect(treeJson.categories).toHaveLength(8)
    expect(fast.children!.map((c) => c.label)).toEqual(['Bolts', 'Screws', 'Nuts', 'Washers'])
    walk(find('bolts'), (n) => expect((n.axes ?? []).length).toBeLessThanOrEqual(3))
  })
  it('facet counts equal recomputed counts, with every other facet applied', () => {
    const facets = { thread: ['M16'], head: ['Hex', 'Socket head'] }
    const { facetCounts } = catalogueStub.query('bolts', facets)
    for (const d of CATALOGUE_FACETS.filter((f) => f.kind === 'enum')) {
      const others = rows.filter((r) => Object.entries(facets).every(([k, vals]) => k === d.key || vals.includes(String(facetValue(r, CATALOGUE_FACETS.find((x) => x.key === k)!)))))
      const expected: Record<string, number> = {}
      rows.forEach((r) => { expected[String(facetValue(r, d))] ??= 0 })
      others.forEach((r) => { expected[String(facetValue(r, d))]++ })
      expect(facetCounts[d.key], d.key).toEqual(expected)
    }
  })
  it('live tree: a filter dims row-less nodes and updates counts', () => {
    const live = catalogueStub.liveTree({ head: ['Hex'] })
    const get = (id: string) => { let hit: CatalogueNode | undefined; live.forEach((r) => walk(r, (n) => { if (n.id === id) hit = n })); return hit! }
    expect(get('bolts').count).toBe(rows.filter((r) => r.fields.head === 'Hex').length)
    expect(get('bearings').count).toBe(0)
    expect(get('screws').count).toBe(0)
    expect(get('bolts-m16').count).toBe(rows.filter((r) => r.fields.head === 'Hex' && r.fields.thread === 'M16').length)
  })
  it('OR within a facet, AND across facets', () => {
    const or = catalogueStub.query('bolts', { head: ['Hex', 'Flange'] }).rows
    expect(or.every((r) => ['Hex', 'Flange'].includes(String(r.fields.head)))).toBe(true)
    const and = catalogueStub.query('bolts', { head: ['Hex', 'Flange'], thread: ['M16'] }).rows
    expect(and.length).toBeLessThan(or.length)
    expect(and.every((r) => r.fields.thread === 'M16')).toBe(true)
  })
  it('parses a spec query into facets', () => {
    const p = catalogueStub.parse('M16 hex stainless')
    expect(p.facets).toEqual({ thread: ['M16'], head: ['Hex'], grade: ['A2-70', 'A4-80'] })
    expect(p.text).toBe('')
    expect(catalogueStub.parse('M10 socket 10.9').facets).toEqual({ thread: ['M10'], head: ['Socket head'], grade: ['10.9'] })
    expect(catalogueStub.parse('M8 flange 30').facets).toEqual({ thread: ['M8'], head: ['Flange'], length: ['30', '30'] })
    expect(catalogueStub.query('bolts', catalogueStub.parse('M8 flange 30').facets).rows.length).toBeGreaterThan(0)
    expect(catalogueStub.parse('ISO 4014 zzz')).toMatchObject({ facets: { standard: ['ISO 4014'] }, text: 'zzz' })
  })
  it('is deterministic', () => { expect(catalogueStub.query('bolts', { thread: ['M16'] })).toEqual(catalogueStub.query('bolts', { thread: ['M16'] })) })
})

describe('compare pairs', () => {
  for (const pair of pairsJson.pairs) {
    it(`pair ${pair.id}: intended matches and mismatches hold, administrative fields never counted`, () => {
      const a = catalogueStub.part(pair.a)!, b = catalogueStub.part(pair.b)!
      const rowsC = buildCompareRows([a, b])
      const by = Object.fromEntries(rowsC.map((r) => [r.key, r]))
      pair.match.forEach((k) => expect(by[k]!.match, k).toBe(true))
      pair.differ.forEach((k) => expect(by[k]!.match, k).toBe(false))
      pair.administrativeDiffer.forEach((k) => { expect(by[k]!.administrative).toBe(true); expect(by[k]!.match, k).toBe(false) })
      const s = diffSummary(rowsC)
      expect(s.differing).toBe(pair.differ.length)
      expect(s.total).toBe(pair.match.length + pair.differ.length)
    })
  }
  it('worked pair is HX-M16-120-A2 vs SH-M16-110-88: 9 of 15 differ', () => {
    expect(pairsJson.pairs[0]).toMatchObject({ a: 'HX-M16-120-A2', b: 'SH-M16-110-88' })
    expect(diffSummary(buildCompareRows([catalogueStub.part('HX-M16-120-A2')!, catalogueStub.part('SH-M16-110-88')!]))).toEqual({ differing: 9, total: 15 })
  })
})
