import { describe, expect, it } from 'vitest'
import type { NlInput } from '../../domain/types'
import { nlAgentStub, SAMPLE_ASSEMBLY } from './nlAgent'

const projects = [{ id: 'p-civic-si', name: 'Civic Si 1.5T' }, { id: 'p-seat-track', name: 'Seat Track Bracket' }]
const ask = (text: string, extra: Partial<NlInput> = {}) => nlAgentStub.interpret({ text, flow: null, here: { pathname: '/', search: '' }, projects, ...extra })
const goes = (t: Awaited<ReturnType<typeof ask>>) => t.effects.flatMap((e) => (e.type === 'navigate' ? [e.to] : []))

describe('nl-agent: loose wording', () => {
  it.each(['create a BOM from this assembly', 'Can you build the bill of materials for me?', 'make me a bom out of the attached cad', 'I need a parts list generated'])('%s asks for the assembly first', async (text) => {
    const t = await ask(text)
    expect(t.flow?.id).toBe('create-bom'); expect(t.flow?.step).toBe('attach')
  })
  it('an attached assembly starts the flow at intake and asks for the program', async () => {
    const t = await ask('create a bom from the attached assembly', { attachment: 'engine.CATProduct' })
    expect(goes(t)).toEqual(['/create/bom/01-intake']); expect(t.flow?.step).toBe('program'); expect(t.quick).toContain('Civic Si 1.5T')
  })
  it('walks program, reference bodies, run', async () => {
    let t = await ask('Seat track please', { flow: { id: 'create-bom', step: 'program', attachment: SAMPLE_ASSEMBLY } })
    expect(t.flow?.program).toBe('Seat Track Bracket'); expect(goes(t)).toEqual(['/create/bom/02-tree'])
    t = await ask("yeah include them", { flow: t.flow })
    expect(t.effects.some((e) => e.type === 'include-reference' && e.on)).toBe(true)
    t = await ask('sure go ahead', { flow: t.flow })
    expect(goes(t)).toEqual(['/create/bom/03-review?autorun=1']); expect(t.flow?.step).toBe('after')
  })
  it('"no, leave them out" does not include reference bodies', async () => {
    const t = await ask("no, leave them out", { flow: { id: 'create-bom', step: 'reference' } })
    expect(t.effects.some((e) => e.type === 'include-reference')).toBe(false)
  })
  it('cancel stops a flow', async () => { expect((await ask('never mind', { flow: { id: 'create-bom', step: 'program' } })).flow).toBeNull() })
  it.each(['show me M16 hex stainless bolts', 'any stainless fasteners in the catalogue?'])('%s goes to the catalogue', async (text) => {
    expect((await ask(text)).effects[0]).toMatchObject({ type: 'catalogue' })
  })
  it.each(['compare the first two', 'put the top 3 side by side'])('%s compares', async (text) => { expect((await ask(text)).effects[0]).toMatchObject({ type: 'compare' }) })
  it('finds similar parts by file name', async () => {
    const t = await ask('find me something similar to FrameBack_Outer_v8')
    expect(goes(t)[0]).toMatch(/^\/search\/results\?file=/)
  })
  it.each([['take me to test mapping', '/create/requirements/05-mapping'], ['open settings', '/settings'], ['go to the approval screen', '/create/requirements/07-approve']])('%s opens a screen', async (text, to) => { expect(goes(await ask(text))).toEqual([to]) })
  it('filters the table on screen, and clears', async () => {
    expect((await ask('released only', { here: { pathname: '/search/results', search: '', table: 'results' } })).effects[0]).toMatchObject({ type: 'filter' })
    expect((await ask('clear the filters', { here: { pathname: '/', search: '', table: 'results' } })).effects[0]).toMatchObject({ type: 'clear-filters' })
  })
  it('unknown requests get suggestions, not a guess', async () => {
    const t = await ask('what is the weather'); expect(t.effects).toEqual([]); expect(t.quick?.length).toBeGreaterThan(0)
  })
})
