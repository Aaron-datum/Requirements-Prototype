import { Box, ExternalLink, RefreshCw } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MatchQuality } from '../../../components/quality/MatchQuality'
import { Stub } from '../../../components/stub/Stub'
import { TableShell } from '../../../components/table/TableShell'
import type { ColumnDef } from '../../../components/table/types'
import { Badge, Button, Skeleton } from '../../../components/ui'
import { useVocab } from '../../../config/useConfig'
import { programById, ACTIVE_PROGRAM } from '../../../fixtures/civic'
import { bomRollup, costRiskBand, qualityOf, templateColumns, templateColumnValue, trackCounts, type BomViewRow } from '../../../fixtures/derive-bom'
import { TIER_ORDER, priceSourceLabel } from '../../../fixtures/extras/bom/rules'
import { hashInt } from '../../../fixtures/rng'
import { useProjectStore } from '../../../stores/projectStore'
import { now } from '../../../lib/clock'
import { LinePanel } from './LinePanel'
import { BOM_TABLE_ID, BOM_VIEWS, isReviewTab, money, useBomVocab, type ReviewTab } from './bomConfig'
import { useBomStore } from './bomStore'
import { searchOnLink } from './searchLinks'
import { useBomRows, useKpiConfig, useLineMode, useRetryLine, useRunSearch } from './useBomData'
import s from './bom.module.css'

const toneClass = { pass: s.pass, info: s.info, warn: s.warn, fail: s.fail, neutral: s.neutral }

/** Seed the three saved views (docs/01 example names) into the shared view store, once per session. */
function useSeedViews(columnKeys: string[]) {
  useEffect(() => {
    const st = useProjectStore.getState()
    BOM_VIEWS.forEach((v) => {
      if (st.views.some((x) => x.meta?.table === BOM_TABLE_ID && x.title === v.name)) return
      st.add('view', { id: `bomview-${v.name}`, kind: 'view', title: v.name, projectId: 'p-civic-si', at: now(), meta: { table: BOM_TABLE_ID, filters: JSON.stringify(v.filters), visible: v.visible.filter((k) => columnKeys.includes(k)).join(','), fields: columnKeys.join(',') } })
    })
  }, [columnKeys])
}

