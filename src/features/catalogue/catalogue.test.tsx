import { screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { catalogueRoutes } from './routes'
import { Routes, Route } from 'react-router-dom'
import { render } from '@testing-library/react'
import { buildAppConfig } from '../../config/appConfig'
import { ConfigProvider } from '../../config/useConfig'
import { ServicesProvider } from '../../services/context'
import { catalogueStub } from '../../services/stubs/catalogue'
import { buildCompareRows, diffSummary, visibleRows } from './compareLogic'
import { toCsv } from './csv'
import { facetsFromFilters, filtersFromFacets, compareUrl, nodeUrl } from './urlState'
import { CompareView } from './CompareView'
import { PartDrawer } from './PartDrawer'

const app = (route: string, ui: React.ReactElement, tenant = 'company-a') => render(
  <MemoryRouter initialEntries={[route]}><ConfigProvider config={buildAppConfig(tenant)}><ServicesProvider>{ui}</ServicesProvider></ConfigProvider></MemoryRouter>,
)
const pn = (id: string) => catalogueStub.part(id)!

describe('compare logic', () => {
  it('excludes administrative fields from the difference count and from Differences Only', () => {
    const rows = buildCompareRows([pn('HX-M16-120-A2'), pn('SH-M16-110-88')])
    const sum = diffSummary(rows)
    expect(sum).toEqual({ differing: 9, total: 15 })
    expect(rows.filter((r) => r.administrative && !r.match).length).toBeGreaterThan(0)
    expect(visibleRows(rows, 'differences').some((r) => r.administrative || r.match)).toBe(false)
    expect(visibleRows(rows, 'all')).toHaveLength(rows.length)
  })
  it('a missing value differs from a value; two missing values match', () => {
    const [r] = buildCompareRows([pn('HX-M16-100-A2'), pn('HX-M16-100-A4')], { fields: [{ key: 'leadTime', label: 'Lead time', source: 'fields' }] })
    expect(r!.match).toBe(false)
    const [m] = buildCompareRows([pn('HX-M16-100-A4'), pn('HX-M16-100-A4')], { fields: [{ key: 'leadTime', label: 'Lead time', source: 'fields' }] })
    expect(m!.match).toBe(true)
  })
  it('works for three or more parts', () => {
    const rows = buildCompareRows([pn('HX-M16-120-A2'), pn('SH-M16-110-88'), pn('HX-M16-100-A2')])
    expect(rows.find((r) => r.key === 'pitchClass')!.match).toBe(true)
    expect(rows.find((r) => r.key === 'length')!.values).toEqual([120, 110, 100])
  })
})

describe('url state and csv', () => {
  it('round-trips facets and filters, with range and text', () => {
    const f = filtersFromFacets({ thread: ['M16'], length: ['100', ''] }, 'HX')
    expect(f.thread).toEqual({ values: ['M16'] })
    expect(f.length).toEqual({ min: 100, max: null })
    expect(f.pn).toEqual({ query: 'HX' })
    expect(facetsFromFilters(f)).toEqual({ facets: { thread: ['M16'], length: ['100', ''] }, text: 'HX' })
  })
  it('keeps the workflow context on every catalogue URL', () => {
    const cur = new URLSearchParams('ctx=catalogue-use%3Ap1&ret=%2Fprojects&junk=1')
    expect(nodeUrl('bolts', cur)).toBe('/catalogue/bolts?ctx=catalogue-use%3Ap1&ret=%2Fprojects')
    expect(compareUrl({ a: 'A', b: 'B', more: ['C'], form: 'table' }, cur)).toContain('ctx=catalogue-use%3Ap1')
  })
  it('exports a CSV with units in headers only', () => {
    const csv = toCsv([pn('HX-M16-120-A2')])
    const [head, line] = csv.trim().split('\n')
    expect(head).toContain('Length (mm)')
    expect(line).toContain('HX-M16-120-A2,M16 × 2.0,120,Hex')
    expect(line).not.toContain('120 mm')
  })
})

describe('compare screens', () => {
  const url = '/catalogue/compare?a=HX-M16-120-A2&b=SH-M16-110-88'
  it('dual form: two panes with ViewerPlaceholder x2, labelled A red and B blue', () => {
    app(`${url}&form=dual`, <CompareView />)
    expect(screen.getAllByTestId('viewer-placeholder')).toHaveLength(2)
    expect(screen.getByText('A · red overlay')).toBeInTheDocument()
    expect(screen.getByText('B · blue overlay')).toBeInTheDocument()
    expect(screen.getByTestId('diff-summary')).toHaveTextContent('9 of 15 fields differ')
  })
  it('table form: field rows, markers with text, dashed add column, Differences Only toggle', () => {
    app(`${url}&form=table`, <CompareView />)
    const t = screen.getByTestId('compare-table')
    expect(within(t).getByRole('button', { name: '+ Add part' })).toBeInTheDocument()
    expect(t.querySelector('tr[data-field="shank"]')).toHaveAttribute('data-state', 'match')
    expect(t.querySelector('tr[data-field="length"]')).toHaveAttribute('data-state', 'differs')
    expect(within(t).getAllByText('Differs').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Differences Only' }))
    expect(t.querySelector('tr[data-state="match"]')).toBeNull()
  })
  it('no decision action when plain browsing; Open in PLM disabled; Search on opens a new tab', () => {
    app(`${url}&form=table`, <CompareView />)
    expect(screen.queryAllByTestId('decision-action')).toHaveLength(0)
    screen.getAllByRole('button', { name: /in PLM/ }).forEach((b) => expect(b).toBeDisabled())
    screen.getAllByTestId('search-on').forEach((a) => expect(a).toHaveAttribute('target', '_blank'))
  })
  it('decision action per part when reached from a workflow, label from the registry', () => {
    app(`${url}&form=table&ctx=catalogue-use%3Ap1&ret=%2Fprojects`, <CompareView />)
    const btns = screen.getAllByTestId('decision-action')
    expect(btns).toHaveLength(2)
    expect(btns[0]).toHaveTextContent('Use This Part')
  })
  it('guards fewer than two parts', () => {
    app('/catalogue/compare?a=HX-M16-120-A2', <CompareView />)
    expect(screen.getByText('Select at least two parts to compare')).toBeInTheDocument()
  })
  it('Reuse status renders through the tenant vocabulary', () => {
    app(`${url}&form=table`, <CompareView />, 'company-b')
    expect(screen.getAllByText('OK').length).toBeGreaterThan(0)
    expect(screen.queryByText('Approved')).toBeNull()
  })
})

describe('part drawer', () => {
  it('is empty, never gone, without a part', () => {
    app('/catalogue', <PartDrawer part={null} inCompare={false} onToggleCompare={() => undefined} onClose={() => undefined} />)
    expect(screen.getByTestId('drawer-empty')).toBeInTheDocument()
  })
  it('shows spec, PLM data, used on, disabled PLM, and no decision action outside a workflow', () => {
    app('/catalogue', <PartDrawer part={pn('HX-M16-120-A2')} inCompare={false} onToggleCompare={() => undefined} onClose={() => undefined} />)
    expect(screen.getByRole('region', { name: 'Specification' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'PLM Data' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Used on' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to Compare' })).toBeInTheDocument()
    expect(screen.queryByTestId('decision-action')).toBeNull()
  })
})

describe('routes', () => {
  it('exposes the three catalogue routes', () => {
    expect(catalogueRoutes.map((r) => r.path)).toEqual(['catalogue', 'catalogue/compare', 'catalogue/:nodeId'])
  })
  it('landing shows 8 category tiles; non-data tiles carry the inline note', () => {
    app('/catalogue', <Routes>{catalogueRoutes.map((r) => <Route key={r.path} path={`/${r.path}`} element={r.element} />)}</Routes>)
    expect(screen.getByRole('heading', { name: 'Parts Catalogue' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-testid^="tile-"]')).toHaveLength(8)
    expect(screen.getByTestId('tile-bearings')).toHaveTextContent(/opens the same browse flow/i)
    expect(screen.getByTestId('tile-fasteners')).not.toHaveTextContent(/opens the same browse flow/i)
  })
})
