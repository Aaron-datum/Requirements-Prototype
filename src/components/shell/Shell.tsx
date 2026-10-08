import { Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleHelp, FolderOpen, Folder, Layers, MessageSquare, Plus, Search, Settings, Shield, Copy, GitBranch, Boxes, LayoutGrid, RefreshCw, Upload, User } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useConfig } from '../../config/useConfig'
import { useService } from '../../services/context'
import { useCrumbStore } from '../../stores/crumbStore'
import { useLedger } from '../../stores/ledgerStore'
import { useProjectStore } from '../../stores/projectStore'
import { toastSuccess } from '../../stores/toastStore'
import { AuditEntryRow } from '../audit/Audit'
import { Button, IconButton, Modal, TextInput, Toasts } from '../ui'
import { DevToolbar } from '../../dev/DevToolbar'
import s from './Shell.module.css'

/** Feedback modal (decided): "What happened?", attachment dropzone, auto-attached context chips, Cancel / Submit ticket. Creates a Jira ticket in the beta. */
export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const config = useConfig()
  const audit = useService('audit')
  const { pathname } = useLocation()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const submit = () => {
    const id = `DATUM-${1000 + audit.list().length + 1}`
    audit.record({ by: config.currentUser.name, action: 'Submitted feedback ticket', subject: { type: 'feedback', id }, note: text.trim().slice(0, 60) })
    toastSuccess(`Ticket ${id} created`)
    onClose()
  }
  const chips = [`user: ${config.currentUser.email}`, `page: ${pathname}`, 'build: v1.0 · 248', `theme: ${document.documentElement.dataset.theme ?? 'white'}`]
  return (
    <Modal title="Send feedback" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button primary disabled={!text.trim()} onClick={submit}>Submit ticket</Button></>}>
      <div className="col" style={{ gap: 'var(--gap-3)' }}>
        <label className="col" style={{ gap: 4 }}><span className="text-label-caps">What happened?</span>
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'var(--bg-card)', color: 'var(--fg-primary)', padding: 'var(--gap-2)', font: 'inherit' }} /></label>
        <label className={s.attach}><Upload size={14} aria-hidden /> Drop CAD files, screenshots, or docs, or click to browse
          <input type="file" multiple hidden onChange={(e) => setFiles([...(e.target.files ?? [])].map((f) => f.name))} /></label>
        {files.map((f) => <span key={f} className="data muted">{f}</span>)}
        <div className="col" style={{ gap: 2 }}><span className="text-label-caps">Auto-attached context</span>{chips.map((c) => <span key={c} className="data muted">{c}</span>)}</div>
      </div>
    </Modal>
  )
}

function Item({ to, icon, label, collapsed, kid, count, end }: { to: string; icon: ReactNode; label: string; collapsed?: boolean; kid?: boolean; count?: number; end?: boolean }) {
  return (
    <NavLink to={to} end={end} title={collapsed ? label : undefined} className={({ isActive }) => `${s.item} ${isActive ? s.itemOn : ''} ${kid ? s.itemKid : ''}`}>
      {icon}<span className={`grow ${s.lbl}`}>{label}</span>{count != null && !collapsed && <span className={s.navCount}>{count}</span>}
    </NavLink>
  )
}

/** Left nav (decided, D-01): Search, Create, My Projects tree with counts and New project, Settings in the footer. */
export function LeftNav() {
  const [collapsed, setCollapsed] = useState(false)
  const projects = useProjectStore((p) => p.projects)
  const addProject = useProjectStore((p) => p.addProject)
  const [open, setOpen] = useState<Record<string, boolean>>({ 'p-civic-si': true })
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const ic = 16
  return (
    <nav className={`${s.nav} ${collapsed ? s.navCollapsed : ''}`} aria-label="Navigate" data-testid="left-nav">
      <div className={s.navBody}>
        {!collapsed && <span className={`text-label-caps ${s.cap}`}>Search</span>}
        <Item collapsed={collapsed} to="/search/files?modality=assembly-to-assembly" icon={<Boxes size={ic} />} label="Assembly Search" />
        <Item collapsed={collapsed} to="/search/files?modality=part-to-part" icon={<Search size={ic} />} label="Part Search" />
        <Item collapsed={collapsed} to="/search/files?modality=part-to-part&mode=duplicates" icon={<Copy size={ic} />} label="Find Duplicates" />
        <Item collapsed={collapsed} to="/search/files?modality=part-to-part&mode=revisions" icon={<GitBranch size={ic} />} label="Find Revisions" />
        <Item collapsed={collapsed} to="/catalogue" icon={<LayoutGrid size={ic} />} label="Parts Catalogue" />
        {!collapsed && <span className={`text-label-caps ${s.cap}`}>Create</span>}
        <Item collapsed={collapsed} to="/create/bom" icon={<Layers size={ic} />} label="BOM Creation" />
        <Item collapsed={collapsed} to="/create/coming/warranty" icon={<Shield size={ic} />} label="Warranty Analysis" />
        <Item collapsed={collapsed} to="/create/coming/replacement" icon={<RefreshCw size={ic} />} label="Part Replacement" />
        {!collapsed && (
          <div className="row" style={{ padding: 'var(--gap-3) 10px var(--gap-1)' }}>
            <NavLink to="/projects" className="text-label-caps grow">My Projects</NavLink>
            <IconButton label="New project" onClick={() => setNaming(true)}><Plus size={14} /></IconButton>
          </div>
        )}
        {!collapsed && naming && (
          <form className="row" style={{ padding: '0 10px' }} onSubmit={(e) => { e.preventDefault(); if (name.trim()) { addProject(name.trim()); toastSuccess(`Project created: ${name.trim()}`); setName(''); setNaming(false) } }}>
            <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" aria-label="Project name" className="grow" />
            <Button size="sm" type="submit">Add</Button>
          </form>
        )}
        {!collapsed && projects.map((p) => (
          <div key={p.id}>
            <button type="button" className={s.item} onClick={() => setOpen({ ...open, [p.id]: !open[p.id] })} aria-expanded={!!open[p.id]}>
              {open[p.id] ? <FolderOpen size={ic} /> : <Folder size={ic} />}<span className="grow trunc">{p.name}</span>
              <span className={s.navCount}>{p.savedSearches + p.outputs + p.configurations}</span>
            </button>
            {open[p.id] && (<>
              <Item kid to={`/projects/${p.id}`} end icon={<Search size={14} />} label="Saved searches" count={p.savedSearches} />
              <Item kid to={`/projects/${p.id}/outputs`} icon={<Layers size={14} />} label="Outputs" count={p.outputs} />
              <Item kid to={`/projects/${p.id}/configurations`} icon={<Settings size={14} />} label="Configurations" count={p.configurations} />
            </>)}
          </div>
        ))}
      </div>
      <div className={s.navFoot}>
        <Item collapsed={collapsed} to="/settings" icon={<Settings size={ic} />} label="Settings" />
        <Button size="sm" ghost onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? <ChevronsRight size={14} /> : <><ChevronsLeft size={14} />Collapse</>}</Button>
      </div>
    </nav>
  )
}

