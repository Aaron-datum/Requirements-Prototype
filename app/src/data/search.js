// Search engine over the example dataset. Four modalities from the New Search entry page:
//   pp  Part → Part              find similar parts
//   pa  Part → Assembly          find assemblies that use / contain similar parts
//   aa  Assembly → Assembly      find similar assemblies
//   ps  Part-in-Assy → Part      matching parts, tagged with their parent assembly
// plus 'text' (free-text box on the home page). Scores reuse the BOM Similarity vocabulary:
// Geometry / Manufacture complexity / Material / Supplier-location / Order of magnitude.
import { bomLines, partById, supplierById, programById, progShort, siBomByPart } from './index'
import partsRaw from '../../../datum-requirements-workflow-handoff/data/parts.json'

export const MODES = {
  pp: { label: 'Part → Part', title: 'Find similar parts', desc: 'Upload a part. Get back individual parts with similar geometry. No assemblies.', cta: 'Upload a part', result: 'matching parts', unit: 'part' },
  pa: { label: 'Part → Assembly', title: 'Find assemblies that use this part', desc: 'Upload a part. Get back assemblies that contain similar parts as a sub-component.', cta: 'Upload a part', result: 'assemblies containing it', unit: 'part' },
  aa: { label: 'Assembly → Assembly', title: 'Find similar assemblies', desc: 'Upload an assembly. Get back assemblies with similar structure and matching child parts.', cta: 'Upload an assembly', result: 'similar assemblies', unit: 'assembly' },
  ps: { label: 'Part-in-Assy → Part', title: 'Pull matching parts out of assemblies', desc: 'Upload a part within an assembly. Get back matching parts, tagged with their parent assembly.', cta: 'Upload a part in assembly', result: 'matching parts', unit: 'part-in-assembly' },
  text: { label: 'Text search', title: 'Part search', desc: '', cta: '', result: 'matching parts', unit: 'text' },
}

export const CRITERIA = [
  ['geometry', 'Geometry'], ['manufacture_complexity', 'Manufacture complexity'], ['material', 'Material'],
  ['supplier_location', 'Supplier / location'], ['order_of_magnitude', 'Order of magnitude'],
]
export const ALL_CRIT = CRITERIA.map(([k]) => k)

const family = (id) => id.replace(/-[A-Z]$/, '')
const ratio = (a, b) => (a === b ? 1 : Math.min(a, b) / Math.max(a, b || 1))
const firstWord = (s) => s.toLowerCase().split(/[\s,]+/)[0]

// Where each part is used: [{program_id, subassembly}]
const usage = {}
bomLines.forEach((l) => { (usage[l.part_id] ||= []).push({ program_id: l.program_id, subassembly: l.subassembly }) })
export const usageOf = (partId) => usage[partId] || []

export function similarity(a, b, crit = ALL_CRIT) {
  // The dataset's own breakdown wins when it exists for this exact pair, so search agrees with the BOM Similarity tab.
  const known = bomLines.find((l) => l.part_id === a.part_id && l.surrogate_breakdown && l.other_candidates.some((c) => c.part_id === b.part_id))
  let br
  if (known) br = known.surrogate_breakdown
  else {
    const w = ratio(a.weight_kg, b.weight_kg)
    const sameFam = family(a.part_id) === family(b.part_id)
    const sameSub = a.subsystem === b.subsystem
    br = {
      geometry: Math.round(sameFam ? 70 + 30 * w : sameSub ? 25 + 35 * w : 8 + 20 * w),
      manufacture_complexity: a.manufacture_method === b.manufacture_method ? (a.complexity === b.complexity ? 100 : 65) : a.complexity === b.complexity ? 30 : 10,
      material: a.material === b.material ? 100 : firstWord(a.material) === firstWord(b.material) ? 60 : 10,
      supplier_location: a.supplier_id === b.supplier_id ? 100 : supplierById[a.supplier_id].region.slice(0, 2) === supplierById[b.supplier_id].region.slice(0, 2) ? 70 : supplierById[a.supplier_id].category === supplierById[b.supplier_id].category ? 50 : 20,
      order_of_magnitude: Math.round(100 * ratio(a.base_price_usd, b.base_price_usd)),
    }
  }
  const use = crit.length ? crit : ALL_CRIT
  return { ...br, total: Math.round(use.reduce((s, k) => s + br[k], 0) / use.length) }
}

export const assemblies = (() => {
  const m = new Map()
  bomLines.forEach((l) => {
    const k = `${l.program_id}|${l.subassembly}`
    if (!m.has(k)) m.set(k, { key: k, program_id: l.program_id, subassembly: l.subassembly, parts: [] })
    m.get(k).parts.push(partById[l.part_id])
  })
  return [...m.values()]
})()
export const assemblyByKey = Object.fromEntries(assemblies.map((a) => [a.key, a]))
export const assemblyLabel = (a) => `${a.subassembly} · ${progShort(a.program_id)}`

