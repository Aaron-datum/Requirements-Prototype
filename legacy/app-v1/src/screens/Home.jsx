import { useEffect, useRef, useState } from 'react'
import { go } from '../router'
import { useStore } from '../store'
import EntryShell, { WORKFLOWS } from '../components/EntryShell'
import Icon from '../components/Icon'
import { searchHref } from '../data/search'

export default function Home() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const ref = useRef()
  const saved = Object.values(state.saved)
  const projects = new Set(saved.map((s) => s.project)).size
  const now = new Date()
  const first = (state.user?.name || 'Aaron').split(' ')[0]
  useEffect(() => { ref.current?.focus() }, [])
  const run = (e) => { e.preventDefault(); if (q.trim()) go(searchHref({ mode: 'text', q: q.trim() })) }
  const last = Object.values(state.recent).sort((a, b) => b.ts.localeCompare(a.ts))[0]
  return (
    <EntryShell active="Assembly Search" recent>
      <div className="launch">
        <div className="hero">
          <img src="./datum-logo-full-transparent.png" alt="Datum" />
          <span className="sec">Welcome back, <b style={{ color: 'var(--fg-primary)', fontWeight: 500 }}>{first}</b> <span className="mono muted">· {now.toLocaleDateString([], { weekday: 'short' })} · {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></span>
        </div>
        <form className="bigsearch" onSubmit={run} role="search">
          <Icon n="search" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Describe a part, paste a spec, or search saved work…" aria-label="Search" />
          <span className="navitem kbd" style={{ width: 'auto', minHeight: 0, padding: 0 }}>⌘K</span>
        </form>
        <div className="lcards">
          <button className="lcard primary" onClick={() => go('/search')}>
            <span className="ico"><Icon n="box" size={18} /></span><span className="t">3D Search</span>
            <span>Upload CAD files and match parts to your tolerance windows.</span>
            <span className="foot"><span className="grow">STEP · SLDPRT · IGES · PRT</span><Icon n="out" size={14} /></span>
          </button>
          <button className="lcard" onClick={() => go('/workflows')}>
            <span className="ico"><Icon n="grid" size={18} /></span><span className="t">Create</span>
            <span>Run a workflow to produce an analytic output — BOM, warranty report, or replacement list.</span>
            <span className="foot"><span className="grow">{WORKFLOWS.filter((w) => !w.locked).length} workflows · BOM, Warranty, Part Replacement</span><Icon n="out" size={14} /></span>
          </button>
          <button className="lcard" disabled={!saved.length} onClick={() => go('/saved')}>
            <span className="ico"><Icon n="bookmark" size={18} /></span><span className="t">Saved searches</span>
            <span>{saved.length ? saved.slice(0, 2).map((s) => s.title).join(' · ') : 'No saved searches yet. Pin a search to a project to find it here later.'}</span>
            <span className="foot"><span className="grow">{saved.length ? `${saved.length} across ${projects} project${projects > 1 ? 's' : ''}` : 'no saved searches'}</span><Icon n="out" size={14} /></span>
          </button>
        </div>
        {last && <button className="linkbtn" style={{ textAlign: 'center' }} onClick={() => go(last.href)}>Resume “{last.title}”</button>}
      </div>
    </EntryShell>
  )
}
