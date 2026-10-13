import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { deriveActionRows, sortBySeverity } from '../../fixtures/derive-projects'
import { dashboardStub } from '../../services/stubs/dashboard'
import { renderWithApp } from '../../test/utils'
import { HomePage, heroSearchHref } from '../home/HomePage'
import { ProjectDashboard } from './ProjectDashboard'

describe('action rows (derived from the Civic dataset)', () => {
  const rows = deriveActionRows()
  it('every row has due, impact, severity and owner', () => {
    expect(rows.length).toBeGreaterThan(15)
    for (const r of rows) for (const k of ['due', 'impact', 'severity', 'owner'] as const) expect(r[k], `${r.id} ${k}`).toBeTruthy()
  })
  it('covers dangerous cases, open test runs, surrogates, Estimated and No match lines', () => {
    const kinds = new Set(rows.map((r) => r.kind))
    for (const k of ['dangerous-case', 'open-test', 'surrogate', 'estimated', 'no-match']) expect(kinds.has(k)).toBe(true)
    expect(rows.filter((r) => r.kind === 'surrogate')).toHaveLength(13)
    expect(rows.filter((r) => r.kind === 'dangerous-case').map((r) => r.id).sort()).toEqual(['REC-20001', 'REC-20007', 'REC-20016'])
  })
  it('a decision removes a row and an output scope narrows rows and inherits its due date', () => {
    const line = rows.find((r) => r.kind === 'surrogate')!.id
    expect(deriveActionRows({ resolved: new Set([line]) })).toHaveLength(rows.length - 1)
    const bom = deriveActionRows({ outputId: 'bom-si' })
    expect(bom.length).toBeLessThan(rows.length)
    expect(new Set(bom.map((r) => r.due))).toEqual(new Set(['2026-10-30']))
  })
  it('sorts by the severity order given, unknown last', () => {
    const s = sortBySeverity(rows, ['Critical', 'High', 'Medium', 'Low'])
    expect(s[0]!.severity).toBe('Critical')
  })
})

describe('dashboard stub aggregation', () => {
  const cx = { certaintyOrder: ['Actual', 'Surrogate', 'Estimated', 'No match'], resultOrder: ['Pass', 'Carried', 'In progress', 'Scheduled'], label: (_: string, r: string) => r, tone: () => 'neutral' as const }
  it('certainty at program level counts the Si lines', () => {
    const s = dashboardStub.aggregate('program', 'certainty', cx)
    const si = s.rows.find((r) => r.label === 'Si')!
    expect(si.values.reduce((a, b) => a + b, 0)).toBe(56)
  })
  it('every zoom x metric combination produces rows', () => {
    for (const z of ['program', 'part', 'hw'] as const) for (const m of ['certainty', 'price', 'diversity', 'timeline'] as const) expect(dashboardStub.aggregate(z, m, cx).rows.length).toBeGreaterThan(0)
  })
})

const renderDash = (route: string) => renderWithApp(<Routes><Route path="/projects/:id" element={<ProjectDashboard scope="project" />} /><Route path="/projects/:id/outputs/:outputId" element={<ProjectDashboard scope="output" />} /></Routes>, 'company-a', route)

describe('ProjectDashboard', () => {
  it('renders the five bands for the Project overview and switches the viz form', async () => {
    renderDash('/projects/p-civic-si')
    expect(await screen.findByTestId('band-actions')).toBeInTheDocument()
    for (const id of ['box-urgent', 'box-review', 'box-left-off', 'status-bar', 'viz-slot', 'action-table']) expect(screen.getByTestId(id)).toBeInTheDocument()
    within(screen.getByRole('group', { name: 'Form' })).getByRole('button', { name: 'Table' }).click()
    expect(await screen.findByTestId('viz-table')).toBeInTheDocument()
  })
  it('Output overview uses the same shell', async () => {
    renderDash('/projects/p-civic-si/outputs/bom-si')
    expect(await screen.findByTestId('band-actions')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard')).toHaveAttribute('data-scope', 'output')
    expect(screen.getByTestId('viz-slot')).toBeInTheDocument()
  })
  it('shows an inline error for an unknown project', async () => {
    renderDash('/projects/nope')
    expect(await screen.findByRole('alert')).toHaveTextContent('No project')
  })
})

describe('Home', () => {
  it('shows the three quick actions, accepted formats from config and the recent strip with outcome text', () => {
    renderWithApp(<HomePage />)
    expect(screen.getByPlaceholderText('Describe a part, paste a spec, or search saved work...')).toBeInTheDocument()
    expect(screen.getByTestId('qa-search')).toHaveTextContent('CATPart · CATProduct · STEP · SolidWorks')
    expect(screen.getByTestId('qa-workflow')).toBeInTheDocument()
    expect(screen.getByTestId('qa-saved')).toHaveTextContent('No saved searches yet')
    const items = screen.getAllByTestId('recent-item')
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]).toHaveTextContent(/Pass|Warn|Fail/)
  })
  it('hero search href targets part-to-part files', () => {
    expect(heroSearchHref('M8 flange')).toBe('/search/files?q=M8%20flange&modality=part-to-part')
  })
})
