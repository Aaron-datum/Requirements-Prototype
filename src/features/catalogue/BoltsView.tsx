import { Bookmark, Download, GitCompareArrows } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Stub } from '../../components/stub/Stub'
import { Button } from '../../components/ui'
import { applyFilters } from '../../components/table/filtering'
import { TableShell } from '../../components/table/TableShell'
import type { FilterState } from '../../components/table/types'
import type { TableModel } from '../../components/table/useTableModel'
import { CATALOGUE_SETTINGS } from '../../config/catalogueConfig'
import { useVocab } from '../../config/useConfig'
import type { CatalogueNode, CatalogueRowX } from '../../domain/catalogue'
import { useService } from '../../services/context'
import { toastSuccess } from '../../stores/toastStore'
import { useCatalogueCrumbs } from './Browse'
import { CategoryTree } from './CategoryTree'
import { useCatalogueColumns } from './columns'
import { downloadText, toCsv } from './csv'
import { PartDrawer } from './PartDrawer'
import { SearchOnLink, DecisionButtons } from './PartActions'
import { CatalogueSearch, QuickSelect } from './QuickSelect'
import { PART_PARAM, SEL_PARAM, TABLE_ID, TABLE_PARAM, anyActive, compareUrl, facetsFromFilters, filtersFromFacets, mergeFilters, readList, readTable, writeList } from './urlState'
import { useCatalogue } from './useCatalogue'
import s from './catalogue.module.css'

