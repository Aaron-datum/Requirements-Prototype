import Icon from './components/Icon'
import { useEffect, useState } from 'react'
import { go, back, useRoute } from './router'
import { useStore } from './store'
import { Btn, Seg, Toasts } from './components/ui'
import { SCOPE, requirements } from './data'
import Dashboard from './screens/Dashboard'
import Intake from './screens/Intake'
import AssemblyTree from './screens/AssemblyTree'
import BomReview from './screens/BomReview'
import Compare from './screens/Compare'
import CostEstimate from './screens/CostEstimate'
import Composition from './screens/Composition'
import Mapping from './screens/Mapping'
import Carryover from './screens/Carryover'
import ImpactMap from './screens/ImpactMap'
import Trace from './screens/Trace'
import TestDetail from './screens/TestDetail'
import Approve from './screens/Approve'
import Settings from './screens/Settings'
import Login from './screens/Login'
import Home from './screens/Home'
import SearchNew from './screens/SearchNew'
import SearchSource from './screens/SearchSource'
import SearchResults from './screens/SearchResults'
import Saved from './screens/Saved'
import Workflows from './screens/Workflows'
import { FeedbackModal } from './components/EntryShell'
import { MODES } from './data/search'

// The stitched workflow, in order. Sub-screens hang off a parent step in the crumb trail.
const FLOW = [
  ['/intake', 'RFQ intake'],
  ['/tree', 'Assembly tree'],
  ['/bom', 'BOM review'],
  ['/composition', 'Program composition'],
  ['/mapping', 'Requirement → test mapping'],
  ['/carryover', 'Carryover review'],
  ['/approve', 'Approve'],
]

function resolve(path) {
  const seg = path.split('/').filter(Boolean)
  const [a, b, c] = seg
  const home = ['Home', '/home']
  switch (a) {
    case 'login': return { el: <Login />, bare: true }
    case 'home': return { el: <Home />, crumbs: [['Home', '/home'], ['Launchpad']] }
    case 'search':
      if (b === 'source') return { el: <SearchSource mode={c} />, crumbs: [home, ['Search', '/search'], [MODES[c]?.label || 'Source']], nav: 'Search' }
      if (b === 'results') return { el: <SearchResults />, crumbs: [home, ['Search', '/search'], ['Results']], nav: 'Search' }
      return { el: <SearchNew />, crumbs: [home, ['New Search']], nav: 'Search' }
    case 'saved': return { el: <Saved />, crumbs: [home, ['Search', '/search'], ['Saved & recent searches']], nav: 'Search' }
    case 'workflows': return { el: <Workflows />, crumbs: [home, ['Create']], nav: 'Workflows' }
    case 'dashboard': return { el: <Dashboard />, crumbs: [home, ['My Projects']], nav: 'My Projects' }
    case 'intake': return { el: <Intake />, flow: 0, nav: 'Workflows' }
    case 'tree': return { el: <AssemblyTree />, flow: 1, nav: 'Workflows' }
    case 'bom': {
      if (b === 'compare') return { el: <Compare lineId={c} />, flow: 2, sub: 'Compare parts', nav: 'Workflows' }
      if (b === 'cost') return { el: <CostEstimate partId={c} />, flow: 2, sub: 'Cost estimate', nav: 'Workflows' }
      return { el: <BomReview />, flow: 2, nav: 'Workflows' }
    }
    case 'composition': return { el: <Composition />, flow: 3, nav: 'Workflows' }
    case 'mapping': return { el: <Mapping />, flow: 4, nav: 'Workflows' }
    case 'carryover': return { el: <Carryover />, flow: 5, nav: 'Workflows' }
    case 'impact': return { el: <ImpactMap reqId={b} />, flow: 5, sub: 'Impact map', nav: 'Workflows' }
    case 'trace': return { el: <Trace />, flow: 5, sub: 'Requirement trace', nav: 'Workflows' }
    case 'test': return { el: <TestDetail testId={b} />, flow: 5, sub: 'Test detail', nav: 'Workflows' }
    case 'approve': return { el: <Approve />, flow: 6, nav: 'Workflows' }
    case 'settings': return { el: <Settings />, crumbs: [home, ['Settings'], ['System']] }
    default: return { el: <Home />, crumbs: [['Home', '/home'], ['Launchpad']] }
  }
}

