import { ArrowUpRight, Bookmark, Clock, LayoutGrid, Package, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { Stub } from '../../components/stub/Stub'
import { Badge } from '../../components/ui'
import { resolveValue } from '../../config/appConfig'
import { useConfig } from '../../config/useConfig'
import { HOME_WORKFLOWS, OUTCOME_VOCAB } from '../../fixtures/extras/projects/projectData'
import { now } from '../../lib/clock'
import { useService } from '../../services/context'
import type { DashboardServicePlus } from '../../services/stubs/dashboard'
import { useProjectStore } from '../../stores/projectStore'
import { HERO_SEARCH_ATTR } from './useSearchShortcut'
import s from './Home.module.css'

export const HERO_PLACEHOLDER = 'Describe a part, paste a spec, or search saved work...'
/** Hero search submits here (the search feature builds the route). */
export const heroSearchHref = (q: string): string => `/search/files?q=${encodeURIComponent(q.trim())}&modality=part-to-part`

interface RecentCard { id: string; title: string; requirements?: number; results?: number; outcome?: string; when: string; href: string }

const isMac = (): boolean => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)

/** Home / Launchpad: hero search with Cmd/Ctrl+K, three quick actions, "Recent (this session)" strip. */
export function HomePage() {
  useBreadcrumbs([{ label: 'Home' }])
  const config = useConfig()
  const nav = useNavigate()
  const dash = useService('dashboard') as DashboardServicePlus
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const savedAll = useProjectStore((p) => p.saved)
  const recentsStore = useProjectStore((p) => p.recents)
  const saved = useMemo(() => savedAll.filter((i) => i.kind === 'search'), [savedAll])
  const projectCount = new Set(saved.map((i) => i.projectId ?? 'p-civic-si')).size

  useEffect(() => { if (params.get('focus') === 'search') input.current?.focus() }, [params])

  const recents = useMemo<RecentCard[]>(() => [
    ...recentsStore.map((r) => ({
      id: r.id, title: r.title, requirements: num(r.meta?.requirements), results: num(r.meta?.results), outcome: r.meta?.outcome != null ? String(r.meta.outcome) : undefined, when: r.at.slice(0, 16).replace('T', ' '), href: r.href ?? '/projects',
    })),
    ...dash.recents().filter((x) => !recentsStore.some((r) => r.id === x.id)).map((x) => ({ id: x.id, title: x.title, requirements: x.requirements, results: x.results, outcome: x.outcome, when: x.when, href: x.href })),
  ], [recentsStore, dash])

  const when = new Date(now())
  const first = config.currentUser.name.split(' ')[0]
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) nav(heroSearchHref(q)) }

  return (
    <div className={s.page} data-testid="home">
      <div className={s.canvas}>
        <div className={s.hero}>
          <img className={s.logo} src="/datum-logo-full-transparent.png" alt="Datum" />
          <div className={s.hello}>Welcome back, <b>{first}</b> <span className="data muted">· {when.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</span></div>
          <form className={s.search} role="search" onSubmit={submit}>
            <Search size={18} aria-hidden />
            <input ref={input} {...{ [HERO_SEARCH_ATTR]: '' }} type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder={HERO_PLACEHOLDER} aria-label="Search parts, specs and saved work" />
            <span className={s.kbd} aria-label={isMac() ? 'Command K shortcut' : 'Control K shortcut'}>{isMac() ? '⌘K' : 'Ctrl K'}</span>
          </form>
        </div>

        <div className={s.cards} data-testid="quick-actions">
          <Link to="/search/new" className={`${s.card} ${s.cardPrimary}`} data-testid="qa-search">
            <span className={s.ic}><Package size={18} aria-hidden /></span>
            <span className={s.cardTitle}>Start a Search</span>
            <span className={s.cardDesc}>Upload CAD files and match parts to your tolerance windows.</span>
            <span className={s.cardFoot}><span>{config.acceptedFormats.join(' · ')}</span><ArrowUpRight size={14} aria-hidden /></span>
          </Link>
          <Link to="/create/bom" className={s.card} data-testid="qa-workflow">
            <span className={s.ic}><LayoutGrid size={18} aria-hidden /></span>
            <span className={s.cardTitle}>Run a Workflow</span>
            <span className={s.cardDesc}>Produce an analytic output: BOM, warranty report, or replacement list.</span>
            <span className={s.cardFoot}><span>{HOME_WORKFLOWS.length} workflows · {HOME_WORKFLOWS.join(', ')}</span><ArrowUpRight size={14} aria-hidden /></span>
          </Link>
          <Link to={saved.length ? '/projects' : '/search/new'} className={s.card} data-testid="qa-saved">
            <span className={s.ic}><Bookmark size={18} aria-hidden /></span>
            <span className={s.cardTitle}>Saved Searches</span>
            <span className={s.cardDesc}>{saved.length ? saved.slice(0, 2).map((i) => i.title).join(' · ') : 'No saved searches yet. Run a search, then use Save Search to pin it to a project and find it here.'}</span>
            <span className={s.cardFoot}><span>{saved.length ? `${saved.length} across ${projectCount} project${projectCount === 1 ? '' : 's'}` : 'no saved searches'}</span><ArrowUpRight size={14} aria-hidden /></span>
          </Link>
        </div>
      </div>

      <section className={s.strip} aria-label="Recent (this session)" data-testid="recent-strip">
        <div className={s.stripHead}>
          <Clock size={16} aria-hidden />
          <h2>Recent (this session)</h2>
          <Badge pill>{recents.length} {recents.length === 1 ? 'search' : 'searches'}</Badge>
          <Link to="/projects" className="right" data-testid="recent-all">View all in My Projects <ArrowUpRight size={12} aria-hidden /></Link>
        </div>
        <Stub id="dashboard-services" note="Session recents come from the in-memory project store plus seed items">
          <div className={s.stripBody}>
            {recents.length === 0 && <div className="muted">No recent searches.</div>}
            {recents.map((r) => {
              const o = r.outcome ? resolveValue({ vocabularies: [OUTCOME_VOCAB] }, 'recentOutcome', r.outcome) : null
              return (
                <div key={r.id} className={s.rcard} data-testid="recent-item">
                  <Link to={r.href} className={s.rTitle}><Search size={14} aria-hidden /><span className="trunc">{r.title}</span></Link>
                  <div className={s.stats}>
                    <span className={s.st}><span className={s.k}>Requirements</span><span className={s.v}>{r.requirements ?? '-'}</span></span>
                    <span className={s.st}><span className={s.k}>Results</span><span className={s.v}>{r.results ?? '-'}</span></span>
                    {o && <span className="right"><Badge tone={o.tone} pill>{o.label}</Badge></span>}
                  </div>
                  <span className={s.when}>Last run · {r.when}</span>
                </div>
              )
            })}
          </div>
        </Stub>
      </section>
    </div>
  )
}

const num = (v: string | number | undefined): number | undefined => (typeof v === 'number' ? v : v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined)
