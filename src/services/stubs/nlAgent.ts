import type { NlAgent, NlEffect, NlFlow, NlInput, NlTurn } from '../../domain/types'
import { catalogueStub } from './catalogue'
import { engineStub } from './matchingEngine'
import { INTAKE } from '../../fixtures/derive-bom'
import { searchFiles } from '../../fixtures/derive-search'
import { normalizeName } from '../../fixtures/derive-search'
import { act, answer } from './nlScreen'

/**
 * StubId: nl-agent. Phrase matching, not a model. Loose wording is mapped to a fixed set of actions by keyword groups,
 * so "make me a BOM out of this", "create a bill of materials" and "can you build the BOM" all land on the same intent.
 * Anything unrecognised gets a fallback with suggestions. Deterministic: same input, same turn.
 */

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9%.\s_-]/g, ' ').replace(/\s+/g, ' ').trim()
const any = (t: string, ...res: RegExp[]): boolean => res.some((r) => r.test(t))

const YES = /\b(yes|yep|yeah|yup|sure|ok|okay|go ahead|do it|please|sounds good|include|run it|start|proceed|confirm|continue|go)\b/
const NO = /\b(no|nope|nah|skip|don'?t|dont|not|without|exclude|leave (them )?out|keep (them )?out)\b/
const CANCEL = /\b(cancel|stop|never ?mind|forget it|start over|abort)\b/

const MAKE = /\b(create|make|build|generate|start|set ?up|produce|put together|spin up|draw up|turn|convert|prepare|get me|i (need|want))\b/
const BOM = /\b(bom|b\.o\.m|bill of materials?|parts? list)\b/

const ASSEMBLY = INTAKE.files.find((f) => f.kind === 'cad-assembly')!
export const SAMPLE_ASSEMBLY = ASSEMBLY.name

const BOM_FLOW: NlFlow = { id: 'create-bom', step: 'attach' }

const nav = (to: string, label: string): NlEffect => ({ type: 'navigate', to, label })

/** Where "go to X" can take you. First match wins; patterns are loose on purpose. */
const TARGETS: Array<[RegExp, string, string]> = [
  [/\b(settings?|preferences?|system|theme|density)\b/, '/settings', 'Settings'],
  [/\b(my )?projects?\b|\bsaved searches\b|\bdashboard\b/, '/projects', 'My Projects'],
  [/\b(intake|rfq (package|files?))\b/, '/create/bom/01-intake', 'RFQ intake'],
  [/\bassembly tree\b/, '/create/bom/02-tree', 'Assembly tree'],
  [/\b(bom review|review (the )?bom|surrogate review|review lines?)\b/, '/create/bom/03-review', 'BOM review'],
  [/\b(composition|new carryover uncertain)\b/, '/create/bom/04-composition', 'Program composition'],
  [/\b(test )?mapping\b/, '/create/requirements/05-mapping', 'Test mapping'],
  [/\bcarry ?over\b/, '/create/requirements/06-carryover', 'Carryover review'],
  [/\bimpact( map)?\b/, '/create/requirements/06b-impact', 'Impact map'],
  [/\b(trace|traceability)\b/, '/create/requirements/06c-trace', 'Requirement trace'],
  [/\b(approve|approval|sign off)\b/, '/create/requirements/07-approve', 'Approve'],
  [/\b(find )?duplicates?\b/, '/search/files?modality=part-to-part&mode=duplicates', 'Find Duplicates'],
  [/\b(find )?revisions?\b/, '/search/files?modality=part-to-part&mode=revisions', 'Find Revisions'],
  [/\bassembly search\b/, '/search/files?modality=assembly-to-assembly', 'Assembly Search'],
  [/\b(part search|files?|library|cad library)\b/, '/search/files?modality=part-to-part', 'Part Search'],
  [/\b(new search|search)\b/, '/search/new', 'New Search'],
  [/\b(home|start page|main page)\b/, '/', 'Home'],
]
const GO = /\b(go to|open|show me|take me to|bring up|navigate to|jump to|switch to|head to|pull up|show)\b/

const PIPELINE = ['/create/bom/01-intake', '/create/bom/02-tree', '/create/bom/03-review', '/create/bom/04-composition', '/create/requirements/05-mapping', '/create/requirements/06-carryover', '/create/requirements/06b-impact', '/create/requirements/06c-trace', '/create/requirements/07-approve']

const FILTER_WORDS = /\b(only|filter|just|where|with|under|below|over|above|at least|at most|less than|more than|exclude|released|actual|surrogate|estimate)\b|[<>]=?\s*\d/
const CLEAR = /\b(clear|reset|remove|drop|undo)\b.*\b(filters?|everything|all)\b|\bshow (me )?(everything|all)\b/

const CATALOGUE = /\b(catalog(ue)?|bolts?|screws?|fasteners?|hex|socket|countersunk|flange|stainless|alloy steel|carbon steel|m\s?(6|8|10|12|16|20|24))\b/

const countsOf = (): string => `${ASSEMBLY.parts} parts across ${ASSEMBLY.subassemblies} subassemblies`

function fileFrom(text: string, attachment?: string) {
  if (attachment) return searchFiles.find((f) => normalizeName(f.name) === normalizeName(attachment))
  const t = normalizeName(text)
  return searchFiles.find((f) => t.includes(normalizeName(f.name.replace(/\.[^.]+$/, ''))) || (f.partNumber && t.includes(normalizeName(f.partNumber))))
}

async function flowTurn(i: NlInput, t: string): Promise<NlTurn | null> {
  const f = i.flow
  if (!f) return null
  if (CANCEL.test(t)) return { reply: 'Okay, stopped. Nothing was changed.', effects: [], flow: null }
  const stillHere = (reply: string, quick?: string[]): NlTurn => ({ reply, effects: [], quick, flow: f })

  if (f.step === 'attach') {
    const att = i.attachment ?? (any(t, /\b(sample|civic|demo|example|use that|that one)\b/) || YES.test(t) ? SAMPLE_ASSEMBLY : undefined)
    if (!att) return stillHere('Attach the assembly with the paperclip, or use the Civic sample.', ['Use the Civic sample'])
    return startBom(att, i)
  }
  if (f.step === 'program') {
    const lower = t
    const hit = i.projects.find((p) => norm(p.name).split(' ').filter((w) => w.length > 2).some((w) => lower.includes(w)))
    const program = hit?.name ?? (any(t, /\bnew\b/) ? 'New program' : i.text.trim())
    return {
      reply: `Program: ${program}. Assembly tree ready with 56 lines. ${INTAKE.referenceBodies.length} reference bodies are excluded. Include them?`,
      effects: [nav('/create/bom/02-tree', 'Opened assembly tree')], quick: ['Include them', 'Keep them out'], flow: { ...f, step: 'reference', program },
    }
  }
  if (f.step === 'reference') {
    const on = !NO.test(t) && any(t, /\b(include|yes|yep|sure|ok|okay|add)\b/)
    return {
      reply: `${on ? 'Included' : 'Kept out'} the reference bodies. Create the BOM and match every line against Civic LX and Sport?`,
      effects: on ? [{ type: 'include-reference', on: true }] : [], quick: ['Yes, run it', 'Not yet'], flow: { ...f, step: 'run' },
    }
  }
  if (f.step === 'run') {
    if (NO.test(t) && !YES.test(t.replace(NO, ''))) return { reply: 'Okay. Say "run the search" when you are ready.', effects: [], flow: null }
    return {
      reply: 'Creating the BOM and running the surrogate search.',
      effects: [
        { type: 'audit', action: 'Started BOM creation from chat', subject: { type: 'bom', id: 'RFQ-26-0512' }, note: f.attachment },
        nav('/create/bom/03-review?autorun=1', 'Opened BOM review'), { type: 'await-bom-search' },
      ],
      quick: ['Open composition', 'Go to test mapping'], flow: { ...f, step: 'after' },
    }
  }
  return null // 'after': the flow is over, treat the text normally
}

function startBom(attachment: string, i: NlInput): NlTurn {
  void i
  return {
    reply: `Read ${attachment}: ${countsOf()}. Which program is this for?`,
    effects: [nav('/create/bom/01-intake', 'Opened RFQ intake'), { type: 'audit', action: 'Attached assembly in chat', subject: { type: 'bom', id: 'RFQ-26-0512' }, note: attachment }],
    quick: [...i.projects.map((p) => p.name), 'New program'], flow: { ...BOM_FLOW, step: 'program', attachment },
  }
}

export const nlAgentStub: NlAgent = {
  async interpret(i: NlInput): Promise<NlTurn> {
    const t = norm(i.text)
    const here = i.here

    // 1. A running flow gets first refusal on short replies.
    const inFlow = await flowTurn(i, t)
    if (inFlow && !(any(t, GO) && TARGETS.some(([re]) => re.test(t)) && t.split(' ').length > 3)) return inFlow
    const flow = i.flow && i.flow.step !== 'after' ? i.flow : null

    // 2. Create a BOM.
    if (MAKE.test(t) && BOM.test(t)) {
      const att = i.attachment ?? (any(t, /\b(civic|sample|demo)\b/) ? SAMPLE_ASSEMBLY : undefined)
      if (!att) return { reply: 'Attach the assembly with the paperclip and I will start. Or use the Civic sample.', effects: [], quick: ['Use the Civic sample'], flow: { ...BOM_FLOW } }
      return startBom(att, i)
    }

    // 3. Run the surrogate search.
    if (any(t, /\b(run|start|kick off|do|launch)\b.*\b(search|matching|surrogates?)\b/, /\b(match|find surrogates for)\b.*\b(lines?|bom)\b/)) {
      return { reply: 'Running the surrogate search.', effects: [nav('/create/bom/03-review?autorun=1', 'Opened BOM review'), { type: 'await-bom-search' }], quick: ['Open composition'], flow }
    }

    // 4. Compare (catalogue table).
    if (any(t, /\b(compare|side by side|versus|vs|differences between|diff)\b/)) {
      const digits = /\b(\d+)\b/.exec(t)?.[1]
      const n = /\b(all|every)\b/.test(t) ? 99 : digits ? Math.max(2, Number(digits)) : /\bthree\b/.test(t) ? 3 : /\bfour\b/.test(t) ? 4 : 2
      const ids = i.memory && /\b(them|those|these|that)\b/.test(t) && i.memory.ids.length >= 2 ? i.memory.ids : undefined
      return { reply: ids ? `Comparing those ${ids.length}.` : `Comparing the first ${n > 50 ? 'selection' : `${n}`} in the table.`, effects: [{ type: 'compare', count: ids?.length ?? n, ids }], flow }
    }

    // 5. Clear filters.
    if (CLEAR.test(t) && here.table) return { reply: 'Cleared the filters.', effects: [{ type: 'clear-filters' }], flow }

    // 5b. Follow-ups that lean on the last turn.
    if (i.memory?.cond && /\b(show|filter( to)?|only|just|narrow( to)?|keep)\b.*\b(them|those|these|that)\b/.test(t) && here.table) return { reply: 'Filtering to those.', effects: [{ type: 'filter', text: i.memory.cond }], flow }
    if (/^(undo|go back|revert|put it back)( that| the last( one)?)?$/.test(t)) return { reply: 'Undone.', effects: [{ type: 'undo' }], flow }

    // 5c. Act on, and answer questions about, the table on screen.
    if (i.screen) {
      const doing = act(i.text, i.screen, i.memory)
      if (doing) return { ...doing, flow }
      const asked = answer(i.text, i.screen, i.memory)
      if (asked) return { ...asked, flow }
      if (i.memory?.ids.length && /\b(list|name)\b.*\b(them|those|these)\b/.test(t)) {
        const rows = i.memory.ids.map((id) => i.screen!.rows.find((r) => r.id === id)?.label ?? id)
        return { reply: `${rows.slice(0, 8).join(', ')}${rows.length > 8 ? ` and ${rows.length - 8} more` : ''}.`, effects: [], flow }
      }
    }

    // 6. Catalogue lookup.
    if (CATALOGUE.test(t) && (here.table === 'catalogue' || !FILTER_WORDS.test(t) || /\b(catalog(ue)?|bolts?)\b/.test(t))) {
      const parsed = catalogueStub.parse(i.text)
      const n = Object.values(parsed.facets).flat().length
      return { reply: n || parsed.text ? 'Looking that up in the Catalogue.' : 'Opening the Catalogue.', effects: [{ type: 'catalogue', text: i.text }], quick: n ? ['Compare the first two'] : undefined, flow }
    }

    // 7. Find similar parts for a file.
    if (any(t, /\b(similar|looks? like|alike|alternatives?|equivalents?|same as|replacements?|surrogates?|duplicates? of|matches? for|matching)\b/)) {
      const file = fileFrom(i.text, i.attachment)
      if (file) {
        const modality = file.kind === 'assembly' ? 'assembly-to-assembly' : 'part-to-part'
        const rows = await engineStub.runSearch({ modality, fileId: file.id, measurements: [] })
        return {
          reply: `${rows.length} matches for ${file.name}. Say things like "released only" or "over 80% similarity" to narrow them.`,
          effects: [nav(`/search/results?file=${file.id}&modality=${modality}`, 'Opened results')], quick: ['Over 80% similarity', 'Released only'], flow,
        }
      }
      return { reply: 'Which part or assembly? Name a file, or attach one.', effects: [nav('/search/new', 'Opened New Search')], flow }
    }

    // 8. Next step in the Create pipeline.
    if (any(t, /^(next|continue|go on|keep going|next step|move on)\b/)) {
      const at = PIPELINE.findIndex((p) => here.pathname.startsWith(p))
      const to = PIPELINE[at + 1]
      if (at >= 0 && to) return { reply: 'On to the next step.', effects: [nav(to, 'Opened next step')], flow }
      return { reply: 'There is no next step here. Where would you like to go?', effects: [], flow }
    }

    // 9. Go somewhere.
    const target = TARGETS.find(([re]) => re.test(t))
    if (target && (GO.test(t) || t.split(' ').length <= 3)) return { reply: `Opening ${target[2]}.`, effects: [nav(target[1], `Opened ${target[2]}`)], flow }

    // 10. Filter whatever table is on screen.
    if (here.table && FILTER_WORDS.test(t)) return { reply: 'Filtering.', effects: [{ type: 'filter', text: i.text }], flow }
    if (here.table) return { reply: 'Filtering.', effects: [{ type: 'filter', text: i.text }], flow }

    // 11. Fallback.
    return {
      reply: 'I can create a BOM from an assembly, find similar parts, look up bolts in the Catalogue, filter a table, or open a screen. Which one?',
      effects: [], quick: ['Create a BOM from an assembly', 'Show M16 hex stainless bolts', 'Open test mapping'], flow,
    }
  },
}
