import { ChevronRight } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SidePanel } from '../../components/panels/Panels'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { Stub } from '../../components/stub/Stub'
import { Button, EmptyState } from '../../components/ui'
import { CATALOGUE_SETTINGS } from '../../config/catalogueConfig'
import type { CatalogueNode } from '../../domain/catalogue'
import { BoltsView } from './BoltsView'
import { CategoryTree } from './CategoryTree'
import { CatalogueSearch } from './QuickSelect'
import { PART_PARAM, SEL_PARAM, TABLE_PARAM, catalogueUrl, filtersFromFacets, mergeFilters, nodeUrl, readTable, writeTable } from './urlState'
import { useCatalogue } from './useCatalogue'
import s from './catalogue.module.css'

const fmt = (n: number): string => n.toLocaleString('en-US')
const NO_DATA_NOTE = 'Opens the same browse flow. Sample parts exist for Fasteners › Bolts only.'

/** Breadcrumbs mirror the tree path: Search > Catalogue > Fasteners > Bolts > M16. */
export function useCatalogueCrumbs(nodeId: string | null, tail?: string): void {
  const svc = useCatalogue()
  const [params] = useSearchParams()
  const q = params.toString()
  const crumbs = useMemo(() => {
    const p = new URLSearchParams(q)
    const path = nodeId ? svc.path(nodeId) : []
    const trail = [{ label: 'Search', to: '/search/new' }, { label: 'Catalogue', to: nodeUrl(null, p) }, ...path.map((n) => ({ label: n.label, to: nodeUrl(n.id, p) }))]
    if (tail) trail.push({ label: tail, to: '' })
    const last = trail.length - 1
    return trail.map((c, i) => (i === last ? { label: c.label } : c))
  }, [svc, nodeId, tail, q])
  useBreadcrumbs(crumbs)
}

/** Left rail with the pinned category tree, centre content, and the right panel (empty, never gone). */
function CatalogueFrame({ selectedId, children }: { selectedId: string | null; children: ReactNode }) {
  const svc = useCatalogue()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const tree = useMemo(() => svc.tree(), [svc])
  return (
    <div className={s.frame}>
      <Stub id="search-index" note="Category tree and counts computed from fixture rows">
        <aside className={s.rail} aria-label="Category rail">
          <CategoryTree tree={tree} selectedId={selectedId} filtersActive={false} onSelect={(n) => nav(nodeUrl(n.id, params))} />
        </aside>
        <div className={s.page} data-testid="catalogue-page">{children}</div>
      </Stub>
      <SidePanel title="" defaultWidth={340} empty={<span data-testid="drawer-empty">Select a category or part to see its detail here.</span>}>{null}</SidePanel>
    </div>
  )
}

function Tile({ node, onOpen, image }: { node: CatalogueNode; onOpen: () => void; image?: string }) {
  const hasData = !!node.rowBacked || !!node.children?.some((c) => c.rowBacked)
  return (
    <button type="button" className={s.tile} data-testid={`tile-${node.id}`} onClick={onOpen} data-has-data={hasData || undefined}>
      {image && <img className={s.tileImg} src={image} alt="" />}
      <span className={s.tileHead}><span>{node.label}</span><ChevronRight size={16} aria-hidden /></span>
      <span className={s.tileDesc}>{node.description}</span>
      <span className={s.tileMeta}><span>{fmt(node.count)} parts · {node.types ?? node.children?.length ?? 0} types</span>{!hasData && <span className={s.tileNote}>{NO_DATA_NOTE}</span>}</span>
    </button>
  )
}

