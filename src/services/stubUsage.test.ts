import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STUB_IDS } from '../components/stub/registry'
import { SERVICE_STUB } from './context'

const ROOT = join(__dirname, '..')
const walk = (dir: string, out: string[] = []): string[] => {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (/\.tsx$/.test(f) && !/\.test\./.test(f)) out.push(p) }
  return out
}

describe('stub usage', () => {
  it('registry covers every service stub id', () => {
    for (const ids of Object.values(SERVICE_STUB)) for (const id of ids) expect(STUB_IDS).toContain(id)
  })
  it('every screen that reaches a simulated service renders a <Stub> for it', () => {
    const offenders: string[] = []
    for (const file of walk(join(ROOT, 'features'))) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/useService\('(\w+)'\)/g)) {
        const key = m[1] as keyof typeof SERVICE_STUB
        const ids = SERVICE_STUB[key]
        if (!ids) continue
        if (!ids.some((id) => new RegExp(`<Stub[^>]*id=["']${id}["']`).test(text) || new RegExp(`stubId=["']${id}["']`).test(text))) offenders.push(`${file.replace(ROOT, 'src')}: useService('${key}') without <Stub id="${ids.join('" | "')}">`)
      }
    }
    expect(offenders).toEqual([])
  })
})
