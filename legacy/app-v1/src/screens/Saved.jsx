import { useState } from 'react'
import { go, useRoute } from '../router'
import { useStore } from '../store'
import EntryShell from '../components/EntryShell'
import { Badge, Btn, PageHead, Tabs } from '../components/ui'
import Icon from '../components/Icon'
import { MODES } from '../data/search'

export default function Saved() {
  const { query } = useRoute()
  const { state, decide } = useStore()
  const [tab, setTab] = useState(query.tab === 'recent' ? 'Recent' : 'Saved')
  const list = Object.values(tab === 'Saved' ? state.saved : state.recent).sort((a, b) => b.ts.localeCompare(a.ts))
  return (
    <EntryShell active="Saved searches">
      <div className="page" style={{ maxWidth: 1000 }}>
        <PageHead title="Searches" sub="Saved searches are pinned to a project. Recent searches last for this session." />
        <Tabs value={tab} tabs={['Saved', 'Recent']} onChange={setTab} />
        {list.length === 0 ? (
          <div className="card empty col" style={{ alignItems: 'center' }}>
            <b>{tab === 'Saved' ? 'No saved searches yet' : 'No recent searches yet'}</b>
            <span>{tab === 'Saved' ? 'Run a search and choose Save search to pin it to a project.' : 'Run your first search to start a project. Recent activity appears here for the rest of this session.'}</span>
            <Btn primary onClick={() => go('/search')}>Start a search</Btn>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="tbl"><thead><tr><th>Search</th><th>Type</th><th className="num">Requirements</th><th className="num">Results</th>{tab === 'Saved' && <th>Project</th>}<th>Last run</th><th /></tr></thead><tbody>
              {list.map((s) => (
                <tr key={s.key} className="rowhover" onClick={() => go(s.href)}>
                  <td><span className="row"><Icon n="search" size={14} />{s.title}</span></td><td><Badge tone="outline">{MODES[s.mode]?.label}</Badge></td>
                  <td className="num">{s.requirements}</td><td className="num">{s.results}</td>{tab === 'Saved' && <td>{s.project}</td>}
                  <td className="mono muted">{new Date(s.ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <span className="row" style={{ justifyContent: 'center' }}><Btn size="sm" onClick={() => go(s.href)}><Icon n="play" size={12} />Run again</Btn>
                      {tab === 'Saved' ? <Btn size="sm" className="ghost icon" aria-label={`Delete ${s.title}`} onClick={() => decide('saved', s.key, undefined, 'Removed saved search', s.title)}><Icon n="trash" /></Btn>
                        : !state.saved[s.key] && <Btn size="sm" onClick={() => decide('saved', s.key, { ...s, project: 'Civic Si 1.5T' }, 'Saved search', s.title)}>Save</Btn>}</span></td>
                </tr>))}
            </tbody></table>
          </div>
        )}
      </div>
    </EntryShell>
  )
}
