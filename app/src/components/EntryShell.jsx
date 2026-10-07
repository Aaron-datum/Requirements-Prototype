import { useEffect, useState } from 'react'
import { go } from '../router'
import { useStore } from '../store'
import { Badge, Btn, Modal, useLocal } from './ui'
import Icon from './Icon'
import { programById, siBom, requirements } from '../data'

// Workflow catalogue shared by the sidebar, the Create card and the Workflows page.
export const WORKFLOWS = [
  { id: 'bom', name: 'BOM Creation', icon: 'grid', to: '/intake', blurb: 'RFQ package → BOM → surrogate search → requirement-to-test plan.' },
  { id: 'warranty', name: 'Warranty Analysis', icon: 'shield', blurb: 'Cross-reference warranty claims against matched parts.' },
  { id: 'replace', name: 'Part Replacement', icon: 'refresh', blurb: 'Propose drop-in replacements for obsolete or at-risk parts.' },
  { id: 'cost', name: 'Cost Roll-up', icon: 'lock', locked: true, tier: 'Scale', blurb: 'Roll vendor pricing into every match. Sort BOMs by landed cost, not just fit.', cta: 'Request access' },
  { id: 'lead', name: 'Supplier Lead Time', icon: 'clock', locked: true, tier: 'Scale', blurb: 'Pull live lead times from your ERP. Flag any match that misses your build window.', cta: 'Request access' },
  { id: 'field', name: 'Field-Failure Trends', icon: 'trend', locked: true, tier: 'Enterprise', blurb: 'Cross-reference warranty data across deployments. Spot bad batches before they ship.', cta: 'Talk to sales' },
]

const SEARCHES = [
  ['/search/source/aa', 'Assembly Search', 'box', '⌘K'], ['/search/source/pp', 'Part Search', 'box'],
  ['/search/source/pp?dup=1', 'Find Duplicates', 'copy'], ['/search/source/pp?rev=1', 'Find Revisions', 'branch'],
]

