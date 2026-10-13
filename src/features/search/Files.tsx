import { ArrowDownUp, ExternalLink, LayoutGrid, List, Search, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FieldGroups } from '../../components/fields/FieldRenderer'
import { SidePanel } from '../../components/panels/Panels'
import { Stub } from '../../components/stub/Stub'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { TableShell } from '../../components/table/TableShell'
import type { ColumnDef } from '../../components/table/types'
import { Badge, Button, IconButton, LinkButton, SearchBox } from '../../components/ui'
import { useConfig } from '../../config/useConfig'
import { duplicatesOf, lineageOf, searchFiles } from '../../fixtures/derive-search'
import type { SearchFile } from '../../fixtures/extras/search/types'
import { PLM_DISABLED_TIP } from '../../services/stubs/plm'
import { useWorkflowCtx } from '../../lib/workflowContext'
import { FileThumb, fmtDate, fmtDateTime, fmtSize, schemaColumns } from './common'
import { isModality } from './modalities'
import { defineHref } from './query'
import { searchFiles as rankFiles } from './searchIndex'
import { UploadModal } from './UploadModal'
import s from './Search.module.css'

const SORTS: Array<[string, string]> = [['modified', 'Date modified'], ['name', 'File name'], ['releasedDate', 'Released date'], ['calcWeight', 'Calc weight']]
const KIND_LABEL: Record<string, string> = { part: 'Part', assembly: 'Assembly' }