/** Fasteners > Bolts: tiles until a filter is active, then the shared table with filters, tree, drawer and compare. */
export function BoltsView() {
  const svc = useCatalogue()
  const persistence = useService('persistence')
  const vocab = useVocab()
  const nav = useNavigate()
  const loc = useLocation()
  const [params, setParams] = useSearchParams()
  const columns = useCatalogueColumns()
  const root = svc.node(CATALOGUE_SETTINGS.dataRootId) as CatalogueNode
  const rows = useMemo(() => svc.rows(root.id), [svc, root.id])
  const modelRef = useRef<TableModel<CatalogueRowX> | null>(null)

  const raw = params.get(TABLE_PARAM) ?? ''
  const table = useMemo(() => readTable(new URLSearchParams({ [TABLE_PARAM]: raw })), [raw])
  const { facets, text } = useMemo(() => facetsFromFilters(table.filters), [table])
  const key = JSON.stringify({ facets, text })
  const active = anyActive(table.filters)
  const filtered = useMemo(() => applyFilters(rows, columns, table.filters), [rows, columns, table])
  const live = useMemo(() => svc.liveTree(facets, text), [svc, key]) // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => svc.query(root.id, facets, text).facetCounts, [svc, key, root.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const sel = readList(params, SEL_PARAM)
  const partId = params.get(PART_PARAM)
  const part = partId ? svc.part(partId) ?? null : null
  const filteredIds = new Set(filtered.map((r) => r.partNumber))
  const visibleSel = sel.filter((id) => filteredIds.has(id))
  const hidden = sel.length - visibleSel.length

  const patch = (p: Record<string, string | null>) => setParams((cur) => {
    const n = new URLSearchParams(cur)
    Object.entries(p).forEach(([k, v]) => { if (v == null || v === '') n.delete(k); else n.set(k, v) })
    return n
  }, { replace: true })
  const setSel = (ids: string[]) => patch({ [SEL_PARAM]: ids.length ? writeList(ids) : null })

  // Effective tree node: the data root, or its size child when exactly one value of the scope axis is selected.
  const axis = root.scopeAxis ?? ''
  const single = facets[axis]?.length === 1 ? facets[axis]![0] : undefined
  const effective = root.children?.find((c) => single !== undefined && c.scope?.[axis]?.[0] === single) ?? root
  useCatalogueCrumbs(effective.id)

  const setFilters = (f: FilterState) => modelRef.current?.setFilters(f)
  const onTree = (n: CatalogueNode) => {
    if (n.id !== root.id && !n.scope) { nav(`/catalogue/${n.id}${loc.search.includes('ctx=') ? `?${new URLSearchParams([...params].filter(([k]) => k === 'ctx' || k === 'ret')).toString()}` : ''}`); return }
    const base = { ...table.filters }
    delete base[n.scope ? Object.keys(n.scope)[0]! : axis]
    setFilters(n.scope ? mergeFilters(base, filtersFromFacets(n.scope)) : base)
  }
  const toggle = (k: string, v: string, on: boolean) => {
    const cur = facets[k] ?? []
    const next = on ? [...cur, v] : cur.filter((x) => x !== v)
    modelRef.current?.setFilter(k, next.length ? { values: next } : undefined)
  }
  const applySearch = (t: string) => {
    const p = svc.parse(t)
    setFilters(mergeFilters(table.filters, filtersFromFacets(p.facets, p.text)))
  }

  const sortCol = columns.find((c) => c.key === (table.sort?.key ?? CATALOGUE_SETTINGS.defaultSortKey))
  const title = [facets.thread?.length === 1 ? facets.thread[0] : null, facets.head?.length === 1 ? facets.head[0] : null, root.label].filter(Boolean).join(' ')
  const armed = visibleSel.length >= 2
  const openCompare = () => nav(compareUrl({ a: visibleSel[0]!, b: visibleSel[1]!, more: visibleSel.slice(2), form: visibleSel.length > 2 ? 'table' : 'dual', from: loc.pathname + loc.search }, params))
  const exportCsv = () => {
    const out = modelRef.current?.sorted ?? filtered
    downloadText('bolts.csv', toCsv(out, undefined, (v, r) => vocab.resolve(v, r).label))
    toastSuccess(`Exported ${out.length} rows to bolts.csv`)
  }
  const saveView = () => {
    const m = modelRef.current
    void persistence.save('view', { title: `${title} view`, projectId: CATALOGUE_SETTINGS.saveViewProjectId, href: loc.pathname + loc.search, meta: { table: TABLE_ID, filters: JSON.stringify(table.filters), visible: m?.visible.join(',') ?? '', fields: m?.fields.join(',') ?? '' } })
  }
  const hint = sel.length === 0 ? 'Select 2 or more parts to compare' : visibleSel.length === 1 ? '1 selected, pick at least 1 more' : `${visibleSel.length} selected`

  const header = (
    <>
      <div className={s.head}>
        <div className={s.headTitle} data-testid="results-header">
          <h1 className="text-section">{active ? title : root.label}</h1>{' '}
          <span className="data muted">{active ? `· ${filtered.length} results · sorted by ${sortCol?.label.toLowerCase() ?? ''}` : `· ${rows.length} parts · ${root.types} types`}</span>
        </div>
        <CatalogueSearch compact label="Search Bolts" placeholder="Spec or part number, e.g. M16 hex stainless" onSubmit={applySearch} />
      </div>
      {!active && <QuickSelect axes={root.axes ?? []} counts={counts} selected={facets} onToggle={toggle} />}
    </>
  )
  const idle = (
    <div className={s.idle} data-testid="bolts-tiles">
      <p className="secondary">Pick a thread size in Filters, or a bolt type.</p>
      <div className={s.tiles}>
        {svc.headTypes().map((h) => (
          <button key={h.value} type="button" className={`${s.tile} ${s.typeTile}`} data-testid={`type-${h.value}`} onClick={() => modelRef.current?.setFilter('head', { values: [h.value] })}>
            <img className={s.tileImg} src={h.image} alt="" />
            <span className={s.typeBody}><span className={s.tileHead}><span>{h.label}</span></span><span className={s.tileDesc}>{h.description}</span><span className={s.tileMeta}>{counts.head?.[h.value] ?? 0} parts</span></span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className={s.frame}>
      <Stub id="search-index" note="Client-side filter over fixture rows; facet counts computed from rows">
        <TableShell id={TABLE_ID} noun="bolts" columns={columns} rows={rows} rowId={(r) => r.partNumber} urlSync paginate
          selectedId={partId} onSelect={(id) => patch({ [PART_PARAM]: id })} checkedIds={sel} onCheckedChange={setSel}
          onModel={(m) => { modelRef.current = m }} header={header} idle={idle}
          sidebarOpen={['thread', 'length', 'head', 'grade', 'material', 'standard']}
          sidebarTop={<CategoryTree title="Catalogue" tree={live} selectedId={effective.id} filtersActive={active} onSelect={onTree} />}
          rowActions={(r) => <span className="row" style={{ justifyContent: 'center' }}><SearchOnLink partNumber={r.partNumber} iconOnly ghost /><DecisionButtons partNumber={r.partNumber} /></span>}
          empty={{ title: 'No bolts match these filters', body: 'Remove a filter or widen the length range to see more parts.' }}
          toolbar={(
            <span className={s.tool}>
              <span className={s.hint} data-testid="compare-hint">{hint}{hidden > 0 ? ` · ${hidden} hidden by filters` : ''}</span>
              <Button size="sm" primary disabled={!armed} onClick={openCompare} data-testid="compare-btn"><GitCompareArrows size={14} aria-hidden />{armed ? `Compare ${visibleSel.length} Selected` : 'Compare'}</Button>
              <Button size="sm" onClick={exportCsv}><Download size={14} aria-hidden />Export CSV</Button>
              <Stub id="persistence" note="Saved in memory"><Button size="sm" onClick={saveView}><Bookmark size={14} aria-hidden />Save View</Button></Stub>
            </span>
          )} />
      </Stub>
      <PartDrawer part={part} inCompare={!!part && sel.includes(part.partNumber)} onClose={() => patch({ [PART_PARAM]: null })}
        onToggleCompare={() => part && setSel(sel.includes(part.partNumber) ? sel.filter((x) => x !== part.partNumber) : [...sel, part.partNumber])} />
    </div>
  )
}