function Crumbs({ r }) {
  const items = r.crumbs || (() => {
    const it = [['Home', '/home'], ['Dashboard', '/dashboard']]
    FLOW.slice(0, r.flow + 1).forEach(([p, l]) => it.push([l, p]))
    if (r.sub) it.push([r.sub, null])
    return it
  })()
  return (
    <>
      {items.length > 2 && <button className="btn sm ghost icon" onClick={back} aria-label="Back" title="Back (browser history)"><Icon n="back" /></button>}
      {items.map(([l, p], i) => (
        <span key={i} className="row" style={{ gap: 6 }}>
          {i > 0 && <span className="sep"><Icon n="right" size={14} /></span>}
          {i === items.length - 1 ? <span className="cur">{l}</span> : p ? <a onClick={() => go(p)}>{l}</a> : <span>{l}</span>}
        </span>
      ))}
    </>
  )
}

export default function App() {
  const { path } = useRoute()
  const { state, set, dispatch } = useStore()
  const [menu, setMenu] = useState(false)
  const [feedback, setFeedback] = useState(false)
  const r = resolve(path)
  const open = requirements.filter((q) => q.flagged && !state.carry[q.req_id]).length
  const user = state.user || { name: SCOPE.user, email: SCOPE.email }
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  // ⌘K / Ctrl+K opens a new search from anywhere.
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); go('/search') } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  useEffect(() => setMenu(false), [path])

  if (r.bare) return <><div className="app">{r.el}</div><Toasts /></>
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => go('/home')}><img src="./datum-icon.png" alt="" /><span>Datum</span></div>
        <span className="tenant">Adient</span>
        <nav className="nav" aria-label="Primary">
          <button className={r.nav === 'Search' ? 'on' : ''} onClick={() => go('/search')}>Search</button>
          <button className={r.nav === 'Workflows' ? 'on' : ''} onClick={() => go('/workflows')}>Workflows</button>
          <button className={r.nav === 'My Projects' ? 'on' : ''} onClick={() => go('/dashboard')}>My Projects</button>
        </nav>
        <div className="right row" style={{ position: 'relative' }}>
          <span className="muted">{SCOPE.rfq} · {open} open</span>
          <Btn size="sm" onClick={() => setFeedback(true)}><Icon n="message" size={14} />Feedback</Btn>
          <Btn size="sm" className="ghost" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Account menu" style={{ padding: 0, gap: 4 }}>
            <span className="avatar">{initials}</span><Icon n="down" size={14} /></Btn>
          {menu && (
            <div className="pop" role="menu">
              <div className="col" style={{ gap: 0 }}><b>{user.name}</b><span className="muted small">{user.email}</span></div>
              <hr className="hr" />
              <Btn className="ghost" style={{ justifyContent: 'flex-start' }} onClick={() => go('/settings')}><Icon n="settings" />Settings</Btn>
              <div className="col"><span className="caps">Plan label</span>
                <Seg value={state.planLabel} onChange={(v) => set('planLabel', v)} options={['Test plan', 'ADV P&R']} /></div>
              <Btn className="ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { if (confirm('Reset all decisions, searches and the audit log?')) { dispatch({ type: 'reset' }); setMenu(false) } }}>Reset demo state</Btn>
              <hr className="hr" />
              <Btn className="ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { dispatch({ type: 'set', key: 'signedIn', value: false }); go('/login') }}><Icon n="logout" />Log out</Btn>
            </div>
          )}
        </div>
      </header>
      <div className="crumbbar"><Crumbs r={r} /></div>
      <main className="stage">{r.el}</main>
      <Toasts />
      {feedback && <FeedbackModal onClose={() => setFeedback(false)} page={path} />}
    </div>
  )
}
