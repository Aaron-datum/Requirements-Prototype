import Icon from './components/Icon'
import { useState } from 'react'
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
  switch (a) {
    case 'dashboard': return { el: <Dashboard />, crumbs: [['Dashboard']], nav: 'My Projects' }
    case 'intake': return { el: <Intake />, flow: 0 }
    case 'tree': return { el: <AssemblyTree />, flow: 1 }
    case 'bom': {
      if (b === 'compare') return { el: <Compare lineId={c} />, flow: 2, sub: 'Compare parts' }
      if (b === 'cost') return { el: <CostEstimate partId={c} />, flow: 2, sub: 'Cost estimate' }
      return { el: <BomReview />, flow: 2 }
    }
    case 'composition': return { el: <Composition />, flow: 3 }
    case 'mapping': return { el: <Mapping />, flow: 4 }
    case 'carryover': return { el: <Carryover />, flow: 5 }
    case 'impact': return { el: <ImpactMap reqId={b} />, flow: 5, sub: 'Impact map' }
    case 'trace': return { el: <Trace />, flow: 5, sub: 'Requirement trace' }
    case 'test': return { el: <TestDetail testId={b} />, flow: 5, sub: 'Test detail' }
    case 'approve': return { el: <Approve />, flow: 6 }
    default: return { el: <Dashboard />, crumbs: [['Dashboard']], nav: 'My Projects' }
  }
}

function Crumbs({ r }) {
  if (r.crumbs) return <>{r.crumbs.map(([l], i) => <span key={i} className="cur">{l}</span>)}</>
  const items = [['Dashboard', '/dashboard']]
  FLOW.slice(0, r.flow + 1).forEach(([p, l]) => items.push([l, p]))
  if (r.sub) items.push([r.sub, null])
  return (
    <>
      <button className="btn sm ghost icon" onClick={back} aria-label="Back" title="Back (browser history)"><Icon n="back" /></button>
      {items.map(([l, p], i) => {
        const last = i === items.length - 1
        const stale = !last && i < items.length - 1 && i > 0 && false
        return (
          <span key={i} className="row" style={{ gap: 6 }}>
            {i > 0 && <span className="sep"><Icon n="right" size={14} /></span>}
            {last ? <span className="cur">{l}</span> : <a className={stale ? 'stale' : ''} onClick={() => go(p)}>{l}</a>}
          </span>
        )
      })}
    </>
  )
}

export default function App() {
  const { path } = useRoute()
  const { state, set, dispatch } = useStore()
  const [menu, setMenu] = useState(false)
  const r = resolve(path)
  const open = requirements.filter((q) => q.flagged && !state.carry[q.req_id]).length

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => go('/dashboard')}><img src="./datum-icon.png" alt="" /><span>Datum</span></div>
        <span className="tenant">Adient</span>
        <nav className="nav" aria-label="Primary">
          <button>Search</button>
          <button>Create</button>
          <button className="on" onClick={() => go('/dashboard')}>My Projects</button>
        </nav>
        <div className="right row" style={{ position: 'relative' }}>
          <span className="muted">{SCOPE.rfq} · {open} open</span>
          <Btn size="sm" onClick={() => setMenu(!menu)} aria-expanded={menu}>{SCOPE.user}<Icon n="down" size={14} /></Btn>
          {menu && (
            <div className="pop" role="menu">
              <div className="col"><span className="caps">Theme</span>
                <Seg value={state.theme} onChange={(v) => set('theme', v)} options={[['white', 'White'], ['tan', 'Tan'], ['dark', 'Dark']]} /></div>
              <div className="col"><span className="caps">Plan label</span>
                <Seg value={state.planLabel} onChange={(v) => set('planLabel', v)} options={['Test plan', 'ADV P&R']} /></div>
              <hr className="hr" />
              <Btn onClick={() => { if (confirm('Reset all decisions and the audit log?')) { dispatch({ type: 'reset' }); setMenu(false) } }}>Reset demo state</Btn>
            </div>
          )}
        </div>
      </header>
      <div className="crumbbar"><Crumbs r={r} /></div>
      <main className="stage">{r.el}</main>
      <Toasts />
    </div>
  )
}
