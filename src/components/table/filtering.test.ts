import { describe, expect, it } from 'vitest'
import { applyFilters, isActive, optionCounts, presetRange } from './filtering'
import type { ColumnDef, FilterState } from './types'

interface R { id: string; prog: string; yr: string; w: number; d: string }
const rows: R[] = [
  { id: '1', prog: 'A', yr: 'MY24', w: 1, d: '2026-09-01' }, { id: '2', prog: 'A', yr: 'MY25', w: 5, d: '2026-06-01' },
  { id: '3', prog: 'B', yr: 'MY24', w: 9, d: '2025-01-01' }, { id: '4', prog: 'B', yr: 'MY25', w: 12, d: '' },
]
const cols: Array<ColumnDef<R>> = [
  { key: 'prog', label: 'Program', filter: 'multi-tag', get: (r) => r.prog },
  { key: 'yr', label: 'Year', filter: 'multi-tag', get: (r) => r.yr },
  { key: 'w', label: 'Weight', filter: 'range-units', get: (r) => r.w },
  { key: 'd', label: 'Date', filter: 'date-preset', get: (r) => r.d },
]
describe('table filtering', () => {
  it('multi-select within a facet is OR, facets combine with AND', () => {
    expect(applyFilters(rows, cols, { prog: { values: ['A', 'B'] } }).length).toBe(4)
    expect(applyFilters(rows, cols, { prog: { values: ['A', 'B'] }, yr: { values: ['MY24'] } }).map((r) => r.id)).toEqual(['1', '3'])
  })
  it('option counts are computed with all OTHER facets applied', () => {
    const state: FilterState = { prog: { values: ['A'] }, yr: { values: ['MY25'] } }
    const yrOpts = optionCounts(rows, cols, state, cols[1]!)
    expect(Object.fromEntries(yrOpts)).toEqual({ MY24: 1, MY25: 1 })       // yr ignores its own filter, keeps prog = A
    const progOpts = Object.fromEntries(optionCounts(rows, cols, state, cols[0]!))
    expect(progOpts).toEqual({ A: 1, B: 1 })
  })
  it('options with zero results stay listed at 0 so the UI can disable them', () => {
    const o = Object.fromEntries(optionCounts(rows, cols, { prog: { values: ['A'] }, yr: { values: ['MY24'] } }, cols[0]!))
    expect(o.B).toBe(1); expect(Object.fromEntries(optionCounts(rows, cols, { w: { min: 100 } }, cols[0]!))).toEqual({ A: 0, B: 0 })
  })
  it('range and date filters', () => {
    expect(applyFilters(rows, cols, { w: { min: 5, max: 9 } }).map((r) => r.id)).toEqual(['2', '3'])
    expect(applyFilters(rows, cols, { d: { preset: 'custom', from: '2026-01-01', to: '2026-12-31' } }).map((r) => r.id)).toEqual(['1', '2'])
    expect(presetRange('30d', '2026-10-08T00:00:00Z')).toEqual(['2026-09-08', '2026-10-08'])
    expect(applyFilters(rows, cols, { d: { preset: 'all' } }).length).toBe(4)
  })
  it('knows when a filter is active', () => {
    expect(isActive(cols[0]!, { values: [] })).toBe(false); expect(isActive(cols[0]!, { values: ['A'] })).toBe(true)
    expect(isActive(cols[3]!, { preset: 'custom' })).toBe(false); expect(isActive(cols[2]!, { min: 0 })).toBe(true)
  })
})