/** Landing: search, recent chips, category tiles. */
export function CatalogueLanding() {
  const svc = useCatalogue()
  const nav = useNavigate()
  const [params] = useSearchParams()
  useCatalogueCrumbs(null)
  const tree = svc.tree()
  const search = (text: string) => {
    const p = svc.parse(text)
    const f = filtersFromFacets(p.facets, p.text)
    nav(nodeUrl(CATALOGUE_SETTINGS.dataRootId, params, Object.keys(f).length ? { [TABLE_PARAM]: writeTable({ filters: f }) } : undefined))
  }
  return (
    <CatalogueFrame selectedId={null}>
      <div><h1 className="text-display-sm">Parts Catalogue</h1><p className={s.lead}>Browse what the company already has by category and spec. No CAD upload needed.</p></div>
      <div className="col" style={{ gap: 'var(--gap-2)' }}>
        <span className={s.cap}>Search Catalogue</span>
        <CatalogueSearch big label="Search Catalogue" placeholder="Part number, description, or spec, e.g. M16 hex stainless" onSubmit={search} />
        <div className={s.recent} aria-label="Recent searches"><span className="muted">Recent</span>{svc.recent().map((r) => <button key={r} type="button" className={s.chip} onClick={() => search(r)}>{r}</button>)}</div>
      </div>
      <div className="col" style={{ gap: 'var(--gap-3)' }}>
        <span className={s.cap}>Categories</span>
        <div className={s.tiles}>{tree.map((n) => <Tile key={n.id} node={n} onOpen={() => nav(nodeUrl(n.id, params))} />)}</div>
      </div>
    </CatalogueFrame>
  )
}

/** Fasteners: type cards. */
function TypeCards({ node }: { node: CatalogueNode }) {
  const nav = useNavigate()
  const [params] = useSearchParams()
  useCatalogueCrumbs(node.id)
  return (
    <CatalogueFrame selectedId={node.id}>
      <div className={s.pageHead}><h1 className="text-display-sm">{node.label}</h1><span className="data muted">{fmt(node.count)} parts · {node.children?.length ?? 0} types</span></div>
      <div className={s.tiles}>{node.children?.map((c) => <Tile key={c.id} node={c} onOpen={() => nav(nodeUrl(c.id, params))} />)}</div>
    </CatalogueFrame>
  )
}

/** Categories without sample data: say so inline and offer the populated flow. */
function NoData({ node }: { node: CatalogueNode }) {
  const nav = useNavigate()
  const [params] = useSearchParams()
  useCatalogueCrumbs(node.id)
  return (
    <CatalogueFrame selectedId={node.id}>
      <div className={s.pageHead}><h1 className="text-display-sm">{node.label}</h1><span className="data muted">{fmt(node.count)} parts · {node.types ?? 0} types</span></div>
      <div className={s.note} data-testid="no-data-note">
        <span className="text-section">{node.label} opens the same browse flow</span>
        <span className="secondary">{node.description} In this prototype only Fasteners › Bolts carries parts, so category, type and spec filters are shown there.</span>
        <Button onClick={() => nav(nodeUrl(CATALOGUE_SETTINGS.dataRootId, params))}>Browse Bolts</Button>
      </div>
    </CatalogueFrame>
  )
}

/** Route element for /catalogue/:nodeId. Scoped nodes (a thread size) are aliases of the data root with the scope applied as a filter. */
export function CatalogueNodePage() {
  const { nodeId = '' } = useParams()
  const svc = useCatalogue()
  const [params] = useSearchParams()
  const node = svc.node(nodeId)
  useCatalogueCrumbs(node ? null : null)
  if (!node) return <CatalogueFrame selectedId={null}><EmptyState title="That category does not exist" action={<Button onClick={() => undefined}>Back to the catalogue</Button>}>Choose a category from the tree.</EmptyState></CatalogueFrame>
  if (node.scope) {
    const cur = readTable(params)
    const rootNode = svc.node(CATALOGUE_SETTINGS.dataRootId)
    const base = { ...cur.filters }
    if (rootNode?.scopeAxis) delete base[rootNode.scopeAxis]
    const filters = mergeFilters(base, filtersFromFacets(node.scope))
    const extra: Record<string, string | undefined> = { [TABLE_PARAM]: writeTable({ filters, sort: cur.sort }), [SEL_PARAM]: params.get(SEL_PARAM) ?? undefined, [PART_PARAM]: params.get(PART_PARAM) ?? undefined }
    return <Navigate replace to={catalogueUrl(`/catalogue/${CATALOGUE_SETTINGS.dataRootId}`, params, extra)} />
  }
  if (node.id === CATALOGUE_SETTINGS.dataRootId) return <BoltsView />
  if (node.children?.length) return <TypeCards node={node} />
  return <NoData node={node} />
}
