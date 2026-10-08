// Design-system adherence check: no raw hex colours, rgb()/hsl() literals or non-design-system fonts in src/.
// Colours come from tokens in design-system/colors_and_type.css (and design-system/datum-overrides.css).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname
const EXT = /\.(ts|tsx|css)$/
const rules = [
  [/#[0-9a-fA-F]{3,8}\b(?![\w-])/g, 'raw hex colour'],
  [/\b(?:rgb|rgba|hsl|hsla)\(/g, 'raw colour function'],
  [/font-family\s*:(?!\s*(?:var\(|inherit))/gi, 'font-family not from tokens'],
  [/\bfont-weight\s*:\s*(?:600|700|800|900|bold)/gi, 'font weight above 500'],
  [/box-shadow\s*:(?!\s*(?:none|inset))/gi, 'drop shadow (elevation is communicated by borders)'],
  [/(?:linear|radial)-gradient\(/gi, 'gradient'],
]
const bad = []
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (EXT.test(f) && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx')) {
      const text = readFileSync(p, 'utf8')
      text.split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\/\*|\*)/.test(line)) return // comments may mention colours
        for (const [re, why] of rules) { re.lastIndex = 0; if (re.test(line)) bad.push(`${p.replace(ROOT, 'src')}:${i + 1}  ${why}: ${line.trim().slice(0, 100)}`) }
      })
    }
  }
}
walk(ROOT)
if (bad.length) { console.error(`Design-system adherence: ${bad.length} problem(s)\n` + bad.join('\n')); process.exit(1) }
console.log('Design-system adherence: OK (no raw colours, fonts, shadows or gradients in src/)')
