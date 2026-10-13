import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLedger } from '../../../stores/ledgerStore'
import { renderWithApp } from '../../../test/utils'
import { ApproveScreen } from './screens/ApproveScreen'
import { CarryoverScreen } from './screens/CarryoverScreen'
import { ImpactScreen } from './screens/ImpactScreen'
import { MappingScreen } from './screens/MappingScreen'
import { TraceScreen } from './screens/TraceScreen'

beforeEach(() => { useLedger.getState().reset() })
const rowOf = (id: string) => document.querySelector(`tr[data-row-id="${id}"]`) as HTMLElement

describe('06c trace: dangerous cases', () => {
  it('highlights exactly REC-20001, 20007 and 20016 with the text "Driver changed", with nothing selected', () => {
    renderWithApp(<TraceScreen />)
    const danger = [...document.querySelectorAll('tr[data-tone="danger"]')].map((r) => r.getAttribute('data-row-id'))
    expect(danger).toEqual(['REC-20001', 'REC-20007', 'REC-20016'])
    expect(document.querySelectorAll('tr[aria-selected="true"]')).toHaveLength(0)
    danger.forEach((id) => expect(within(rowOf(id!)).getByText('Driver changed')).toBeInTheDocument())
    expect(within(rowOf('REC-20002')).queryByText('Driver changed')).toBeNull()
  })
  it('selecting a row does not change which rows are highlighted', () => {
    renderWithApp(<TraceScreen />, 'company-a', '/?req=REC-20003')
    expect(document.querySelectorAll('tr[data-tone="danger"]')).toHaveLength(3)
    expect(rowOf('REC-20003').getAttribute('aria-selected')).toBe('true')
  })
  it('Driven by always shows a score or an explicit n/a', () => {
    renderWithApp(<TraceScreen />)
    expect(within(rowOf('REC-20001')).getByText('n/a')).toBeInTheDocument()
    expect(within(rowOf('REC-20002')).getByText('95%')).toBeInTheDocument()
  })
  it('Confirm Changed applies to every requirement sharing the interface and writes an audit entry for each', async () => {
    renderWithApp(<TraceScreen />, 'company-a', '/?req=REC-20001')
    fireEvent.click(await screen.findByRole('button', { name: /Confirm Changed · applies to 2/ }))
    await waitFor(() => expect(useLedger.getState().audit.filter((a) => a.action === 'Confirmed Driven by Changed').map((a) => a.subject.id).sort()).toEqual(['REC-20001', 'REC-20008']))
    expect(useLedger.getState().audit[0]!.by).toBe('Aaron Keller')
    expect(document.querySelector('tr[data-row-id="REC-20001"]')!.getAttribute('data-tone')).toBeNull()
    expect(document.querySelectorAll('tr[data-tone="danger"]')).toHaveLength(2)
  })
})

describe('05 mapping', () => {
  it('Accept and Reject write an audit entry and Undo reopens', async () => {
    renderWithApp(<MappingScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Accept REC-20004' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reject REC-20008' }))
    const audit = useLedger.getState().audit
    expect(audit.map((a) => a.action)).toEqual(['Rejected test mapping, test plan needed', 'Accepted test mapping'])
    expect(audit.every((a) => a.by === 'Aaron Keller')).toBe(true)
    expect(screen.getByTestId('reviewed-count')).toHaveTextContent('Reviewed 2 of 8')
    expect(within(rowOf('REC-20008')).getByText('Test plan needed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo REC-20008' }))
    expect(screen.getByTestId('reviewed-count')).toHaveTextContent('Reviewed 1 of 8')
  })
  it('shows the auto-accepted line and bulk accept says what it holds back', async () => {
    renderWithApp(<MappingScreen />)
    expect(await screen.findByTestId('auto-accepted')).toHaveTextContent('8 mapped at ≥ 90% and accepted automatically')
    expect(screen.getByTestId('bulk-preview')).toHaveTextContent(/individual review/)
    expect(screen.getByRole('button', { name: /Accept all at or above 80 percent/ })).toBeDisabled()
  })
  it('the AI-inferred confidence and the selected candidate percent are the same figure, and picking another candidate swaps the proposed test', async () => {
    renderWithApp(<MappingScreen />, 'company-a', '/?req=REC-20007')
    const why = await screen.findByText(/AI-inferred/)
    expect(why).toHaveTextContent('82%')
    fireEvent.click(screen.getByRole('radio', { name: /Use Burst containment|Use Turbine burst/ }))
    await waitFor(() => expect(screen.getByText(/AI-inferred/)).toHaveTextContent('57%'))
  })
})

