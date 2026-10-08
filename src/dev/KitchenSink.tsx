import { useMemo, useState } from 'react'
import { ApprovalButton, AuditList } from '../components/audit/Audit'
import { FieldGroups, FieldRenderer } from '../components/fields/FieldRenderer'
import { MatchQuality } from '../components/quality/MatchQuality'
import { SidePanel, BottomDrawer } from '../components/panels/Panels'
import { useBreadcrumbs } from '../components/shell/useBreadcrumbs'
import { Stub } from '../components/stub/Stub'
import { TableShell } from '../components/table/TableShell'
import type { ColumnDef } from '../components/table/types'
import { Badge, Button, Checkbox, EmptyState, InlineError, Seg, SkeletonRows, Tabs } from '../components/ui'
import { ViewerPlaceholder } from '../components/viewer/Viewer'
import { buildAppConfig } from '../config/appConfig'
import { ConfigProvider, useConfig, useVocab } from '../config/useConfig'
import type { ApprovalState, MatchQuality as MQ, Tone } from '../domain/types'

interface Sample { id: string; name: string; program: string; year: string; status: string; weight: number; released: string; sim: number; type: string }
const SAMPLE: Sample[] = [
  { id: 's1', name: '7100490_0000_AB_ASM_RSB40_DEF.CATPart', program: 'Atlas EV', year: 'MY24', status: 'Released', weight: 4.2, released: '2026-03-12', sim: 92, type: 'Actual' },
  { id: 's2', name: 'K04-117-RS_BRKT_MOUNT.SLDPRT', program: 'Atlas EV', year: 'MY24', status: 'id1055', weight: 0.9, released: '2026-03-30', sim: 78, type: 'Surrogate' },
  { id: 's3', name: '7100631_0000_AA_ENG_MOUNT_FR.CATPart', program: 'Vega PHEV', year: 'MY25', status: 'In Review', weight: 2.1, released: '2026-09-02', sim: 64, type: 'Estimated' },
  { id: 's4', name: '7200205_0000_AA_VEGA_KNUCKLE.SLDPRT', program: 'Vega PHEV', year: 'MY23', status: 'WIP', weight: 2.8, released: '', sim: 0, type: 'No match' },
  { id: 's5', name: '7300108_0000_AC_ORION_BRKT_OBS.SLDPRT', program: 'Orion LCV', year: 'MY24', status: 'status-from-plm-9', weight: 1.3, released: '2025-08-11', sim: 0, type: 'Search failed' },
  { id: 's6', name: '7300042_0000_AB_ORION_AXLE_HSG.CATPart', program: 'Orion LCV', year: 'MY25', status: 'Released', weight: 17.6, released: '2026-04-22', sim: 88, type: 'Actual' },
]
const PLM = { program: 'Atlas EV', modelYear: 'MY24', programType: 'BEV', customerGroup: 'OEM-A', region: 'NA', productGroup: 'Chassis', productLine: 'Suspension', calcWeight: 4.2, releaseStatus: 'id1055', lifecycleState: 'Released', releasedDate: '2026-03-12', supplierLeadTime: 6 }

const QUALITY: Array<[string, MQ]> = [
  ['All three dimensions', { confidence: { score: 87, why: ['Same supplier and process', 'Geometry above 85'] }, similarity: { percent: 92 }, dataType: { raw: 'Surrogate' }, provenance: { origin: 'computed', tags: ['Carryover', 'PLM'] } }],
  ['Confidence as a word', { confidence: { label: 'Moderate', why: ['Unconfirmed PLM link'] }, similarity: { percent: 74 }, dataType: { raw: 'Estimated' } }],
  ['Similarity only', { similarity: { percent: 61 } }],
  ['Data type only', { dataType: { raw: 'Actual' } }],
  ['Geometric duplicate', { similarity: { percent: 100 }, dataType: { raw: 'Actual' }, duplicate: 'geometric-duplicate' }],
  ['Duplicate file', { similarity: { percent: 100 }, duplicate: 'duplicate-file' }],
  ['Manual (dashed)', { similarity: { percent: 70 }, dataType: { raw: 'Surrogate' }, provenance: { origin: 'manual' } }],
  ['User-supplied (asserted)', { dataType: { raw: 'Actual' }, provenance: { origin: 'user-supplied' } }],
  ['No match', { dataType: { raw: 'No match' }, similarity: { percent: 12 } }],
  ['Search failed', { dataType: { raw: 'Search failed' } }],
  ['None of the three', {}],
]

