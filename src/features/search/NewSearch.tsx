import { Boxes, Box, LayoutGrid, Search as SearchIcon, ScanSearch } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import type { SearchModality } from '../../domain/types'
import { fileById, recentSeeds, searchFiles } from '../../fixtures/derive-search'
import { useProjectStore } from '../../stores/projectStore'
import { FileThumb } from './common'
import { MODALITIES } from './modalities'
import { resultsHref } from './query'
import { UploadModal } from './UploadModal'
import s from './Search.module.css'

const ICON: Record<SearchModality, typeof Box> = { 'part-to-part': Box, 'part-to-assembly': ScanSearch, 'assembly-to-assembly': Boxes, 'part-in-assembly-to-part': SearchIcon }

/** New Search: four modality cards, the Parts Catalogue entry, recent searches. A card opens the upload popup. */
export function NewSearch() {
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'New Search' }])
  const [open, setOpen] = useState<SearchModality | null>(null)
  const recents = useProjectStore((p) => p.recents)
  const list = useMemo(() => {
    const live = recents.filter((r) => r.kind === 'search').map((r) => ({ id: r.id, name: r.title, meta: `${r.meta?.results ?? '—'} results · just now`, href: r.href ?? '/search/new', thumb: searchFiles.find((f) => f.name === r.title) }))
    const seeds = recentSeeds.map((r) => {
      const f = searchFiles.find((x) => x.name === r.fileName)
      return { id: r.id, name: r.fileName, meta: `${r.results} results · ${r.ago}`, href: f ? resultsHref({ file: f.id, modality: r.modality as SearchModality, measurements: [] }) : '/search/new', thumb: f && fileById[f.id] }
    })
    return [...live, ...seeds].slice(0, 6)
  }, [recents])

  return (
    <div className={s.page}>
      <div className={s.narrow}>
        <div className="col" style={{ gap: 'var(--gap-2)' }}>
          <span className={`text-label-caps ${s.eyebrow}`}>New Search</span>
          <h1 className="text-display-md">What are you searching for?</h1>
          <p className="secondary" style={{ maxWidth: 640 }}>Pick the modality that matches your input file and the kind of result you want. You can refine the results with filters and columns at any time.</p>
        </div>
        <div className={s.cards} data-testid="modality-cards">
          {MODALITIES.map((m) => { const I = ICON[m.id]; return (
            <button key={m.id} type="button" className={s.card} data-modality={m.id} onClick={() => setOpen(m.id)}>
              <span className={s.cardTop}><span className={s.tile}><I size={20} aria-hidden /></span><span className="text-label-caps muted data">{m.badge}</span></span>
              <span className={s.cardTitle}>{m.name}</span>
              <span className="secondary">{m.copy}</span>
              <span className={s.cardFoot}><span>{m.cta}</span><span>{m.gives}</span></span>
            </button>
          ) })}
          <Link to="/catalogue" className={s.card} style={{ gridColumn: '1 / -1', textDecoration: 'none' }}>
            <span className={s.cardTop}><span className={s.tile}><LayoutGrid size={20} aria-hidden /></span><span className="text-label-caps muted data">Search entry</span></span>
            <span className={s.cardTitle}>Parts Catalogue</span>
            <span className="secondary">Browse what the company already has by category and spec. No CAD upload needed.</span>
          </Link>
        </div>
        <div className="col" style={{ gap: 'var(--gap-3)' }}>
          <span className={`text-label-caps ${s.eyebrow}`}>Recent searches</span>
          <div className={s.recents} data-testid="recent-searches">
            {list.map((r) => (
              <Link key={r.id} to={r.href} className={s.recent}>
                {r.thumb ? <FileThumb file={r.thumb} /> : <span className={s.thumb} />}
                <span className="col grow" style={{ gap: 0 }}><span className="trunc data">{r.name}</span><span className="muted">{r.meta}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      {open && <UploadModal modality={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