/** Files: browse and filter the CAD library, inspect a file, search from it. Columns, filters and detail fields all come from config.schema. */
export function Files() {
  const config = useConfig()
  const nav = useNavigate()
  const ctx = useWorkflowCtx()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const mode = params.get('mode')
  const modalityParam = params.get('modality')
  const modality = isModality(modalityParam) ? modalityParam : 'part-to-part'
  const [sel, setSel] = useState<string | null>(null)
  const [tab, setTab] = useState<'details' | 'plm'>('details')
  const [upload, setUpload] = useState(false)
  useBreadcrumbs([{ label: 'Search', to: '/search/new' }, { label: 'Files' }])

  // Released first: the caller derives "preferred" from the vocabulary order (first entry, and every entry that shares its label).
  const statusDef = config.schema.fields.find((f) => f.vocabularyId === 'releaseStatus')
  const preferValues = useMemo(() => {
    const vals = config.vocabularies.find((v) => v.id === 'releaseStatus')?.values ?? []
    return vals.filter((v) => v.label === vals[0]?.label).map((v) => v.raw)
  }, [config])

  const base = useMemo(() => {
    const live = searchFiles.filter((f) => (mode === 'duplicates' ? duplicatesOf(f).length > 0 : mode === 'revisions' ? lineageOf(f).length > 1 : true))
    const ordered = [...live].sort((a, b) => b.updated.localeCompare(a.updated))
    return rankFiles(ordered, q, { preferValues, statusKey: statusDef?.key })
  }, [q, mode, preferValues, statusDef])

  const columns = useMemo<Array<ColumnDef<SearchFile>>>(() => [
    { key: 'thumb', label: 'Preview', pinned: true, get: () => '', filter: 'none', width: 64, render: (r) => <FileThumb file={r} /> },
    { key: 'name', label: 'File Name', pinned: true, get: (r) => r.name, filter: 'none', render: (r) => <span className={s.fname}>{r.name}</span> },
    { key: 'modified', label: 'Modified', get: (r) => r.updated, filter: 'none', render: (r) => <span className="data">{fmtDate(r.updated)}</span> },
    { key: 'synced', label: 'Last Synced', get: (r) => r.lastSynced, filter: 'none', render: (r) => <span className="data">{fmtDate(r.lastSynced)}</span> },
    ...schemaColumns<SearchFile>(config, (r) => r.plm),
    { key: 'source', label: 'Source', group: 'File', get: (r) => r.source, filter: 'multi-tag', showOnlyWhenFiltered: true },
    { key: 'kind', label: 'File type', group: 'File', get: (r) => r.kind, filter: 'multi-tag', label_of: (raw) => KIND_LABEL[raw] ?? raw, showOnlyWhenFiltered: true, render: (r) => KIND_LABEL[r.kind] },
    { key: 'format', label: 'Format', group: 'File', get: (r) => r.format, filter: 'multi-search', showOnlyWhenFiltered: true },
  ], [config])

  const sortOptions = SORTS.filter(([k]) => columns.some((c) => c.key === k))
  const selected = base.find((f) => f.id === sel) ?? searchFiles.find((f) => f.id === sel) ?? null

  const searchBar = (
    <div className={s.topbar}>
      <Stub id="search-index" note="Client-side, part-number-first"><div className={s.searchWrap}>
        <SearchBox value={q} label="Search files" placeholder="Search file name, e.g. 7100490* or *RSB40*"
          onChange={(v) => { const n = new URLSearchParams(params); if (v) n.set('q', v); else n.delete('q'); setParams(n, { replace: true }) }} />
      </div></Stub>
      <Button primary onClick={() => setUpload(true)}><Upload size={14} aria-hidden />Upload file</Button>
    </div>
  )

  return (
    <div className={s.work}>
      <TableShell<SearchFile>
        key={config.schema.id}
        id="files" noun="files" urlSync columns={columns} rows={base} rowId={(r) => r.id}
        selectedId={sel} onSelect={(id) => { setSel(id); setTab('details') }}
        defaultLayout="table"
        header={<>
          {searchBar}
          {mode && <div className={s.banner}>{mode === 'duplicates' ? 'Find Duplicates: showing files that share geometry with another file. Pick one to search from it.' : 'Find Revisions: showing files that belong to a revision lineage. Pick one to search from it.'}
            <LinkButton onClick={() => { const n = new URLSearchParams(params); n.delete('mode'); setParams(n, { replace: true }) }}>Show all files</LinkButton></div>}
        </>}
        toolbar={(m) => (
          <>
            <label className="row"><span className="muted">Sort</span>
              <select className={s.select} aria-label="Sort by" value={m.sort?.key ?? 'modified'} onChange={(e) => m.setSort({ key: e.target.value, dir: m.sort?.dir ?? 'desc' })}>
                {sortOptions.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select></label>
            <IconButton label={(m.sort?.dir ?? 'desc') === 'desc' ? 'Descending' : 'Ascending'} onClick={() => m.setSort({ key: m.sort?.key ?? 'modified', dir: (m.sort?.dir ?? 'desc') === 'desc' ? 'asc' : 'desc' })}><ArrowDownUp size={14} /></IconButton>
            <IconButton label="List view" ghost={m.layout !== 'table'} onClick={() => m.setLayout('table')}><List size={14} /></IconButton>
            <IconButton label="Gallery view" ghost={m.layout !== 'gallery'} onClick={() => m.setLayout('gallery')}><LayoutGrid size={14} /></IconButton>
          </>
        )}
        renderCard={(r) => (
          <>
            <img src={r.thumbnail} alt="" className={s.thumbLg} style={{ border: 0, borderRadius: 0 }} />
            <div style={{ padding: 'var(--gap-3)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-1)' }}><span className={s.fname}>{r.name}</span><span className="muted data">{fmtDate(r.updated)} · {fmtSize(r.sizeBytes)}</span></div>
          </>
        )}
        empty={{ title: 'No files match the current filters and search.' }}
      />
      {selected && (
        <SidePanel title="File details" subtitle={selected.format} onClose={() => setSel(null)}
          tabs={[{ key: 'details', label: 'Details' }, { key: 'plm', label: 'PLM' }]} tab={tab} onTab={setTab}
          footer={<div className="col" style={{ gap: 'var(--gap-2)' }}>
            <Button primary onClick={() => nav(defineHref({ file: selected.id, modality, measurements: [] }, ctx))}><Search size={14} aria-hidden />Search from this file</Button>
            <span className="muted">Builds a new search using this file as the reference.</span>
          </div>}>
          <div className={s.drawerBody}>
            <FileThumb file={selected} large />
            <div className="col" style={{ gap: 'var(--gap-1)' }}><span className={s.fname}>{selected.name}</span><div className="row"><Badge tone="outline">{selected.format}</Badge><span className="muted data">{fmtSize(selected.sizeBytes)}</span></div></div>
            {tab === 'details' && (
              <>
                <span className="text-label-caps">File</span>
                <dl className={s.dl}>
                  <dt>Size</dt><dd>{fmtSize(selected.sizeBytes)}</dd><dt>Source</dt><dd>{selected.source}</dd><dt>Created by</dt><dd>{selected.createdBy}</dd>
                  <dt>Created</dt><dd>{fmtDateTime(selected.created)}</dd><dt>Updated</dt><dd>{fmtDateTime(selected.updated)}</dd><dt>Last synced</dt><dd>{fmtDateTime(selected.lastSynced)}</dd>
                  <dt>Revision</dt><dd>{selected.revision}</dd>
                </dl>
              </>
            )}
            {tab === 'plm' && (
              <>
                <FieldGroups record={selected.plm} emptyText="No PLM record for this file." />
                <Stub id="plm-connectors" note="Never live in the prototype"><Button disabled title={PLM_DISABLED_TIP}><ExternalLink size={14} aria-hidden />Open in PLM</Button></Stub>
              </>
            )}
          </div>
        </SidePanel>
      )}
      {upload && <UploadModal modality={modality} onClose={() => setUpload(false)} />}
    </div>
  )
}
