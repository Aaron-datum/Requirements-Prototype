import { describe, expect, it } from 'vitest'
import { searchFiles as library } from '../../fixtures/derive-search'
import { compareStub, remainingDof } from '../../services/stubs/compare'
import { confidenceLevel } from './modalities'
import { decodeMeasurements, encodeMeasurement, readState, resultsHref } from './query'
import { compileQuery, searchFiles } from './searchIndex'

const names = (q: string) => searchFiles(library, q).map((f) => f.name)

describe('search index (part-number-first)', () => {
  it('ignores case, spacing and separators', () => {
    expect(names('k04 117 rs')).toContain('K04-117-RS_BRKT_MOUNT.SLDPRT')
    expect(names('K04_117_RS')).toEqual(expect.arrayContaining(['K04-117-RS_BRKT_MOUNT.SLDPRT', 'K04_117_RS_BRKT_MOUNT_B.SLDPRT']))
    expect(names('7100490 0000 ab')[0]).toBe('7100490_0000_AB_ASM_RSB40_DEF.CATPart')
  })
  it('supports * wildcards', () => {
    expect(names('7100490*').every((n) => n.startsWith('7100490'))).toBe(true)
    expect(names('*RSB40*').length).toBeGreaterThan(5)
    expect(names('7100490*DEF*')).toEqual(['7100490_0000_AB_ASM_RSB40_DEF.CATPart', '7100490_0000_AB_ASM_RSB40_DEF.CATPart'])
  })
  it('returns everything for an empty query and nothing for a miss; preferred status first', () => {
    expect(compileQuery('  ')).toBeNull()
    expect(searchFiles(library, '')).toHaveLength(40)
    expect(names('zzzz')).toEqual([])
    const out = searchFiles(library, '7100490', { preferValues: ['Released'] })
    const firstOther = out.findIndex((f) => f.plm.releaseStatus !== 'Released')
    expect(out.slice(0, firstOther).every((f) => f.plm.releaseStatus === 'Released')).toBe(true)
  })
})

describe('query in the URL', () => {
  it('round-trips measurements and state', () => {
    const ms = decodeMeasurements([encodeMeasurement({ id: 'x', typeKey: 'area', geometryRef: 'f10-face-14', value: 18250.4 })])
    expect(ms).toEqual([{ id: 'm1', typeKey: 'area', geometryRef: 'f10-face-14', value: 18250.4 }])
    const href = resultsHref({ file: 'f10', modality: 'part-to-assembly', part: 'n3', measurements: ms, src: 'new' })
    const st = readState(new URLSearchParams(href.split('?')[1]))
    expect(st).toMatchObject({ file: 'f10', modality: 'part-to-assembly', part: 'n3' })
    expect(st.measurements).toEqual(ms)
    expect(href).not.toContain('src=')
  })
  it('falls back to part to part for an unknown modality', () => {
    expect(readState(new URLSearchParams('file=f1&modality=nope')).modality).toBe('part-to-part')
  })
})

describe('compare and confidence helpers', () => {
  it('counts degrees of freedom from 6 and never below 0', () => {
    expect(remainingDof([])).toBe(6)
    expect(remainingDof(['coplanar'])).toBe(3)
    expect(remainingDof(['coplanar', 'coaxial', 'concentric'])).toBe(0)
  })
  it('infers a constraint from surface types and computes overlap deterministically', () => {
    expect(compareStub.inferConstraint('Face 1 (Plane)', 'Face 2 (Plane)')).toBe('coplanar')
    expect(compareStub.inferConstraint('Face 1 (Cylinder)', 'Face 2 (Cylinder)')).toBe('coaxial')
    const a = compareStub.computeOverlap('f1', 'f2', 2)
    expect(compareStub.computeOverlap('f1', 'f2', 2)).toEqual(a)
    expect(Math.round((a.queryOnly + a.overlap + a.resultOnly) * 10) / 10).toBe(100)
  })
  it('maps numeric and word confidence to filter levels', () => {
    expect(confidenceLevel({ score: 90 })).toBe('High')
    expect(confidenceLevel({ score: 70 })).toBe('Moderate')
    expect(confidenceLevel({ score: 10 })).toBe('Low')
    expect(confidenceLevel({ label: 'Moderate' })).toBe('Moderate')
    expect(confidenceLevel(undefined)).toBeUndefined()
  })
})
