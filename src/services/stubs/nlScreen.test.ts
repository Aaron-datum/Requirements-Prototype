import { describe, expect, it } from 'vitest'
import type { NlInput, ScreenSnapshot } from '../../domain/types'
import { nlAgentStub } from './nlAgent'

const rows = [
  ['BLK-101', 'Cylinder block', 'Actual', 1200, 92], ['BLK-110', 'Crankshaft', 'Surrogate', 980, 81], ['HD-201', 'Cylinder head', 'Estimated', 2310, 60],
  ['HD-205', 'Intake camshaft', 'Estimated', 410, 55], ['TC-404', 'Turbo housing', 'No match', 4310, 0],
] as const
const snap: ScreenSnapshot = {
  table: 'bom', total: 12, checked: [], group: 'none', layout: 'table', filters: [],
  columns: [
    { key: 'name', label: 'Part name', kind: 'text', visible: true }, { key: 'state', label: 'Certainty', kind: 'enum', visible: true },
    { key: 'price', label: 'Price', kind: 'number', unit: 'USD', visible: true }, { key: 'sim', label: 'Similarity', kind: 'number', unit: '%', visible: true },
  ],
  rows: rows.map(([id, name, state, price, sim]) => ({ id, label: name, v: { name, state, price, sim } })),
}
const ask = (text: string, extra: Partial<NlInput> = {}) => nlAgentStub.interpret({ text, flow: null, screen: snap, here: { pathname: '/create/bom/03-review', search: '', table: 'bom' }, projects: [], ...extra })

describe('nl-agent: questions about the table on screen', () => {
  it('counts rows by a value', async () => { expect((await ask('how many are estimated?')).reply).toMatch(/^2 of 5: estimated/i) })
  it('counts with a number', async () => { expect((await ask('how many are over 80% similarity')).reply).toMatch(/^2 of 5/) })
  it('finds the extreme row', async () => { expect((await ask('which part has the highest price?')).reply).toContain('Turbo housing') })
  it('finds the lowest', async () => { expect((await ask("what's the cheapest one")).reply).toContain('Intake camshaft') })
  it('totals a column', async () => { expect((await ask('what is the total price')).reply).toMatch(/Total Price: 9,?210|Total Price: 9210/) })
  it('lists matches and remembers them', async () => {
    const t = await ask('which ones are estimated?')
    expect(t.reply).toContain('Cylinder head'); expect(t.memory?.ids).toEqual(['HD-201', 'HD-205'])
  })
  it('describes a named row', async () => { expect((await ask('tell me about the crankshaft')).reply).toContain('Certainty Surrogate') })
  it('says where you are', async () => { expect((await ask('what am i looking at')).reply).toMatch(/5 of 12 rows/) })
})

describe('nl-agent: acting on the table on screen', () => {
  it('sorts with direction', async () => { expect((await ask('sort by price highest first')).effects).toEqual([{ type: 'sort', key: 'price', dir: 'desc' }]) })
  it('sorts ascending by default for text', async () => { expect((await ask('order by part name')).effects).toEqual([{ type: 'sort', key: 'name', dir: 'asc' }]) })
  it('groups by an enum column', async () => { expect((await ask('group these by certainty')).effects).toEqual([{ type: 'group', key: 'state' }]) })
  it('shows and hides a column', async () => {
    expect((await ask('hide the price column')).effects).toEqual([{ type: 'columns', key: 'price', show: false }])
    expect((await ask('show the similarity column')).effects).toEqual([{ type: 'columns', key: 'sim', show: true }])
  })
  it('opens by position and by name', async () => {
    expect((await ask('open the second one')).effects).toEqual([{ type: 'select', ids: ['BLK-110'] }])
    expect((await ask('open the turbo housing')).effects).toEqual([{ type: 'select', ids: ['TC-404'] }])
    expect((await ask('select the top 3')).effects).toEqual([{ type: 'select', ids: ['BLK-101', 'BLK-110', 'HD-201'] }])
  })
  it('switches to gallery', async () => { expect((await ask('switch to the gallery view')).effects).toEqual([{ type: 'layout', value: 'gallery' }]) })
  it('undoes', async () => { expect((await ask('undo')).effects).toEqual([{ type: 'undo' }]) })
})

describe('nl-agent: follow-ups', () => {
  it('"open it" uses the last answer', async () => {
    const first = await ask('which part has the highest price?')
    expect((await ask('open it', { memory: first.memory ?? undefined })).effects).toEqual([{ type: 'select', ids: ['TC-404'] }])
  })
  it('"the second one" after a list indexes into that list', async () => {
    const list = await ask('which ones are estimated?')
    expect((await ask('open the second of those', { memory: list.memory ?? undefined })).effects).toEqual([{ type: 'select', ids: ['HD-205'] }])
  })
  it('"show them" turns a count into a filter', async () => {
    const c = await ask('how many are estimated?')
    const t = await ask('show them', { memory: c.memory ?? undefined })
    expect(t.effects[0]).toMatchObject({ type: 'filter', text: 'how many are estimated?' })
  })
  it('"compare them" uses the remembered rows', async () => {
    const list = await ask('which ones are estimated?')
    expect((await ask('compare them', { memory: list.memory ?? undefined })).effects[0]).toMatchObject({ type: 'compare', ids: ['HD-201', 'HD-205'] })
  })
})