export function BreadcrumbStrip() {
  const crumbs = useCrumbStore((c) => c.crumbs)
  const nav = useNavigate()
  return (
    <div className={s.crumbs} data-testid="breadcrumbs">
      <IconButton label="Back (browser history)" onClick={() => nav(-1)}><ChevronLeft size={14} /></IconButton>
      {crumbs.map((c, i) => (
        <span key={i} className="row" style={{ gap: 6 }}>
          {i > 0 && <ChevronRight size={14} aria-hidden />}
          {i === crumbs.length - 1 || !c.to ? <span className={i === crumbs.length - 1 ? s.cur : undefined}>{c.label}</span> : <Link to={c.to}>{c.label}</Link>}
        </span>
      ))}
    </div>
  )
}

export function TopBar({ onFeedback }: { onFeedback: () => void }) {
  const config = useConfig()
  const [menu, setMenu] = useState<'user' | 'bell' | 'help' | null>(null)
  const audit = useLedger((l) => l.audit)
  const { pathname } = useLocation()
  useEffect(() => setMenu(null), [pathname])
  return (
    <header className={s.top}>
      <Link to="/" className={s.brand} aria-label="Datum home"><img src="/datum-icon.png" alt="" />Datum</Link>
      {config.tenantLabel && <span className={s.tenant} data-testid="tenant-badge">{config.tenantLabel}</span>}
      <span className="right row">
        <Button size="sm" onClick={onFeedback}><MessageSquare size={14} aria-hidden />Feedback</Button>
        <span className={s.menuWrap}>
          <IconButton label="Help" onClick={() => setMenu(menu === 'help' ? null : 'help')}><CircleHelp size={16} /></IconButton>
          {menu === 'help' && <div className={s.pop} role="dialog" aria-label="Help"><b>Prototype help</b><span className="secondary">Everything here runs on fake data. Simulated parts are listed at <Link to="/dev/stubs">/dev/stubs</Link>; add <span className="data">?showStubs=1</span> to outline them.</span></div>}
        </span>
        <span className={s.menuWrap}>
          <IconButton label="Notifications" onClick={() => setMenu(menu === 'bell' ? null : 'bell')}><Bell size={16} /></IconButton>
          {menu === 'bell' && (
            <div className={s.pop} role="dialog" aria-label="Notifications"><b>Notifications</b>
              {audit.length ? audit.slice(0, 5).map((e) => <AuditEntryRow key={e.id} entry={e} />) : <span className="muted">Nothing new. Notifications have no service behind them in the prototype.</span>}
            </div>)}
        </span>
        <span className={s.menuWrap}>
          <Button size="sm" ghost onClick={() => setMenu(menu === 'user' ? null : 'user')} aria-label="Account menu" aria-expanded={menu === 'user'} style={{ padding: 0 }}><span className={s.avatar}>{config.currentUser.initials}</span></Button>
          {menu === 'user' && (
            <div className={s.pop} role="menu" aria-label="Account">
              <div className="col" style={{ gap: 0 }}><b>{config.currentUser.name}</b><span className="muted">{config.currentUser.email}</span></div>
              <Link to="/settings" className={s.item}><Settings size={14} />Settings</Link>
              <Button ghost disabled title="No authentication in the prototype" style={{ justifyContent: 'flex-start' }}><User size={14} />Log out</Button>
            </div>)}
        </span>
      </span>
    </header>
  )
}

/** App frame: top bar, breadcrumb strip, left nav, outlet, toasts, dev toolbar. */
export function AppShell() {
  const [feedback, setFeedback] = useState(false)
  return (
    <div className="app-frame">
      <TopBar onFeedback={() => setFeedback(true)} />
      <BreadcrumbStrip />
      <div className={s.body}>
        <LeftNav />
        <main className={s.main}><Outlet /></main>
      </div>
      {feedback && <FeedbackModal onClose={() => setFeedback(false)} />}
      <Toasts />
      <DevToolbar />
    </div>
  )
}