/** 03 BOM review: pre-search banner, KPI strip, grouped table, line panel. Si is the active BOM through the derive layer. */
export function BomReview() {
  const [params, setParams] = useSearchParams()
  const vocab = useVocab()
  const bvocab = useBomVocab()
  const rows = useBomRows()
  const modeOf = useLineMode()
  const kpiCfg = useKpiConfig()
  const search = useBomStore((st) => st.search)
  const progress = useBomStore((st) => st.progress)
  const retrying = useBomStore((st) => st.retrying)
  const sources = useBomStore((st) => st.sources)
  const routes = useBomStore((st) => st.routes)
  const confirmedCols = useBomStore((st) => st.confirmedTemplateColumns)
  const run = useRunSearch()
  const retry = useRetryLine()
  const connected = useMemo(() => Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, v !== false])), [sources])

  const selectedId = params.get('line')
  const tab: ReviewTab = isReviewTab(params.get('tab')) ? (params.get('tab') as ReviewTab) : 'summary'
  // A deep link to a line (or tab) implies the search has been run: results are shown, not a blank BOM.
  useEffect(() => { if ((selectedId || params.get('tab')) && useBomStore.getState().search === 'idle') useBomStore.getState().finishSearch() }, [selectedId, params])
  useEffect(() => { useBomStore.getState().setLastStep('03-review') }, [])
  // ?autorun=1 (from the chat) starts the surrogate search once the rows are ready.
  useEffect(() => {
    if (params.get('autorun') !== '1' || rows.length === 0 || useBomStore.getState().search !== 'idle') return
    const next = new URLSearchParams(params); next.delete('autorun'); setParams(next, { replace: true })
    void run(rows)
  }, [params, rows.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const setSel = (id: string | null, t: ReviewTab = tab) => {
    const next = new URLSearchParams(params)
    if (id) { next.set('line', id); next.set('tab', t); useBomStore.getState().setLastLine(id) } else { next.delete('line'); next.delete('tab') }
    setParams(next, { replace: true })
  }
  const selected = rows.find((r) => r.id === selectedId) ?? null
  const done = search === 'done'
  const index = useMemo(() => new Map(rows.map((r, i) => [r.id, i])), [rows])
  const tpl = trackCounts(routes).template.routed ? templateColumns() : null

  const cell = (r: BomViewRow, node: () => React.ReactNode) => {
    if (r.state === 'pending') return search === 'running' && (index.get(r.id) ?? 0) >= progress ? <Skeleton width={64} /> : search === 'running' ? <span className="muted">…</span> : <span className="muted">—</span>
    return node()
  }

  const columns = useMemo<Array<ColumnDef<BomViewRow>>>(() => {
    const dt = (raw: string) => vocab.resolve('dataType', raw).label
    const base: Array<ColumnDef<BomViewRow>> = [
      { key: 'name', label: 'Part name', group: 'Identity', pinned: true, filter: 'text-search', get: (r) => r.name,
        render: (r) => <span className={s.partCell}>{r.hasCad ? <Box size={14} aria-label="Has CAD" role="img" /> : <Box size={14} strokeDasharray="3 2" aria-label="No CAD" role="img" />}<span className="trunc">{r.name}</span>{r.origin !== 'dataset' && <Badge tone="outline">{r.origin === 'manual' ? 'Manual' : 'Reference'}</Badge>}</span> },
      { key: 'partNumber', label: 'Part number', group: 'Identity', pinned: true, filter: 'text-search', get: (r) => r.partNumber, render: (r) => <span className="data">{r.partNumber}</span> },
      { key: 'quantity', label: 'Quantity', group: 'Identity', pinned: true, filter: 'range-units', align: 'right', get: (r) => r.quantity, render: (r) => <span className="data">{r.quantity}</span> },
      { key: 'price', label: 'Price', group: 'Cost', filter: 'range-units', unit: 'USD', align: 'right', get: (r) => r.unitPrice, render: (r) => cell(r, () => (r.unitPrice == null ? <span className="muted">—</span> : <span className="data">{money(r.unitPrice)}</span>)) },
      { key: 'priceSource', label: 'Source', group: 'Cost', filter: 'multi-tag', get: (r) => (r.priceSource ? priceSourceLabel(r.priceSource, connected.sap !== false) : ''), render: (r) => cell(r, () => <span>{r.priceSource ? priceSourceLabel(r.priceSource, connected.sap !== false) : '—'}</span>) },
      { key: 'currency', label: 'Currency', group: 'Cost', filter: 'multi-tag', get: (r) => r.currency, render: (r) => cell(r, () => <span className="data">{r.currency}</span>) },
      { key: 'certainty', label: 'Certainty', group: 'Cost', filter: 'level-seg', order: [...TIER_ORDER], label_of: dt, get: (r) => r.certainty,
        render: (r) => cell(r, () => (
          <Stub id="matching-engine" note="Pre-baked certainty and scores">
            {retrying && r.state === 'failed' ? <Skeleton width={96} /> : <MatchQuality quality={qualityOf(r, modeOf(r))} onRetry={r.state === 'failed' ? () => void retry(r) : undefined} />}
          </Stub>)) },
      { key: 'supplier', label: 'Supplier', group: 'Sourcing', filter: 'multi-search', get: (r) => r.supplier, render: (r) => cell(r, () => <span className="trunc">{r.supplier || '—'}</span>) },
      { key: 'region', label: 'Region', group: 'Sourcing', filter: 'multi-search', get: (r) => r.region, render: (r) => cell(r, () => <span className="data">{r.region || '—'}</span>) },
      { key: 'method', label: 'Method', group: 'Sourcing', filter: 'multi-search', get: (r) => r.method, render: (r) => <span className="trunc">{r.method}</span> },
      { key: 'material', label: 'Material', group: 'Manufacture', filter: 'multi-search', get: (r) => r.material, render: (r) => <span className="trunc">{r.material}</span> },
      { key: 'tooling', label: 'Tooling', group: 'Manufacture', filter: 'multi-tag', get: (r) => r.tooling },
      { key: 'cx', label: 'Cx', group: 'Manufacture', filter: 'multi-tag', order: ['Low', 'Med', 'High'], get: (r) => r.cx },
      { key: 'leadTime', label: 'Lead time', group: 'Additional', filter: 'range-units', unit: 'wk', align: 'right', defaultVisible: false, get: (r) => r.leadWeeks, render: (r) => <span className="data">{r.leadWeeks} wk</span> },
      { key: 'modelYear', label: 'Model year', group: 'Additional', filter: 'multi-tag', defaultVisible: false, get: () => `MY${programById[ACTIVE_PROGRAM]!.model_year}` },
      { key: 'toolingFaces', label: 'Tooling faces', group: 'Additional', filter: 'range-units', align: 'right', defaultVisible: false, get: (r) => hashInt(`faces:${r.partNumber}`, 2, 18) },
      { key: 'weight', label: 'Weight', group: 'Additional', filter: 'range-units', unit: 'kg', align: 'right', defaultVisible: false, get: (r) => r.weightKg, render: (r) => <span className="data">{r.weightKg} kg</span> },
      { key: 'volume', label: 'Volume', group: 'Additional', filter: 'range-units', unit: 'cm³', align: 'right', defaultVisible: false, get: (r) => Math.round(r.weightKg * 130 + hashInt(`vol:${r.partNumber}`, 0, 90)) },
      { key: 'programMy', label: 'Program MY', group: 'Additional', filter: 'multi-tag', defaultVisible: false, get: () => `Si MY${programById[ACTIVE_PROGRAM]!.model_year}` },
      { key: 'extPrice', label: 'Extended price', group: 'Additional', filter: 'range-units', unit: 'USD', align: 'right', defaultVisible: false, get: (r) => (r.unitPrice == null ? null : r.extPrice), render: (r) => cell(r, () => <span className="data">{money(r.unitPrice == null ? null : r.extPrice)}</span>) },
      { key: 'subassembly', label: 'Subassembly', group: 'Additional', filter: 'multi-tag', defaultVisible: false, get: (r) => r.subassembly },
      { key: 'cad', label: 'CAD', group: 'Additional', filter: 'multi-tag', defaultVisible: false, label_of: (raw) => bvocab.resolve('cadFlag', raw).label, get: (r) => (r.hasCad ? 'has-cad' : 'no-cad') },
      { key: 'resolution', label: 'Resolution', group: 'Additional', filter: 'multi-tag', defaultVisible: false, label_of: (raw) => bvocab.resolve('resolution', raw).label,
        get: (r) => { const m = modeOf(r); return m === 'pending' ? '' : m === 'carry' || (m === 'propose' && r.confirmed) ? 'resolved' : 'unresolved' },
        render: (r) => { const m = modeOf(r); if (m === 'pending') return <span className="muted">—</span>; const v = bvocab.resolve('resolution', m === 'carry' || (m === 'propose' && r.confirmed) ? 'resolved' : 'unresolved'); return <Badge tone={v.tone}>{v.label}</Badge> } },
      { key: 'requirements', label: 'Requirements', group: 'Additional', filter: 'range-units', align: 'right', defaultVisible: false, get: (r) => r.requirementIds.length, render: (r) => <span className="data">{r.requirementIds.length}</span> },
    ]
    const extra = tpl ? [...tpl.custom.map((c) => c.header), ...tpl.toConfirm.map((c) => c.header).filter((h) => confirmedCols.includes(h))] : []
    return [...base, ...extra.map((h): ColumnDef<BomViewRow> => ({ key: `tpl:${h}`, label: h, group: 'Additional', filter: 'multi-tag', defaultVisible: false, get: (r) => templateColumnValue(h, r.id) }))]
  }, [vocab, bvocab, modeOf, connected.sap, retrying, retry, tpl, confirmedCols, search, progress, index]) // eslint-disable-line react-hooks/exhaustive-deps
  useSeedViews(useMemo(() => columns.filter((c) => !c.pinned || true).map((c) => c.key), [columns]))

  const kpi = done ? bomRollup(rows, kpiCfg) : null
  const band = done ? costRiskBand(rows, modeOf, connected) : null
  const proposed = rows.filter((r) => modeOf(r) === 'propose')
  const unresolved = rows.filter((r) => ['estimate', 'unresolved'].includes(modeOf(r))).length
  const tierTone = (raw: string) => toneClass[vocab.resolve('dataType', raw).tone]

  return (
    <div className={s.review} data-testid="bom-review" data-search={search}>
      <div className={s.reviewHead}>
        <div className={s.pageHead}>
          <div className="col" style={{ gap: 4 }}>
            <div className="row wrap"><h1 className="text-page">Civic Si 1.5T Engine</h1><Badge tone="info">Quoting · {programById[ACTIVE_PROGRAM]!.rfq_id}</Badge></div>
            <span className="secondary">BOM · <span data-testid="line-count">{rows.length} lines</span> · 3 programs · owner {programById[ACTIVE_PROGRAM]!.owner}</span>
          </div>
          <div className={s.actions}>
            <Button onClick={() => void run(rows)} disabled={search === 'running' || rows.length === 0}><RefreshCw size={14} aria-hidden />{done ? 'Re-run Search' : 'Run Surrogate Search'}</Button>
            <Link to="/create/bom/04-composition"><Button primary>Open Program Composition</Button></Link>
          </div>
        </div>
      </div>
      {search === 'idle' && rows.length > 0 && (
        <div className={s.banner} role="status" data-testid="presearch-banner">
          <span className="grow">New BOM created with {rows.length} blank lines. Run surrogate search to match each line against parts already in production.</span>
          <Button primary onClick={() => void run(rows)}>Run Surrogate Search</Button>
        </div>
      )}
      {search === 'running' && (
        <div className={s.banner} role="status" data-testid="search-progress">
          <span className="data">Searching {Math.min(progress, rows.length)} of {rows.length} lines against Civic LX and Sport</span>
          <div className={s.progress} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={rows.length}><i style={{ width: `${(progress / Math.max(1, rows.length)) * 100}%` }} /></div>
        </div>
      )}
      <Stub id="matching-engine" note="KPIs derive from simulated matches">
        <div className={s.kpis} data-testid="kpis">
          <div className={s.kpi} title={kpi?.formulas.cost}><span className="text-label-caps">First-order cost</span><span className={s.kpiVal} data-testid="kpi-cost">{kpi ? money(kpi.firstOrderCost) : '—'}</span><span className="data muted">{kpi ? `${kpi.pricedLines} of ${kpi.totalLines} lines priced` : 'after the search'}</span></div>
          <div className={s.kpi} title={kpi && band ? `${band.formula} ${kpi.formulas.risk}` : undefined}><span className="text-label-caps">Cost risk</span><span className={s.kpiVal} data-testid="kpi-risk">{band ? `±${band.pct}%` : '—'}</span><span className="data muted">{kpi ? `weighted by spend · ${kpi.risk} flagged` : 'weighted by spend'}</span></div>
          <div className={s.kpi} title={kpi?.formulas.reuse}><span className="text-label-caps">Reuse rate</span><span className={s.kpiVal} data-testid="kpi-reuse">{kpi ? `${kpi.reusePct}%` : '—'}</span><span className="data muted">resolved to a production part</span></div>
          <div className={s.kpi}><span className="text-label-caps">Match certainty</span>
            <div className={s.certBar} role="img" aria-label="Match certainty" data-testid="cert-bar">
              {TIER_ORDER.map((t) => { const n = kpi?.certaintyCounts[t] ?? 0; return n ? <i key={t} className={tierTone(t)} style={{ flex: n }} title={`${vocab.resolve('dataType', t).label} ${n}`} /> : null })}
              {!kpi && <i style={{ flex: 1 }} />}
            </div>
            <div className={s.legend} data-testid="cert-legend">{TIER_ORDER.map((t) => <span key={t} data-tier={t}>{vocab.resolve('dataType', t).label} <b className="data">{kpi?.certaintyCounts[t] ?? 0}</b></span>)}</div>
          </div>
        </div>
      </Stub>
      <div className={s.counters}>
        <span data-testid="counter-confirmed">Surrogates confirmed <b className="data">{proposed.filter((r) => r.confirmed).length}</b> of <b className="data">{proposed.length}</b></span>
        <span data-testid="counter-unresolved">Unresolved <b className="data">{unresolved}</b></span>
        <span className="data muted right">{connected.sap === false ? 'SAP disconnected · cached quotes' : 'SAP sync 14 min ago'} · FX 3-mo avg · LME daily</span>
      </div>
      <div className={s.body}>
        <TableShell<BomViewRow> id={BOM_TABLE_ID} noun="lines" columns={columns} rows={rows} rowId={(r) => r.id} selectedId={selectedId} onSelect={(id) => setSel(id)}
          urlSync defaultGroup="sub" groupOptions={[{ key: 'sub', label: 'Subassembly', get: (r) => r.subassembly }]}
          folderMeta={(rs) => `${money(rs.reduce((a, r) => a + (r.unitPrice == null ? 0 : r.extPrice), 0))} · ${rs.filter((r) => modeOf(r) === 'carry').length} carryover`}
          rowTone={(r) => (r.state === 'failed' ? 'warn' : undefined)}
          actionsLabel="Actions"
          rowActions={(r) => (
            <span className="row" style={{ justifyContent: 'center' }}>
              <Link to={`/create/bom/03b-compare?line=${r.id}`} aria-label={`Compare ${r.name}`}>Compare</Link>
              <a href={searchOnLink(r.partNumber, r.id)} target="_blank" rel="noreferrer" aria-label={`Search on ${r.name}`} data-testid={`search-on-${r.id}`}><ExternalLink size={12} aria-hidden /> Search on</a>
            </span>)}
          empty={{ title: 'No BOM lines', body: <Link to="/create/bom/02-tree">Select parts on the assembly tree</Link> }} />
        {selected && <LinePanel key={selected.id} row={selected} tab={tab} onTab={(t) => setSel(selected.id, t)} onClose={() => setSel(null)} mode={modeOf(selected)} />}
      </div>
    </div>
  )
}
