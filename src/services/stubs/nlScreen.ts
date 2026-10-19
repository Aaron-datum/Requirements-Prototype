import type { NlMemory, NlTurn, ScreenColumn, ScreenRow, ScreenSnapshot } from '../../domain/types'

/**
 * Part of the nl-agent stub. Everything here works only from the ScreenSnapshot (columns, visible rows, selection, sort), so it
 * is as configurable as the tables themselves: no field, status or screen name appears in this file.
 */

export const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9%.\s_-]/g, ' ').replace(/\s+/g, ' ').trim()
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hasWord = (hay: string, needle: string): boolean => needle.length > 0 && new RegExp(`(^|[\\s_-])${esc(needle)}($|[\\s_-])`).test(hay)

const ORDINALS: Array<[RegExp, number]> = [[/\b(first|1st|top one)\b/, 0], [/\b(second|2nd)\b/, 1], [/\b(third|3rd)\b/, 2], [/\b(fourth|4th)\b/, 3], [/\b(fifth|5th)\b/, 4], [/\b(last|bottom one)\b/, -1]]
const WORD_NUM: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6 }

const fmt = (c: ScreenColumn, v: string | number | null | undefined): string => {
  if (v == null || v === '') return '—'
  return typeof v === 'number' ? `${Number.isInteger(v) ? v : Number(v.toFixed(2))}${c.unit ? ` ${c.unit}` : ''}` : String(v)
}
const names = (rows: ScreenRow[], n = 5): string => `${rows.slice(0, n).map((r) => r.label).join(', ')}${rows.length > n ? ` and ${rows.length - n} more` : ''}`

/** Find a column by the words used for it. Longest label match wins; a single distinctive word is enough. */
export function findColumn(text: string, cols: ScreenColumn[], kinds?: ScreenColumn['kind'][]): ScreenColumn | undefined {
  const t = norm(text)
  const pool = kinds ? cols.filter((c) => kinds.includes(c.kind)) : cols
  const full = pool.filter((c) => hasWord(t, norm(c.label))).sort((a, b) => b.label.length - a.label.length)[0]
  if (full) return full
  const words = (c: ScreenColumn) => norm(c.label).split(' ').filter((w) => w.length >= 4)
  const hits = pool.filter((c) => words(c).some((w) => hasWord(t, w) || hasWord(t, w.replace(/s$/, ''))))
  return hits.length === 1 ? hits[0] : hits.sort((a, b) => b.label.length - a.label.length)[0]
}

interface Cond { test: (r: ScreenRow) => boolean; parts: string[] }
const MORE = /\b(over|above|more than|greater than|at least|bigger than|higher than|>=?)\s*\$?(\d+(?:\.\d+)?)\s*(%|mm|kg|g|usd)?/
const LESS = /\b(under|below|less than|fewer than|at most|smaller than|lower than|cheaper than|<=?)\s*\$?(\d+(?:\.\d+)?)\s*(%|mm|kg|g|usd)?/
const NOT = /\b(not|except|excluding|without|isn'?t|aren'?t|other than)\s+(?:the\s+|any\s+)?$/