function SchemaCard({ tenantId, title }: { tenantId: string; title: string }) {
  const config = useMemo(() => buildAppConfig(tenantId), [tenantId])
  return (
    <ConfigProvider config={config}>
      <section className="card-sink" aria-label={title} data-testid={`schema-${tenantId}`}>
        <div className="row"><b>{title}</b><Badge tone="outline">{config.schema.fields.length} fields</Badge></div>
        <FieldGroups record={PLM} />
      </section>
    </ConfigProvider>
  )
}

export function KitchenSink() {
  useBreadcrumbs([{ label: 'Dev' }, { label: 'Kitchen sink' }])
  const config = useConfig()
  const vocab = useVocab()
  const [tab, setTab] = useState<'a' | 'b'>('a')
  const [drawer, setDrawer] = useState(true)
  const [sel, setSel] = useState<string | null>('s2')
  const [checked, setChecked] = useState(true)
  const [approval, setApproval] = useState<ApprovalState>({ status: config.matchRules.approval.pendingRaw, audit: [] })
  const [link, setLink] = useState(false)

  const columns: Array<ColumnDef<Sample>> = useMemo(() => [
    { key: 'name', label: 'File name', pinned: true, filter: 'text-search', group: 'File', get: (r) => r.name, render: (r) => <span className="data">{r.name}</span> },
    { key: 'program', label: 'Program', filter: 'multi-search', group: 'Program', get: (r) => r.program },
    { key: 'year', label: 'Model year', filter: 'multi-tag', group: 'Program', get: (r) => r.year },
    { key: 'status', label: 'Release status', filter: 'multi-tag', group: 'Lifecycle', get: (r) => r.status, label_of: (raw) => vocab.resolve('releaseStatus', raw).label, render: (r) => { const v = vocab.resolve('releaseStatus', r.status); return <Badge tone={v.tone}>{v.label}</Badge> } },
    { key: 'weight', label: 'Calc weight', filter: 'range-units', unit: 'kg', align: 'right', group: 'Product', get: (r) => r.weight, render: (r) => <span className="data">{r.weight} kg</span> },
    { key: 'released', label: 'Released', filter: 'date-preset', group: 'Lifecycle', get: (r) => r.released, render: (r) => <span className="data">{r.released || '—'}</span> },
    { key: 'sim', label: 'Match quality', filter: 'level-seg', order: ['Actual', 'Surrogate', 'Estimated', 'No match', 'Search failed'], group: 'Match quality', get: (r) => r.type, render: (r) => <MatchQuality quality={{ dataType: { raw: r.type }, similarity: { percent: r.sim } }} /> },
  ], [vocab])

  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: 'var(--layout-1)', display: 'flex', flexDirection: 'column', gap: 'var(--layout-1)' }} data-testid="kitchen-sink">
      <style>{`.card-sink{border:1px solid var(--border-default);border-radius:var(--radius);background:var(--bg-card);padding:var(--gap-4);display:flex;flex-direction:column;gap:var(--gap-3)}`}</style>
      <div><h1 className="text-page">Kitchen sink</h1><p className="secondary">Every shared component, on fixture data. Use the Dev toolbar to cycle themes, densities and schemas.</p></div>

      <section className="card-sink" aria-label="Match quality" data-testid="ks-match-quality">
        <h2 className="text-section">MatchQuality: confidence, similarity, data type</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--gap-3)' }}>
          {QUALITY.map(([label, q]) => <div key={label} className="col" style={{ gap: 4 }}><span className="text-label-caps">{label}</span><MatchQuality quality={q} variant="full" onRetry={() => setLink(true)} /></div>)}
        </div>
        {link && <InlineError onRetry={() => setLink(false)}>Search failed for this row. Retrying is simulated.</InlineError>}
      </section>

      <section className="card-sink" aria-label="Schema-driven fields">
        <h2 className="text-section">FieldRenderer: one record, two schemas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gap-4)' }}>
          <SchemaCard tenantId="company-a" title="Company A" /><SchemaCard tenantId="company-b" title="Company B" />
        </div>
        <span className="muted">Active tenant from the Dev toolbar: {config.schema.label}. Raw "id1055" resolves through the vocabulary; "status-from-plm-9" is unknown and renders as received with a neutral tone.</span>
        <FieldRenderer record={{ ...PLM, releaseStatus: 'status-from-plm-9' }} keys={['releaseStatus', 'calcWeight']} />
      </section>

      <section className="card-sink" aria-label="Table shell" data-testid="ks-table">
        <h2 className="text-section">TableShell: Filters / Columns / Manage, pinned row, expansion, density</h2>
        <div style={{ display: 'flex', height: 520, border: '1px solid var(--border-default)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <TableShell id="kitchen" noun="files" columns={columns} rows={SAMPLE} rowId={(r) => r.id} selectedId={sel} onSelect={setSel}
            pinnedRows={[{ id: 'src', name: 'Source Part · 7100490_0000.CATPart', program: 'Atlas EV', year: 'MY24', status: 'Released', weight: 4.2, released: '2026-03-12', sim: 0, type: 'Actual' }]}
            renderExpanded={(r) => <div style={{ padding: 'var(--gap-3) var(--gap-4)' }}><FieldRenderer record={{ ...PLM, program: r.program }} keys={['program', 'modelYear', 'calcWeight']} layout="grid" /></div>}
            rowTone={(r) => (r.type === 'No match' ? 'warn' : undefined)}
            rowActions={() => <Button size="sm" disabled title="Not connected in prototype">Open in PLM</Button>} />
        </div>
      </section>

      <section className="card-sink" aria-label="Panels">
        <h2 className="text-section">SidePanel and BottomDrawer</h2>
        <div style={{ display: 'flex', height: 300, border: '1px solid var(--border-default)', borderRadius: 'var(--radius)', overflow: 'hidden', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div className="grow" style={{ padding: 'var(--gap-4)' }}><Tabs value={tab} onChange={setTab} tabs={[{ key: 'a', label: 'Summary' }, { key: 'b', label: 'PLM', count: 3 }]} /><p className="secondary" style={{ marginTop: 8 }}>Centre stage. The side panel on the right is the canonical detail view.</p></div>
            <SidePanel title="7100490_0000_AB" subtitle="BOML-0152" badge={<Badge tone="info">Surrogate</Badge>} onClose={() => undefined}
              tabs={[{ key: 'a', label: 'Summary' }, { key: 'b', label: 'PLM' }]} tab={tab} onTab={setTab}>
              {tab === 'a' ? <MatchQuality quality={QUALITY[0]![1]} variant="full" /> : <FieldRenderer record={PLM} />}
            </SidePanel>
          </div>
          <BottomDrawer title="Full carryover chain" meta="REC-20001 · 4 events" open={drawer} onToggle={setDrawer} height={120}><div style={{ padding: 'var(--gap-3)' }} className="secondary">Scrubbable, chronological content only.</div></BottomDrawer>
        </div>
      </section>

      <section className="card-sink" aria-label="Audit and approval" data-testid="ks-audit">
        <h2 className="text-section">Approval lifecycle and audit entry</h2>
        <ApprovalButton approval={approval} subject={{ type: 'result', id: 'kitchen-1' }} label="surrogate for TC-404-C" onConfirmed={setApproval} />
        <AuditList subject={{ type: 'result', id: 'kitchen-1' }} emptyText="Confirm above to write an audit entry (time and actor)." />
      </section>

      <section className="card-sink" aria-label="Viewer and states">
        <h2 className="text-section">Viewer placeholder, skeleton, empty and error states, stub marker</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--gap-4)' }}>
          <ViewerPlaceholder chip="Query · 7100490_0000_AB.CATPart" legend={[{ label: 'Query only', tone: 'query', value: '6.8%' }, { label: 'Overlap', tone: 'overlap', value: '91.1%' }, { label: 'Result only', tone: 'result', value: '2.1%' }]} linkedCameras onLinkedChange={() => undefined} height={260} />
          <div className="col">
            <SkeletonRows rows={3} label="Loading demo" /><EmptyState title="No files match the current filters and search." /><InlineError onRetry={() => undefined}>Could not load fixtures (demo error).</InlineError>
            <Stub id="matching-engine" note="Pre-baked scores"><Badge tone="info">Simulated score 87%</Badge></Stub>
            <Seg value={checked ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setChecked(v === 'on')} label="Demo toggle" /><Checkbox checked={checked} onChange={setChecked} label="Checkbox" />
            <div className="row wrap">{(['pass', 'info', 'warn', 'fail', 'neutral'] as Tone[]).map((t) => <Badge key={t} tone={t}>{t}</Badge>)}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
