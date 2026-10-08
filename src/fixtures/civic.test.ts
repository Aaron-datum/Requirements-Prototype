import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { bomLines, carryoverEvents, costEstimates, parts, programs, requirementTestLinks, requirements, suppliers, testRuns, tests } from './civic'
import { bomKpis, dangerousCases, programTotal, requirementRows, siAssemblyTree, siBomRows, stillOpenList } from './derive'
import { hashSeed, mulberry32 } from './rng'

describe('Civic dataset: counts from docs/04-fixtures-spec.md section 6', () => {
  it('has the known entity counts', () => {
    expect(parts.length).toBe(78); expect(suppliers.length).toBe(14); expect(bomLines.length).toBe(166); expect(requirements.length).toBe(16)
    expect(tests.length).toBe(15); expect(testRuns.length).toBe(25); expect(requirementTestLinks.length).toBe(16); expect(carryoverEvents.length).toBe(10); expect(costEstimates.length).toBe(5); expect(programs.length).toBe(3)
  })
  it('has the known BOM sizes and totals per program', () => {
    expect(bomLines.filter((l) => l.program_id === 'PGM-CIV-LX').length).toBe(55); expect(programTotal('PGM-CIV-LX')).toBeCloseTo(3384.4, 2)
    expect(bomLines.filter((l) => l.program_id === 'PGM-CIV-SPT').length).toBe(55); expect(programTotal('PGM-CIV-SPT')).toBeCloseTo(3609.05, 2)
    expect(siBomRows().length).toBe(56); expect(programTotal('PGM-CIV-SI')).toBeCloseTo(4071.36, 2)
  })
  it('passes the dataset generator referential-integrity check (data/validate.py)', () => {
    // validate.py resolves ./data relative to itself (it ships one level above the JSON), so run a copy beside a symlink.
    const dir = mkdtempSync(join(tmpdir(), 'datum-validate-'))
    copyFileSync(join(__dirname, '../../data/validate.py'), join(dir, 'validate.py'))
    symlinkSync(join(__dirname, '../../data'), join(dir, 'data'))
    try { execFileSync('python3', ['-I', join(dir, 'validate.py')], { stdio: 'pipe' }) } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return // no python on this machine: the TS checks below cover the same ground
      throw e
    }
  })
  it('foreign keys resolve', () => {
    const partIds = new Set(parts.map((p) => p.part_id)), supIds = new Set(suppliers.map((s) => s.supplier_id)), testIds = new Set(tests.map((t) => t.test_id)), reqIds = new Set(requirements.map((r) => r.req_id))
    bomLines.forEach((l) => { expect(partIds.has(l.part_id)).toBe(true); expect(supIds.has(l.supplier_id)).toBe(true) })
    requirementTestLinks.forEach((l) => { expect(reqIds.has(l.req_id)).toBe(true); expect(testIds.has(l.test_id)).toBe(true) })
    testRuns.forEach((r) => expect(testIds.has(r.test_id)).toBe(true)); carryoverEvents.forEach((c) => expect(reqIds.has(c.req_id)).toBe(true))
  })
  it('ids are unique', () => {
    expect(new Set(bomLines.map((l) => l.bom_line_id)).size).toBe(bomLines.length); expect(new Set(parts.map((p) => p.part_id)).size).toBe(parts.length)
  })
})

describe('derive layer', () => {
  it('groups the Si BOM into subassemblies and derives KPIs with their formulas', () => {
    const rows = siBomRows()
    const k = bomKpis(rows, { reuseTypes: ['Actual', 'Surrogate'], riskTypes: ['Estimated', 'No match'], riskSeverities: ['Critical', 'High'] })
    expect(k.firstOrderCost).toBeCloseTo(4071.36, 2); expect(k.totalLines).toBe(56)
    expect(k.certaintyCounts).toEqual({ Actual: 41, Surrogate: 13, Estimated: 1, 'No match': 1 })
    expect(k.reusePct).toBe(Math.round((54 / 56) * 100)); expect(k.riskParts.lines).toBe(2)
    expect(k.formulas.reuse).toMatch(/54 ÷ 56/)
  })
  it('flags exactly the three dangerous cases and the six still-open requirements', () => {
    const rows = requirementRows()
    expect(dangerousCases(rows).sort()).toEqual(['REC-20001', 'REC-20007', 'REC-20016'])
    expect(stillOpenList(rows).sort()).toEqual(['REC-20001', 'REC-20006', 'REC-20007', 'REC-20008', 'REC-20013', 'REC-20016'])
    expect(rows.every((r) => r.dangerous === r.dangerous_case)).toBe(true)
  })
  it('orders carryover chains by date', () => {
    for (const r of requirementRows()) { const d = r.chain.map((e) => e.date); expect([...d].sort()).toEqual(d) }
    expect(requirementRows().filter((r) => r.chain.length > 0).length).toBe(10)
  })
  it('generates the Si assembly tree from subassembly groupings', () => {
    const tree = siAssemblyTree()
    expect(tree.children!.length).toBe(9); expect(tree.children!.reduce((n, c) => n + c.children!.length, 0)).toBe(56)
  })
  it('carries the test cases the autonomy gate needs: ELEC-925-C No match, INT-510-C Estimated at 55', () => {
    const rows = siBomRows()
    expect(rows.find((r) => r.part_id === 'ELEC-925-C')!.certainty).toBe('No match')
    expect(rows.find((r) => r.part_id === 'INT-510-C')).toMatchObject({ certainty: 'Estimated', surrogate_match_pct: 55 })
  })
})

describe('seeded RNG', () => {
  it('is deterministic per seed', () => {
    const a = mulberry32('seed-1'), b = mulberry32('seed-1'), c = mulberry32('seed-2')
    const xs = [a(), a(), a()], ys = [b(), b(), b()]
    expect(xs).toEqual(ys); expect(c()).not.toBe(xs[0]); expect(hashSeed('x')).toBe(hashSeed('x'))
  })
})