/** Words about values and numbers in a request, turned into a row test using only what the table contains. */
export function parseCondition(text: string, snap: ScreenSnapshot): Cond | null {
  const t = norm(text)
  const tests: Array<(r: ScreenRow) => boolean> = []
  const parts: string[] = []
  for (const c of snap.columns) {
    if (c.kind !== 'enum' && c.kind !== 'text') continue
    const vals = [...new Set(snap.rows.map((r) => r.v[c.key]).filter((v): v is string => typeof v === 'string' && v.length >= 3))]
    if (vals.length > 40) continue
    const hits = vals.filter((v) => hasWord(t, norm(v)))
    if (!hits.length) continue
    const first = t.indexOf(norm(hits[0]!))
    const negated = NOT.test(t.slice(0, first))
    tests.push((r) => (hits.includes(String(r.v[c.key])) ? !negated : negated))
    parts.push(`${negated ? 'not ' : ''}${hits.join(' or ')}`)
  }
  const more = MORE.exec(t), less = LESS.exec(t)
  const nums = snap.columns.filter((c) => c.kind === 'number')
  const pick = (unit?: string) => findColumn(t, nums) ?? nums.find((c) => unit && norm(c.unit ?? '') === unit) ?? (unit === '%' ? nums.find((c) => /similar|match|confidence|score/.test(norm(c.label))) : undefined) ?? (nums.length === 1 ? nums[0] : undefined)
  for (const [m, op] of [[more, '>'], [less, '<']] as const) {
    if (!m) continue
    const col = pick(m[3]); const n = Number(m[2])
    if (!col) continue
    tests.push((r) => { const v = r.v[col.key]; return typeof v === 'number' && (op === '>' ? v >= n : v <= n) })
    parts.push(`${col.label} ${op === '>' ? '≥' : '≤'} ${n}${col.unit ?? ''}`)
  }
  return tests.length ? { test: (r) => tests.every((f) => f(r)), parts } : null
}

/** Rows a phrase refers to: named, by position, or by pronoun from the last turn. */
export function resolveRows(text: string, snap: ScreenSnapshot, mem?: NlMemory): { rows: ScreenRow[]; how: 'name' | 'position' | 'memory' } | null {
  const t = norm(text)
  const named = snap.rows.filter((r) => hasWord(t, norm(r.id)) || (norm(r.label).length >= 4 && t.includes(norm(r.label))))
  if (named.length) return { rows: named, how: 'name' }
  const fromMemory = mem?.ids.length && mem.table === snap.table ? mem.ids.map((id) => snap.rows.find((r) => r.id === id)).filter((r): r is ScreenRow => !!r) : []
  const refersBack = /\b(those|them|these|of that|that list|from those|of them)\b/.test(t)
  const pool = refersBack && fromMemory.length > 1 ? fromMemory : snap.rows
  const top = /\b(?:top|first|best|next)\s+(\d+|two|three|four|five|six)\b/.exec(t)
  if (top) { const n = Number(top[1]) || WORD_NUM[top[1]!]!; return { rows: pool.slice(0, n), how: 'position' } }
  for (const [re, i] of ORDINALS) if (re.test(t)) { const row = pool.at(i); return row ? { rows: [row], how: 'position' } : null }
  if (/\b(it|that|this|them|those|these|same one)\b/.test(t) && fromMemory.length) return { rows: fromMemory, how: 'memory' }
  return null
}

/** Superlatives: which direction they point, and which column words they hint at ("longest" is about length). */
const HI = /\b(highest|largest|biggest|most|max(imum)?|top|greatest|longest|heaviest|tallest|widest|thickest|strongest|newest|latest|best|priciest|most expensive)\b/
const LO = /\b(lowest|smallest|least|min(imum)?|shortest|lightest|thinnest|weakest|cheapest|oldest|earliest|worst)\b/
const HINTS: Array<[RegExp, RegExp]> = [[/long|short/, /length/], [/heav|light/, /weight|mass/], [/tall/, /height/], [/wid/, /width/], [/thick|thin/, /thick/], [/cheap|expens|pric/, /price|cost/], [/new|old|late|early/, /date|edited|created|modified|released/]]
const hinted = (t: string, cols: ScreenColumn[]): ScreenColumn | undefined => { const h = HINTS.find(([w]) => w.test(t)); return h ? cols.find((c) => h[1].test(norm(c.label))) : undefined }

const done = (reply: string, extra: Partial<NlTurn> = {}): NlTurn => ({ reply, effects: [], flow: null, ...extra })
const remember = (rows: ScreenRow[], snap: ScreenSnapshot, label?: string, cond?: string): NlMemory => ({ ids: rows.map((r) => r.id), table: snap.table, label, cond })

export function describeScreen(snap: ScreenSnapshot): NlTurn {
  const on = snap.filters.length ? ` Filters: ${snap.filters.join('; ')}.` : ''
  const sel = snap.selected ? ` Selected: ${snap.rows.find((r) => r.id === snap.selected)?.label ?? snap.selected}.` : ''
  return done(`${snap.rows.length} of ${snap.total} rows.${on}${sel}`, { quick: ['Sort by something', 'What is highest?', 'Open the first one'] })
}

