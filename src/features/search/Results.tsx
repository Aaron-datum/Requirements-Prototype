import { Bookmark, ExternalLink, GitCompareArrows, Plus, Search as SearchIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ApprovalButton } from '../../components/audit/Audit'
import { MatchQuality } from '../../components/quality/MatchQuality'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { Stub } from '../../components/stub/Stub'
import { TableShell } from '../../components/table/TableShell'
import type { ColumnDef } from '../../components/table/types'
import { Badge, Button, IconButton } from '../../components/ui'
import { useConfig, useVocab } from '../../config/useConfig'
import type { ApprovalState } from '../../domain/types'
import { fileById, measurementTypeByKey } from '../../fixtures/derive-search'
import type { ResultRowX } from '../../fixtures/extras/search/types'
import { activeLeaves } from '../../fixtures/derive-search'
import { applyDecisionAction, searchOnHref, useWorkflowCtx } from '../../lib/workflowContext'
import { now } from '../../lib/clock'
import { useService } from '../../services/context'
import { PLM_DISABLED_TIP } from '../../services/stubs/plm'
import { useProjectStore } from '../../stores/projectStore'
import { toastSuccess } from '../../stores/toastStore'
import { FileThumb, ToleranceBar, fmtDate, fmtNum, schemaColumns } from './common'
import { CONFIDENCE_LEVELS, DEFAULT_PROJECT_ID, confidenceLevel, modalityById } from './modalities'
import { compareHref, defineHref, filesHref, readState, toQuery } from './query'
import { ResultDetail } from './ResultDetail'
import s from './Search.module.css'

type Row = ResultRowX & { approvalState?: ApprovalState }

