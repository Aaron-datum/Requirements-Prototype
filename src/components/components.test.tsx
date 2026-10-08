import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { FieldRenderer } from './fields/FieldRenderer'
import { MatchQuality } from './quality/MatchQuality'
import { TableShell } from './table/TableShell'
import type { ColumnDef } from './table/types'
import { renderWithApp } from '../test/utils'

const PLM = { program: 'Atlas EV', modelYear: 'MY24', releaseStatus: 'id1055', calcWeight: 4.2, customerGroup: 'OEM-A', supplierLeadTime: 6 }

describe('MatchQuality', () => {
  it('renders all three dimensions independently, with the percent as text', () => {
    renderWithApp(<MatchQuality quality={{ confidence: { score: 87, why: ['x'] }, similarity: { percent: 92 }, dataType: { raw: 'Surrogate' } }} />)
    expect(screen.getByText('92%')).toBeInTheDocument(); expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Surrogate')).toBeInTheDocument(); expect(screen.getByText('87%')).toBeInTheDocument()
  })
  it('never says Exact: 100% is a geometric duplicate or a duplicate file', () => {
    const { container } = renderWithApp(<><MatchQuality quality={{ similarity: { percent: 100 }, duplicate: 'geometric-duplicate' }} /><MatchQuality quality={{ similarity: { percent: 100 }, duplicate: 'duplicate-file' }} /></>)
    expect(screen.getByText('Geometric duplicate')).toBeInTheDocument(); expect(screen.getByText('Duplicate file')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/exact/i)
  })
  it('hides the bar for types with no meaningful similarity, and offers retry', () => {
    renderWithApp(<MatchQuality quality={{ dataType: { raw: 'Search failed' }, similarity: { percent: 40 } }} onRetry={() => undefined} />)
    expect(screen.queryByRole('meter')).toBeNull(); expect(screen.getByText('Retry')).toBeInTheDocument()
  })
  it('renders a dash for none of the three, and marks user-supplied as asserted', () => {
    renderWithApp(<MatchQuality quality={{}} />)
    expect(screen.getByTestId('match-none')).toBeInTheDocument()
  })
  it('marks user-supplied evidence as asserted', () => {
    renderWithApp(<MatchQuality quality={{ provenance: { origin: 'user-supplied' } }} />)
    expect(screen.getByText('Asserted')).toBeInTheDocument()
  })
})

describe('FieldRenderer renders the same record under two schemas with no code change', () => {
  it('company A', () => {
    renderWithApp(<FieldRenderer record={PLM} />, 'company-a')
    expect(screen.getByText('Program')).toBeInTheDocument(); expect(screen.getByText('Customer Group')).toBeInTheDocument(); expect(screen.getByText('Released')).toBeInTheDocument()
    expect(screen.queryByText('Supplier lead time')).toBeNull()
  })
  it('company B: renamed fields, dropped field gone, added field present, same opaque id resolves differently', () => {
    renderWithApp(<FieldRenderer record={PLM} />, 'company-b')
    expect(screen.getByText('Vehicle line')).toBeInTheDocument(); expect(screen.queryByText('Customer Group')).toBeNull()
    expect(screen.getByText('Supplier lead time')).toBeInTheDocument(); expect(screen.getByText('Approved for use')).toBeInTheDocument()
  })
  it('an unknown status renders as received with the neutral tone', () => {
    renderWithApp(<FieldRenderer record={{ releaseStatus: 'zz-unknown' }} keys={['releaseStatus']} />)
    expect(screen.getByText('zz-unknown')).toBeInTheDocument()
  })
})

interface Row { id: string; name: string; prog: string; w: number }
const ROWS: Row[] = [{ id: 'a', name: 'Alpha', prog: 'X', w: 1 }, { id: 'b', name: 'Beta', prog: 'Y', w: 2 }, { id: 'c', name: 'Gamma', prog: 'Y', w: 3 }]
const COLS: Array<ColumnDef<Row>> = [
  { key: 'name', label: 'Name', pinned: true, filter: 'text-search', get: (r) => r.name },
  { key: 'prog', label: 'Program', filter: 'multi-tag', get: (r) => r.prog },
  { key: 'w', label: 'Weight', filter: 'range-units', get: (r) => r.w, align: 'right' },
]
function Harness() {
  const [sel, setSel] = useState<string | null>(null)
  return <div style={{ display: 'flex' }}><TableShell id="t" columns={COLS} rows={ROWS} rowId={(r) => r.id} selectedId={sel} onSelect={setSel} noun="things" pinnedRows={[{ id: 'src', name: 'Source', prog: 'X', w: 0 }]} /></div>
}
const openSection = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }))
const pickY = () => { if (!screen.queryByRole('checkbox', { name: /^Y/ })) openSection('Program'); return screen.getByRole('checkbox', { name: /^Y/ }) }
describe('TableShell', () => {
  it('pins the source row above the list and keeps it when filtering', () => {
    renderWithApp(<Harness />)
    const first = screen.getAllByRole('row')[1]!
    expect(first).toHaveAttribute('data-pinned', 'true')
    fireEvent.click(pickY())
    expect(screen.getByTestId('result-count')).toHaveTextContent('2 of 3 things')
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-pinned', 'true')
  })
  it('shows a filter pill and clears it', () => {
    renderWithApp(<Harness />)
    fireEvent.click(pickY())
    const pill = screen.getByRole('button', { name: /Remove filter Program: Y/ })
    fireEvent.click(pill)
    expect(screen.getByTestId('result-count')).toHaveTextContent('3 of 3 things')
  })
  it('hiding a column never touches filters; removing it drops the filter unless applied', () => {
    renderWithApp(<Harness />)
    fireEvent.click(pickY())
    fireEvent.click(screen.getByRole('tab', { name: 'Columns' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /^Program/ })) // hide column
    expect(screen.getByRole('button', { name: /Remove filter Program: Y/ })).toBeInTheDocument() // filter survives
    fireEvent.click(screen.getByRole('button', { name: 'Add / Remove Columns' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /^Program/ })) // remove from field set
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
    expect(screen.getByRole('button', { name: /Remove filter Program: Y/ })).toBeInTheDocument() // applied filter stays
  })
  it('renders an empty state with Clear all filters when nothing matches', () => {
    renderWithApp(<Harness />)
    fireEvent.change(screen.getByPlaceholderText('Search name…'), { target: { value: 'zzz' } })
    expect(screen.getByText('No rows match these filters.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument()
  })
})