/** Answer questions about the rows on screen. Returns null when the text is not a question this can answer. */
export function answer(text: string, snap: ScreenSnapshot, mem?: NlMemory): NlTurn | null {
  const t = norm(text)
  const cond = parseCondition(t, snap)
  const matching = cond ? snap.rows.filter(cond.test) : snap.rows
  const withMemory = (rows: ScreenRow[], label?: string) => remember(rows, snap, label, text)

  if (/\b(where am i|what('?s| is) (on )?(this|the) (screen|page|table)|what can i do|what am i looking at|summar(y|ise|ize))\b/.test(t)) return describeScreen(snap)
  if (/\b(what|which) filters?\b|\bfilters? (are|is) (on|applied|active)\b/.test(t)) return done(snap.filters.length ? `Active: ${snap.filters.join('; ')}.` : 'No filters are applied.', { quick: snap.filters.length ? ['Clear the filters'] : undefined })

  if (/\bhow many\b|\bnumber of\b|\bcount\b/.test(t)) {
    if (!cond) return done(`${snap.rows.length} rows${snap.total !== snap.rows.length ? ` of ${snap.total}` : ''}.`, { memory: withMemory(snap.rows) })
    return done(`${matching.length} of ${snap.rows.length}: ${cond.parts.join(', ')}.`, { memory: withMemory(matching, cond.parts.join(', ')), quick: matching.length ? ['Show them', 'List them'] : undefined })
  }

  const nums = snap.columns.filter((c) => c.kind === 'number')
  const ext = HI.exec(t) ?? LO.exec(t)
  if (ext && !/\btop \d|\bfirst \d|\bmost of\b/.test(t)) {
    const col = findColumn(t, nums) ?? hinted(t, nums) ?? (nums.length === 1 ? nums[0] : undefined) ?? nums.find((c) => c.visible)
    if (col) {
      const hi = !LO.test(t)
      const pool = matching.filter((r) => typeof r.v[col.key] === 'number')
      if (!pool.length) return done(`No rows have a ${col.label}.`)
      const best = [...pool].sort((a, b) => (hi ? 1 : -1) * ((b.v[col.key] as number) - (a.v[col.key] as number)))[0]!
      return done(`${hi ? 'Highest' : 'Lowest'} ${col.label}: ${best.label}, ${fmt(col, best.v[col.key])}.`, { memory: withMemory([best], best.label), quick: ['Open it', 'Sort by ' + col.label] })
    }
  }
  const agg = /\b(total|sum|average|mean|avg)\b/.exec(t)
  if (agg) {
    const col = findColumn(t, nums) ?? (nums.length === 1 ? nums[0] : undefined)
    if (col) {
      const vals = matching.map((r) => r.v[col.key]).filter((v): v is number => typeof v === 'number')
      if (!vals.length) return done(`No ${col.label} values here.`)
      const sum = vals.reduce((a, b) => a + b, 0)
      return done(`${agg[1] === 'total' || agg[1] === 'sum' ? 'Total' : 'Average'} ${col.label}: ${fmt(col, agg[1] === 'total' || agg[1] === 'sum' ? sum : sum / vals.length)} across ${vals.length} rows.`)
    }
  }
  if (/\b(which|list|what are|name|who|show me (the )?names)\b/.test(t) && cond) {
    if (!matching.length) return done(`None match ${cond.parts.join(', ')}.`)
    return done(`${matching.length}: ${names(matching, 6)}.`, { memory: withMemory(matching, cond.parts.join(', ')), quick: ['Open the first', 'Show them'] })
  }
  if (/\b(tell me about|what is|what'?s|details?( of| on| for)?|describe|why is|why are|explain|info on)\b/.test(t)) {
    const ref = resolveRows(t, snap, mem)
    const row = ref?.rows[0]
    if (row) {
      const cols = snap.columns.filter((c) => c.visible).slice(0, 5)
      return done(`${row.label}: ${cols.map((c) => `${c.label} ${fmt(c, row.v[c.key])}`).join(' · ')}.`, { memory: withMemory([row], row.label), quick: ['Open it'] })
    }
  }
  return null
}

/** Do something to the table on screen. Returns null when the text is not an action this knows. */
export function act(text: string, snap: ScreenSnapshot, mem?: NlMemory): NlTurn | null {
  const t = norm(text)

  const gallery = /\b(gallery|grid|cards|thumbnails?)\b/.test(t) && /\b(view|switch|show|layout|as)\b/.test(t)
  if (gallery) return done('Switched to the gallery.', { effects: [{ type: 'layout', value: 'gallery' }] })
  if (/\b(table|list|rows?)\b/.test(t) && /\b(back to|switch to|show as|as a) (the )?(table|list)\b/.test(t)) return done('Back to the table.', { effects: [{ type: 'layout', value: 'table' }] })

  if (/\b(sort|order|rank|arrange)\b/.test(t)) {
    const col = findColumn(t, snap.columns) ?? hinted(t, snap.columns)
    if (!col) return done(`Sort by which column? ${snap.columns.filter((c) => c.visible).slice(0, 4).map((c) => c.label).join(', ')}.`, { quick: snap.columns.filter((c) => c.visible).slice(0, 3).map((c) => `Sort by ${c.label}`) })
    const asc = LO.test(t) || /\b(asc(ending)?|low to high|a to z)\b/.test(t)
    const desc = !asc && (HI.test(t) || /\b(desc(ending)?|z to a|high to low|latest)\b/.test(t))
    return done(`Sorted by ${col.label}, ${desc ? 'high to low' : 'low to high'}.`, { effects: [{ type: 'sort', key: col.key, dir: desc ? 'desc' : 'asc' }] })
  }
  if (/\bgroup\b/.test(t)) {
    if (/\b(ungroup|no grouping|remove (the )?grouping|don'?t group)\b/.test(t)) return done('Ungrouped.', { effects: [{ type: 'group', key: 'none' }] })
    const col = findColumn(t, snap.columns.filter((c) => c.kind === 'enum' || c.kind === 'text'))
    if (col) return done(`Grouped by ${col.label}.`, { effects: [{ type: 'group', key: col.key }] })
    return done('Group by which column?', { quick: snap.columns.filter((c) => c.kind === 'enum').slice(0, 3).map((c) => `Group by ${c.label}`) })
  }
  const showCol = /\b(show|add|display|bring up)\b.*\bcolumns?\b|\bcolumns?\b.*\b(show|add)\b/.test(t)
  const hideCol = /\b(hide|remove|drop|get rid of)\b.*\bcolumns?\b/.test(t)
  if (showCol || hideCol) {
    const col = findColumn(t.replace(/\bcolumns?\b/g, ''), snap.columns)
    if (!col) return done('Which column?', { quick: snap.columns.filter((c) => !c.visible).slice(0, 3).map((c) => `Show the ${c.label} column`) })
    return done(`${hideCol ? 'Hid' : 'Showing'} ${col.label}.`, { effects: [{ type: 'columns', key: col.key, show: !hideCol }] })
  }
  if (/\b(clear|deselect|unselect)\b.*\b(selection|selected|checks?)\b/.test(t)) return done('Selection cleared.', { effects: [{ type: 'select', ids: [] }] })

  if (/\b(open|select|pick|choose|highlight|check|tick|mark|pull up|go to|show)\b/.test(t) && !/\bcolumn\b/.test(t)) {
    const ref = resolveRows(t, snap, mem)
    if (ref && ref.rows.length) {
      const rows = ref.rows
      const label = rows.length === 1 ? rows[0]!.label : `${rows.length} rows`
      return done(rows.length === 1 ? `Opened ${label}.` : `Selected ${label}: ${names(rows, 4)}.`, { effects: [{ type: 'select', ids: rows.map((r) => r.id) }], memory: remember(rows, snap, label), quick: rows.length > 1 ? ['Compare them'] : undefined })
    }
  }
  return null
}