/** Results: ranked matches with the pinned Source Part row, three quality dimensions, measurement columns, row tabs and actions. */
export function Results() {
  const config = useConfig()
  const vocab = useVocab()
  const nav = useNavigate()
  const loc = useLocation()
  const ctx = useWorkflowCtx()
  const engine = useService('engine')
  const audit = useService('audit')
  const persistence = useService('persistence')
  const [params] = useSearchParams()
  const st = readState(params)
  const file = fileById[st.file]
  const mod = modalityById(st.modality)
  const [rows, setRows] = useState<ResultRowX[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [confirmed, setConfirmed] = useState<Record<string, ApprovalState>>({})
  const qKey = `${st.modality}|${st.file}|${st.part ?? ''}|${st.measurements.map((m) => `${m.typeKey}:${m.value}`).join(',')}`
  const addRecent = useProjectStore((p) => p.addRecent)

  useBreadcrumbs([{ label: 'Search', to: '/search/new' }, { label: 'Files', to: filesHref(st.modality, ctx) }, { label: 'Define', to: defineHref(st, ctx) }, { label: 'Results' }])

  useEffect(() => {
    let live = true
    setRows(null); setError(null)
    engine.runSearch(toQuery(st)).then((r) => {
      if (!live) return
      setRows(r as ResultRowX[])
      if (file) addRecent({ id: qKey, kind: 'search', title: file.name, href: loc.pathname + loc.search, meta: { modality: st.modality, results: r.length - 1 }, at: now() })
    }).catch(() => live && setError('The search could not be completed. Try again.'))
    return () => { live = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qKey, attempt])

  const source = rows?.find((r) => r.isSourcePart)
  const candidates = useMemo<Row[]>(() => (rows ?? []).filter((r) => !r.isSourcePart).map((r) => ({ ...r, approval: ctx ? (confirmed[r.id] ?? r.approval) : undefined })), [rows, ctx, confirmed])

  const columns = useMemo<Array<ColumnDef<Row>>>(() => {
    const dt = (r: Row) => r.quality.dataType?.raw
    const cols: Array<ColumnDef<Row>> = [
      { key: 'name', label: 'File Name', group: 'File Metadata', pinned: true, filter: 'text-search', width: 300, get: (r) => r.name,
        render: (r) => {
          const f = fileById[r.fileId]
          return <span className={s.nameCell}>{f && <FileThumb file={f} />}<span className="col" style={{ gap: 0 }}><span className={s.fname}>{r.name}</span>
            <span className={s.sub}>{r.isSourcePart && <Badge tone="info">Source Part</Badge>} {r.fileKind === 'assembly' ? `Assembly · ${f ? activeLeaves(f).length : 0} parts` : f ? `${f.partNumber} · Rev ${f.revision}` : ''}</span></span></span>
        } },
      { key: 'source', label: 'Source', group: 'File Metadata', filter: 'multi-tag', get: (r) => r.source, render: (r) => <span className={s.nowrap}>{r.source}</span> },
      { key: 'created', label: 'Created', group: 'File Metadata', filter: 'date-preset', get: (r) => r.created, render: (r) => <span className={`data ${s.nowrap}`}>{fmtDate(r.created)}</span> },
      { key: 'lastEdited', label: 'Last Edited', group: 'File Metadata', filter: 'date-preset', get: (r) => r.lastEdited, render: (r) => <span className={`data ${s.nowrap}`}>{fmtDate(r.lastEdited)}</span> },
    ]
    if (st.modality === 'part-in-assembly-to-part') cols.push({ key: 'parent', label: 'Parent assembly', group: 'File Metadata', filter: 'multi-search', get: (r) => (r.parentAssemblyId ? fileById[r.parentAssemblyId]?.name : undefined), render: (r) => <span className={s.fname}>{r.parentAssemblyId ? fileById[r.parentAssemblyId]?.name : '—'}</span> })
    cols.push(
      { key: 'similarity', label: 'Geometric Similarity', group: 'Match Quality', filter: 'range-units', unit: '%', get: (r) => r.quality.similarity?.percent ?? null,
        render: (r) => r.isSourcePart ? <span className={s.qcell}><Badge tone="info">Source Part</Badge><span className="data muted">0%</span></span> : (
          <span className={s.qcell}>
            <Stub id="matching-engine" note="Pre-baked scores"><MatchQuality quality={r.quality} /></Stub>
            {r.approval && <ApprovalButton approval={r.approval} subject={{ type: 'search-result', id: r.fileId }} label={r.name} onConfirmed={(next) => setConfirmed((c) => ({ ...c, [r.id]: next }))} />}
          </span>) },
      { key: 'confidence', label: 'Confidence', group: 'Match Quality', filter: 'level-seg', order: CONFIDENCE_LEVELS.map((l) => l.label), defaultVisible: false, get: (r) => confidenceLevel(r.quality.confidence),
        render: (r) => (r.quality.confidence ? <Badge tone="outline">{r.quality.confidence.label ?? `${r.quality.confidence.score}%`}</Badge> : <span className="muted">—</span>) },
      { key: 'dataType', label: 'Data type', group: 'Match Quality', filter: 'multi-tag', defaultVisible: false, get: dt, label_of: (raw) => vocab.resolve('dataType', raw).label,
        render: (r) => { const raw = dt(r); return raw ? <Badge tone={vocab.resolve('dataType', raw).tone}>{vocab.resolve('dataType', raw).label}</Badge> : <span className="muted">—</span> } },
    )
    st.measurements.forEach((m) => {
      const t = measurementTypeByKey[m.typeKey]
      cols.push({ key: `m-${m.id}`, label: `${t?.label ?? m.typeKey} (${t?.unit ?? ''})`, group: 'Measurements', filter: 'none', align: 'right', get: (r) => { const c = r.measurements[m.id]?.candidate; return typeof c === 'number' ? c : null },
        render: (r) => {
          const c = r.measurements[m.id]
          if (!c) return <span className="muted">—</span>
          if (c.candidate === 'manual-required') return <span className={s.manual}>Manual measurement required</span>
          return <span className="col" style={{ gap: 0, alignItems: 'flex-end' }}><span className="data">{fmtNum(c.candidate)}</span>{c.deviationPct != null && !r.isSourcePart ? <ToleranceBar deviationPct={c.deviationPct} tolerancePct={t?.tolerancePct ?? 5} /> : <span className="data muted">{r.isSourcePart ? '0.0%' : '–'}</span>}</span>
        } })
    })
    cols.push(...schemaColumns<Row>(config, (r) => fileById[r.fileId]?.plm, { group: 'PLM' }))
    return cols
  }, [config, vocab, st.modality, st.measurements])

  const returnTo = (r: Row) => compareHref(st, source?.fileId ?? st.file, r.fileId, ctx)
  const saveSearch = () => void persistence.save('search', { title: `${file?.name ?? 'Search'} · ${mod.short}`, href: loc.pathname + loc.search, projectId: DEFAULT_PROJECT_ID })

  const actions = (r: Row) => (
    <span className={s.actions}>
      {!r.isSourcePart && <Button size="sm" onClick={() => nav(returnTo(r))}><GitCompareArrows size={14} aria-hidden />Compare</Button>}
      <Stub id="plm-connectors" note="Never live in the prototype"><IconButton label="Open in PLM" disabled title={PLM_DISABLED_TIP}><ExternalLink size={14} /></IconButton></Stub>
      <Link to={searchOnHref(r.fileId, ctx, st.modality)} target="_blank" rel="noreferrer" className={s.iconLink} aria-label={`Search on ${r.name}`} title="Search on (opens a new tab)"><SearchIcon size={14} aria-hidden /></Link>
      {ctx && !r.isSourcePart && ctx.def.actions.map((a) => (
        <Stub key={a.id} id="audit-trail" note="Decision is recorded in the ledger"><Button size="sm" primary onClick={() => {
          const to = applyDecisionAction(ctx, a, r.name, { audit, config })
          toastSuccess(`${a.label}: ${r.name}`)
          nav(to)
        }}>{a.label}</Button></Stub>
      ))}
    </span>
  )

  return (
    <div className={s.work}>
      <TableShell<Row>
        key={`${config.schema.id}|${qKey}`}
        id="results" noun="files" urlSync columns={columns} rows={candidates} rowId={(r) => r.id}
        pinnedRows={source ? [source as Row] : undefined}
        renderExpanded={(r) => <ResultDetail row={r} state={st} onManual={() => nav(returnTo(r))} />}
        rowActions={actions} loading={rows === null && !error} error={error} onRetry={() => setAttempt((a) => a + 1)}
        header={(m) => (
          <div className={s.found}>
            <h1 className="text-section">Found {candidates.length} matching {candidates.length === 1 ? 'file' : 'files'}</h1>
            <span className="muted">{m.sorted.length === candidates.length ? 'Showing all results' : `Showing ${m.sorted.length} of ${candidates.length}`}</span>
            <span className="right row">
              <Stub id="persistence" note="Saved in memory"><Button onClick={saveSearch}><Bookmark size={14} aria-hidden />Save Search</Button></Stub>
              <Button onClick={() => nav('/search/new')}><Plus size={14} aria-hidden />New Search</Button>
            </span>
          </div>
        )}
        empty={{ title: 'No results match the current filters.' }}
      />
    </div>
  )
}