describe('06 carryover review', () => {
  it('confirming a Review required item sets Confirmed and shows an audit entry with actor and time', async () => {
    renderWithApp(<CarryoverScreen />, 'company-a', '/?req=REC-20007')
    expect(await screen.findByText('Review required')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText('Confirmed')).toBeInTheDocument()
    const entry = (await screen.findAllByTestId('audit-entry'))[0]!
    expect(entry).toHaveTextContent('Aaron Keller')
    expect(entry).toHaveTextContent(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
  })
  it('Link Selected Evidence is disabled until a candidate is picked, and linking is single-requirement', async () => {
    renderWithApp(<CarryoverScreen />, 'company-a', '/?req=REC-20008')
    const link = await screen.findByRole('button', { name: 'Link Selected Evidence' })
    expect(link).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: /Select Exhaust manifold thermal fatigue/ }))
    expect(link).toBeEnabled()
    fireEvent.click(link)
    expect(useLedger.getState().decisions['req-carry:REC-20008']).toBeDefined()
    expect(Object.keys(useLedger.getState().decisions).filter((k) => k.startsWith('req-carry:'))).toEqual(['req-carry:REC-20008'])
    expect(screen.getByTestId('need-decision')).toHaveTextContent('5')
  })
  it('shows the empty-state copy when no record reaches the floor, and uploads are tagged asserted, not computed', async () => {
    renderWithApp(<CarryoverScreen />, 'company-a', '/?req=REC-20013')
    expect(await screen.findByTestId('no-candidates')).toHaveTextContent('Datum found no evidence record above 50%. Search for one you know about, or upload the report.')
    const input = screen.getByTestId('upload-input')
    fireEvent.change(input, { target: { files: [new File(['x'], 'egt-report.pdf')] } })
    expect((await screen.findAllByText(/egt-report.pdf/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Asserted, not computed').length).toBeGreaterThan(0)
  })
})

describe('07 approve', () => {
  it('stays disabled until the acknowledgement, then creates the plan with the hard-coded ID, an audit entry, and inert Export and Open in PLM', async () => {
    renderWithApp(<ApproveScreen />)
    const approve = screen.getByRole('button', { name: /Approve and Create/ })
    expect(approve).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(approve).toBeEnabled()
    fireEvent.click(approve)
    expect(await screen.findByTestId('plan-id')).toHaveTextContent('TP-CIV26-0007')
    expect(screen.getByRole('heading', { name: 'Test plan created' })).toBeInTheDocument()
    const entry = await screen.findAllByTestId('audit-entry')
    expect(entry[0]).toHaveTextContent('Aaron Keller')
    expect(screen.getByRole('button', { name: 'Export TDM' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Open in PLM' })).toBeDisabled()
  })
  it('counts update live from decisions and the still-open list shrinks with its count', () => {
    useLedger.getState().setDecision('req-map:REC-20004', 'accepted', '2026-10-08T10:00:00.000Z', 'Aaron Keller')
    renderWithApp(<ApproveScreen />)
    expect(screen.getByTestId('tile-carried')).toHaveTextContent('8')
    expect(screen.getByTestId('tile-routed')).toHaveTextContent('1')
    expect(screen.getByTestId('tile-open')).toHaveTextContent('7')
    expect(screen.getAllByTestId('open-row')).toHaveLength(7)
    expect(screen.getAllByTestId('open-owner').every((o) => o.textContent)).toBe(true)
  })
})

describe('06b impact map', () => {
  it('hop depth and direction change the graph; the legend names both edge styles; node types carry text', () => {
    renderWithApp(<ImpactScreen />, 'company-a', '/?req=REC-20002&hops=2')
    const count = () => document.querySelectorAll('[data-node]').length
    const two = count()
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    expect(count()).toBeLessThan(two)
    expect(screen.getByTestId('impact-legend')).toHaveTextContent('Depends on, blocks if it fails')
    expect(screen.getByTestId('impact-legend')).toHaveTextContent('Donates evidence')
    document.querySelectorAll('[data-node]').forEach((n) => expect(n.getAttribute('data-type')).toMatch(/^(REQ|DOC|PRT|TST|PLN)$/))
  })
  it('Flag N for Re-review writes one audit entry per node and makes no notification claim', () => {
    renderWithApp(<ImpactScreen />, 'company-a', '/?req=REC-20002&hops=2')
    fireEvent.click(screen.getByRole('button', { name: /Flag 1 for Re-review/ }))
    expect(useLedger.getState().audit.filter((a) => a.action === 'Flagged for re-review')).toHaveLength(1)
    expect(screen.getByText(/No owner is notified/)).toBeInTheDocument()
    expect(screen.queryByText(/owners notified/i)).toBeNull()
  })
})