export function UnlockModal({ onClose }) {
  const { state, decide } = useStore()
  const locked = WORKFLOWS.filter((w) => w.locked)
  return (
    <Modal title="Unlock more workflows" onClose={onClose} footer={<><span className="muted grow">Pilot expires Jun 30, 2026 · admin {'aaron@datum.co'}</span><Btn onClick={onClose}>Schedule a call</Btn></>}>
      <p className="sec" style={{ marginTop: 0 }}>Your pilot includes the four search modes plus BOM, Warranty, and Part Replacement. These are wired up — an admin just needs to enable them.</p>
      <div className="col">
        {locked.map((w) => (
          <div key={w.id} className="card tight row" style={{ alignItems: 'flex-start' }}>
            <div className="grow col" style={{ gap: 2 }}><div className="row"><b>{w.name}</b><Badge tone="info">{w.tier}</Badge></div><span className="muted small">{w.blurb}</span></div>
            {state.requests[w.id] ? <Badge tone="pass">Requested</Badge>
              : <Btn size="sm" onClick={() => decide('requests', w.id, 'requested', w.cta === 'Talk to sales' ? 'Requested sales call' : 'Requested access', w.name)}>{w.cta}</Btn>}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export function FeedbackModal({ onClose, page }) {
  const { state, decide } = useStore()
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  return (
    <Modal title="Send feedback" onClose={onClose} footer={<><Btn onClick={onClose}>Cancel</Btn>
      <Btn primary disabled={!text.trim()} onClick={() => { decide('requests', 'fb-' + Date.now(), 'submitted', 'Submitted feedback ticket', text.trim().slice(0, 40)); onClose() }}>Submit ticket</Btn></>}>
      <p className="sec" style={{ marginTop: 0 }}>Report a bug, request a feature, or tell us what's slowing you down. Submissions open a Jira ticket automatically.</p>
      <div className="col">
        <label className="col" style={{ gap: 4 }}><span className="caps">What happened?</span>
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'var(--bg-card)', color: 'var(--fg-primary)', padding: 8, font: 'inherit' }} /></label>
        <label className="col" style={{ gap: 4 }}><span className="caps">Attachments</span>
          <span className="card tight sec" style={{ borderStyle: 'dashed', textAlign: 'center' }}>
            <Icon n="upload" /> Drop CAD files, screenshots, or docs — or click to browse
            <input type="file" multiple hidden onChange={(e) => setFiles([...e.target.files].map((f) => f.name))} /></span>
          {files.map((f) => <span key={f} className="mono muted">{f}</span>)}</label>
        <div className="col" style={{ gap: 2 }}><span className="caps">Auto-attached context</span>
          <span className="mono muted">user: {state.user?.email || 'aaron@datum.co'}</span><span className="mono muted">page: {page}</span><span className="mono muted">build: v1.0 · 248</span><span className="mono muted">theme: {state.theme}</span></div>
      </div>
    </Modal>
  )
}

/** Navigate sidebar + centre stage, used by Home, Search, Workflows and Saved searches. */
export default function EntryShell({ children, active, recent = false, compact = false }) {
  const { state } = useStore()
  const [pref, setCollapsed] = useLocal('entry:collapsed', false)
  const collapsed = compact ? true : pref // table-heavy pages keep the Navigate sidebar icon-only
  const [open, setOpen] = useState({ si: true })
  const [unlock, setUnlock] = useState(false)
  const saved = Object.keys(state.saved).length
  const openReq = requirements.filter((r) => r.flagged && !state.carry[r.req_id]).length
  const Item = ({ to, icon, label, hint, locked, on, onClick }) => (
    <button className={`navitem ${on ? 'on' : ''} ${locked ? 'locked' : ''}`} onClick={onClick || (() => go(to))} title={collapsed ? label : undefined}>
      <Icon n={icon} /><span className="grow">{label}</span>
      {locked && <span className="tag">LOCKED</span>}{hint && <span className="kbd">{hint}</span>}
    </button>
  )
  const projects = [
    { id: 'si', p: programById['PGM-CIV-SI'], count: 5 + siBom.length, kids: [['Saved searches', 'search', saved, '/saved'], ['Outputs', 'file', 2, '/dashboard'], ['Configurations', 'settings', 1, '/settings']], live: true },
    { id: 'lx', p: programById['PGM-CIV-LX'], count: 55, kids: [['Saved searches', 'search', 0], ['Outputs', 'file', 1]] },
    { id: 'spt', p: programById['PGM-CIV-SPT'], count: 55, kids: [['Saved searches', 'search', 0], ['Outputs', 'file', 1]] },
  ]
  return (
    <>
      <aside className={`side navside ${collapsed ? 'collapsed' : ''}`} aria-label="Navigate">
        <div className="bd" style={{ gap: 4 }}>
          {!collapsed && <span className="caps navcap">Search</span>}
          {SEARCHES.map(([to, label, icon, hint]) => <Item key={label} to={to} icon={icon} label={label} hint={!collapsed && hint} on={active === label} />)}
          {!collapsed && <span className="caps navcap">Workflows</span>}
          {WORKFLOWS.map((w) => w.locked
            ? <Item key={w.id} icon={w.icon} label={w.name} locked={!collapsed} onClick={() => setUnlock(true)} />
            : <Item key={w.id} icon={w.icon} label={w.name} to={w.to || '/workflows?w=' + w.id} on={active === w.name} />)}
          {!collapsed && <div className="row navcap"><span className="caps grow">My Projects</span></div>}
          {!collapsed && projects.map((pr) => (
            <div key={pr.id}>
              <button className="navitem" onClick={() => { setOpen({ ...open, [pr.id]: !open[pr.id] }) }}>
                <Icon n={open[pr.id] ? 'down' : 'right'} size={14} /><Icon n="folder" />
                <span className="grow trunc" title={pr.p.name}>{pr.p.name}</span><span className="count">{pr.count}</span>
              </button>
              {open[pr.id] && pr.kids.map(([l, ic, n, to]) => (
                <button key={l} className="navitem kid" disabled={!to} onClick={() => to && go(to)} title={to ? undefined : 'In production — surrogate source'}>
                  <Icon n={ic} size={14} /><span className="grow">{l}</span><span className="count">{n}</span></button>))}
              {open[pr.id] && pr.live && <button className="navitem kid" onClick={() => go('/dashboard')}><Icon n="out" size={14} /><span className="grow">Open project overview</span><span className="count">{openReq} open</span></button>}
            </div>
          ))}
        </div>
        <div className="ft col" style={{ gap: 4 }}>
          <Item to="/settings" icon="settings" label="Settings" on={active === 'Settings'} />
          <Btn size="sm" className="ghost" disabled={compact} onClick={() => setCollapsed(!pref)}><Icon n={collapsed ? 'right' : 'left'} />{!collapsed && 'Collapse'}</Btn>
        </div>
      </aside>
      <div className="fill" style={{ minWidth: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
        {recent && <RecentStrip />}
      </div>
      {unlock && <UnlockModal onClose={() => setUnlock(false)} />}
    </>
  )
}

export function RecentStrip() {
  const { state } = useStore()
  const [open, setOpen] = useLocal('entry:recent', true)
  const items = Object.values(state.recent).sort((a, b) => b.ts.localeCompare(a.ts))
  const ago = (ts) => { const m = Math.round((Date.now() - new Date(ts)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago` }
  return (
    <div className={`drawer recentdrawer ${open && items.length ? '' : 'closed'}`} style={open && items.length ? { height: 'auto', flexBasis: 'auto' } : undefined}>
      <div className="row" style={{ padding: '0 16px', height: 'var(--drawer-handle-height)', flex: '0 0 auto' }}>
        <Icon n="clock" /><span className="caps">Recent (this session)</span><Badge tone="info">{items.length} in this session</Badge>
        <a className="right small" onClick={() => go('/saved?tab=recent')}>View all in Recent searches <Icon n="out" size={12} /></a>
        <Btn size="sm" className="ghost icon" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse recent' : 'Expand recent'}><Icon n={open ? 'down' : 'up'} /></Btn>
      </div>
      {open && items.length > 0 && (
        <div className="chain" style={{ paddingTop: 0 }}>
          {items.slice(0, 6).map((r) => (
            <button key={r.key} className="hop recentcard" onClick={() => go(r.href)}>
              <span className="row"><Icon n="search" size={14} /><b className="trunc">{r.title}</b></span>
              <span className="row" style={{ gap: 24, marginTop: 8 }}>
                <span className="col" style={{ gap: 0 }}><span className="caps">Requirements</span><span className="stat" style={{ fontSize: 18 }}>{r.requirements}</span></span>
                <span className="col" style={{ gap: 0 }}><span className="caps">Results</span><span className="stat" style={{ fontSize: 18 }}>{r.results}</span></span></span>
              <span className="mono muted" style={{ marginTop: 8 }}>Last run · {ago(r.ts)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