const partRow = (q, p, crit) => {
  const s = similarity(q, p, crit)
  return { id: p.part_id, part: p, ...s, programs: [...new Set(usageOf(p.part_id).map((u) => progShort(u.program_id)))], parents: usageOf(p.part_id), inBom: !!siBomByPart[p.part_id] }
}

export function runSearch({ mode, src, q, crit }) {
  const use = crit?.length ? crit : ALL_CRIT
  if (mode === 'text') {
    const toks = (q || '').toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean)
    const rows = partsRaw.map((p) => {
      const hay = `${p.part_id} ${p.name} ${p.subsystem} ${p.material} ${p.manufacture_method} ${supplierById[p.supplier_id].name}`.toLowerCase()
      const hit = toks.filter((t) => hay.includes(t)).length
      return { id: p.part_id, part: p, total: toks.length ? Math.round((hit / toks.length) * 100) : 0, programs: [...new Set(usageOf(p.part_id).map((u) => progShort(u.program_id)))], parents: usageOf(p.part_id), inBom: !!siBomByPart[p.part_id] }
    }).filter((r) => r.total > 0)
    return { rows: rows.sort((a, b) => b.total - a.total || a.part.part_id.localeCompare(b.part.part_id)), kind: 'part', source: `“${q}”`, crit: use }
  }
  if (mode === 'pp' || mode === 'pa') {
    const qp = partById[src]
    if (!qp) return { rows: [], kind: 'part', source: src, crit: use }
    if (mode === 'pp') {
      const rows = partsRaw.filter((p) => p.part_id !== qp.part_id).map((p) => partRow(qp, p, use)).filter((r) => r.total >= 40)
      return { rows: rows.sort((a, b) => b.total - a.total), kind: 'part', source: `${qp.name} · ${qp.part_id}`, query: qp, crit: use }
    }
    const rows = assemblies.map((a) => {
      const scored = a.parts.map((p) => [p, p.part_id === qp.part_id ? { total: 100, ...Object.fromEntries(ALL_CRIT.map((k) => [k, 100])) } : similarity(qp, p, use)]).sort((x, y) => y[1].total - x[1].total)
      return { id: a.key, assembly: a, total: scored[0][1].total, best: scored[0][0], matched: scored.filter(([, s]) => s.total >= 60).length, parts: a.parts.length, exact: a.parts.some((p) => p.part_id === qp.part_id) }
    }).filter((r) => r.total >= 50)
    return { rows: rows.sort((a, b) => b.total - a.total || b.matched - a.matched), kind: 'assembly', source: `${qp.name} · ${qp.part_id}`, query: qp, crit: use }
  }
  if (mode === 'aa') {
    const qa = assemblyByKey[src]
    if (!qa) return { rows: [], kind: 'assembly', source: src, crit: use }
    const rows = assemblies.filter((a) => a.key !== qa.key).map((a) => {
      const best = qa.parts.map((p) => Math.max(...a.parts.map((x) => (x.part_id === p.part_id ? 100 : similarity(p, x, use).total))))
      const total = Math.round(best.reduce((s, v) => s + v, 0) / best.length)
      return { id: a.key, assembly: a, total, best: null, matched: best.filter((v) => v >= 60).length, parts: a.parts.length, exact: false }
    }).filter((r) => r.total >= 30)
    return { rows: rows.sort((a, b) => b.total - a.total), kind: 'assembly', source: assemblyLabel(qa), query: qa, crit: use }
  }
  // ps: src = program|subassembly|part
  const [pg, sub, pid] = (src || '').split('|')
  const qp = partById[pid]
  if (!qp) return { rows: [], kind: 'part', source: src, crit: use }
  const rows = partsRaw.filter((p) => p.part_id !== qp.part_id).map((p) => partRow(qp, p, use)).filter((r) => r.total >= 40)
  return { rows: rows.sort((a, b) => b.total - a.total), kind: 'part', source: `${qp.name} in ${sub} · ${progShort(pg)}`, query: qp, crit: use }
}

export const searchTitle = ({ mode, src, q }) => {
  if (mode === 'text') return `“${q}”`
  if (mode === 'aa') return `Assemblies like ${assemblyByKey[src] ? assemblyLabel(assemblyByKey[src]) : src}`
  const pid = mode === 'ps' ? (src || '').split('|')[2] : src
  const p = partById[pid]
  return `${mode === 'pa' ? 'Assemblies using' : mode === 'ps' ? 'In-assembly matches for' : 'Similar to'} ${p ? p.name : pid}`
}

export const searchHref = ({ mode, src, q, crit }) => `/search/results?mode=${mode}${src ? '&src=' + encodeURIComponent(src) : ''}${q ? '&q=' + encodeURIComponent(q) : ''}&crit=${(crit?.length ? crit : ALL_CRIT).join(',')}`
export { programById }
