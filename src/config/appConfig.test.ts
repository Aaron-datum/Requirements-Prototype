import { describe, expect, it } from 'vitest'
import { buildAppConfig, resolveValue, similarityBand, TENANTS } from './appConfig'

describe('config: vocabularies and bands', () => {
  const a = buildAppConfig('company-a'), b = buildAppConfig('company-b')
  it('resolves known values through the active vocabulary', () => {
    expect(resolveValue(a, 'dataType', 'Surrogate')).toMatchObject({ label: 'Surrogate', tone: 'info', known: true })
    expect(resolveValue(b, 'dataType', 'Surrogate')).toMatchObject({ label: 'Sur', known: true })
  })
  it('resolves opaque ids through the vocabulary', () => {
    expect(resolveValue(a, 'releaseStatus', 'id1055').label).toBe('Released')
    expect(resolveValue(b, 'releaseStatus', 'id1055').label).toBe('Approved for use')
  })
  it('falls back to raw text with a neutral tone for unknown values', () => {
    expect(resolveValue(a, 'releaseStatus', 'brand-new-status')).toEqual({ raw: 'brand-new-status', label: 'brand-new-status', tone: 'neutral', known: false })
    expect(resolveValue(a, 'no-such-vocabulary', 'x').tone).toBe('neutral')
  })
  it('bands similarity from config and never uses an Exact band', () => {
    expect(similarityBand(a, 92).label).toBe('High'); expect(similarityBand(a, 70).label).toBe('Medium'); expect(similarityBand(a, 12).label).toBe('Low')
    expect(JSON.stringify(a.similarityBands)).not.toMatch(/exact/i)
    for (const t of Object.values(TENANTS)) expect(JSON.stringify(t.vocabularies)).not.toMatch(/\bexact\b/i)
  })
  it('company B really differs: fields renamed, two dropped, one added', () => {
    const ka = a.schema.fields.map((f) => f.key), kb = b.schema.fields.map((f) => f.key)
    expect(ka).toContain('customerGroup'); expect(kb).not.toContain('customerGroup'); expect(kb).not.toContain('productGroup')
    expect(kb).toContain('supplierLeadTime'); expect(ka).not.toContain('supplierLeadTime')
    expect(a.schema.fields.find((f) => f.key === 'program')!.label).toBe('Program')
    expect(b.schema.fields.find((f) => f.key === 'program')!.label).toBe('Vehicle line')
  })
})
