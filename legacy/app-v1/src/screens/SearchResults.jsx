import { useEffect, useMemo, useState } from 'react'
import { go, useRoute } from '../router'
import { useStore } from '../store'
import EntryShell from '../components/EntryShell'
import TableShell from '../components/TableShell'
import { Badge, Btn, Certainty, KV, Meter } from '../components/ui'
import Icon from '../components/Icon'
import { CRITERIA, MODES, assemblyLabel, runSearch, searchHref, searchTitle } from '../data/search'
import { money, progShort, siBomByPart, programById } from '../data'

const family = (id) => id.replace(/-[A-Z]$/, '')
const MatchCell = ({ v }) => <span className="row" style={{ gap: 8, justifyContent: 'flex-end' }}><Meter pct={v} /><span className="num" style={{ width: 40 }}>{v}%</span></span>

export default function SearchResults() {
  const { query } = useRoute()
  const { state, decide } = useStore()
  const mode = query.mode || 'text'
  const crit = (query.crit || '').split(',').filter(Boolean)
  const spec = { mode, src: query.src, q: query.q, crit }
  const href = searchHref(spec) + (query.min ? `&min=${query.min}` : '') + (query.fam ? '&fam=1' : '')
  const [sel, setSel] = useState(null)

  const res = useMemo(() => {
    const r = runSearch(spec)
    let rows = r.rows
    if (query.min) rows = rows.filter((x) => x.total >= +query.min)
    if (query.fam && r.query) rows = rows.filter((x) => family(x.part.part_id) === family(r.query.part_id))
    return { ...r, rows }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href])
  const title = (query.min ? 'Duplicates of ' : query.fam ? 'Revisions of ' : '') + searchTitle(spec).replace(/^Similar to /, query.min || query.fam ? '' : 'Similar to ')
  const entry = { key: href, title, mode, href, requirements: res.crit.length, results: res.rows.length, ts: new Date().toISOString() }

  // Every executed search lands in Recent (this session) — silent: it isn't a decision.
  useEffect(() => { decide('recent', href, entry, '', '', { silent: true }) }, [href]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setSel(null), [href])
  const saved = state.saved[href]

  const partCols = useMemo(() => [
    { key: 'name', label: 'Part', group: 'Identity', pinned: true, type: 'text', get: (r) => r.part.name + ' ' + r.part.part_id, render: (r) => <div><div>{r.part.name}</div><div className="mono muted">{r.part.part_id}</div></div> },
    { key: 'match', label: 'Match %', group: 'Similarity', type: 'range', align: 'right', get: (r) => r.total, render: (r) => <MatchCell v={r.total} /> },
    ...(mode !== 'text' ? CRITERIA.map(([k, l]) => ({ key: k, label: l, group: 'Similarity', type: 'range', align: 'right', visible: false, get: (r) => r[k], render: (r) => <span className="num">{r[k]}</span> })) : []),
    { key: 'subsystem', label: 'Subsystem', group: 'Identity', type: 'enum', get: (r) => r.part.subsystem },
    { key: 'parent', label: 'Parent assembly', group: 'Identity', type: 'enum', visible: mode === 'ps', get: (r) => [...new Set(r.parents.map((u) => `${u.subassembly} · ${progShort(u.program_id)}`))].join(', ') },
    { key: 'used', label: 'Used on', group: 'Sourcing', type: 'enum', get: (r) => r.programs.join(' · ') },
    { key: 'material', label: 'Material', group: 'Manufacture', type: 'enum', visible: false, get: (r) => r.part.material },
    { key: 'process', label: 'Process', group: 'Manufacture', type: 'enum', visible: false, get: (r) => r.part.manufacture_method },
    { key: 'complexity', label: 'Complexity', group: 'Manufacture', type: 'enum', visible: false, get: (r) => r.part.complexity },
    { key: 'price', label: 'Base price', group: 'Cost', type: 'range', align: 'right', get: (r) => r.part.base_price_usd, render: (r) => <span className="num">{money(r.part.base_price_usd)}</span> },
    { key: 'inbom', label: 'In Si BOM', group: 'Sourcing', type: 'enum', get: (r) => (r.inBom ? 'Yes' : 'No') },
  ], [mode])
  const assyCols = useMemo(() => [
    { key: 'name', label: 'Assembly', group: 'Identity', pinned: true, type: 'text', get: (r) => assemblyLabel(r.assembly), render: (r) => <div><div>{r.assembly.subassembly}</div><div className="muted small">{programById[r.assembly.program_id].name}</div></div> },
    { key: 'match', label: 'Match %', group: 'Similarity', type: 'range', align: 'right', get: (r) => r.total, render: (r) => <MatchCell v={r.total} /> },
    { key: 'program', label: 'Program', group: 'Identity', type: 'enum', get: (r) => progShort(r.assembly.program_id) },
    { key: 'matched', label: 'Matching parts', group: 'Similarity', type: 'range', align: 'right', get: (r) => r.matched, render: (r) => <span className="num">{r.matched} of {r.parts}</span> },
    { key: 'best', label: 'Best match', group: 'Similarity', type: 'text', get: (r) => (r.best ? r.best.name : '—'), render: (r) => (r.best ? <span>{r.best.name} <span className="mono muted">{r.best.part_id}</span></span> : <span className="muted">—</span>) },
    { key: 'exact', label: 'Uses this part', group: 'Similarity', type: 'enum', visible: mode === 'pa', get: (r) => (r.exact ? 'Yes' : 'No') },
    { key: 'parts', label: 'Parts', group: 'Identity', type: 'range', align: 'right', visible: false, get: (r) => r.parts, render: (r) => <span className="num">{r.parts}</span> },
  ], [mode])
  const isAssy = res.kind === 'assembly'
  const row = res.rows.find((r) => r.id === sel)
  const projectName = programById['PGM-CIV-SI'].name

  return (
    <EntryShell compact active={mode === 'aa' ? 'Assembly Search' : 'Part Search'}>
      <div className="fill" style={{ height: '100%' }}>
        <div className="row wrap" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-sidebar)' }}>
          <Icon n="search" /><b>{title}</b><Badge tone="info">{MODES[mode]?.label}</Badge>
          <span className="muted small">source {res.source}</span>
          <span className="mono muted">{res.crit.length} requirements · {res.rows.length} results</span>
          <span className="right row">
            <Btn size="sm" onClick={() => go('/search/source/' + (mode === 'text' ? 'pp' : mode) + (query.min ? '?dup=1' : query.fam ? '?rev=1' : ''))}>Edit search</Btn>
            {saved ? <Btn size="sm" onClick={() => decide('saved', href, undefined, 'Removed saved search', title)}><Icon n="bookmark" size={14} />Saved · Undo</Btn>
              : <Btn size="sm" primary onClick={() => decide('saved', href, { ...entry, project: projectName }, 'Saved search', `${title} → ${projectName}`)}><Icon n="bookmark" size={14} />Save search</Btn>}
          </span>
        </div>
        {mode === 'text' && Object.values(state.saved).filter((s) => s.title.toLowerCase().includes((query.q || '').toLowerCase())).length > 0 && (
          <div className="banner" style={{ margin: 12 }}>Saved searches matching “{query.q}”: {Object.values(state.saved).filter((s) => s.title.toLowerCase().includes(query.q.toLowerCase())).map((s) => <a key={s.key} onClick={() => go(s.href)} style={{ marginRight: 8 }}>{s.title}</a>)}</div>)}
        <div className="stage" style={{ minHeight: 0 }}>
          <TableShell id={'search-' + res.kind + '-' + mode} columns={isAssy ? assyCols : partCols} rows={res.rows} rowId={(r) => r.id} selectedId={sel} onSelect={setSel}
            empty={query.min ? `No duplicates found — nothing else in the catalog matches at ${query.min}% or better on the selected criteria. Try another source part.` : query.fam ? 'No other revisions of this part family exist.' : `No ${MODES[mode]?.result || 'results'} found. Loosen the match criteria or try another source.`}
            card={isAssy ? undefined : (r) => ({ img: `./cad-preview-${r.part.part_id.charCodeAt(r.part.part_id.length - 1) % 2 ? 2 : 4}.png`, title: r.part.name, sub: r.part.part_id, meta: r.total + '%', badge: <Badge tone={r.total >= 80 ? 'pass' : r.total >= 60 ? 'info' : 'warn'}>{r.total}%</Badge> })} />
          {row && (
            <aside className="panel" aria-label="Result detail">
              <div className="hd"><div className="grow"><div className="h3">{isAssy ? row.assembly.subassembly : row.part.name}</div><div className="mono muted">{isAssy ? programById[row.assembly.program_id].name : row.part.part_id}</div></div>
                <Badge tone={row.total >= 80 ? 'pass' : row.total >= 60 ? 'info' : 'warn'}>{row.total}% match</Badge>
                <Btn size="sm" className="ghost icon" onClick={() => setSel(null)} aria-label="Close panel"><Icon n="x" /></Btn></div>
              <div className="bd">
                {!isAssy && mode !== 'text' && (
                  <div className="col"><span className="caps">Similarity to the source</span>
                    {CRITERIA.map(([k, l]) => <div key={k} className="row" style={{ opacity: res.crit.includes(k) ? 1 : 0.45 }}><span style={{ width: 160 }}>{l}</span><Meter pct={row[k]} /><span className="mono" style={{ width: 34, textAlign: 'right' }}>{row[k]}</span></div>)}
                    <span className="muted small">Greyed components are excluded from the match criteria.</span></div>)}
                {!isAssy && <KV rows={[['Subsystem', row.part.subsystem], ['Material', row.part.material], ['Process', row.part.manufacture_method], ['Complexity', row.part.complexity], ['Weight', row.part.weight_kg + ' kg'], ['Base price', money(row.part.base_price_usd)], ['Used on', row.programs.join(' · ')], ['Parent assembly', [...new Set(row.parents.map((u) => `${u.subassembly} · ${progShort(u.program_id)}`))].join(', ')]]} />}
                {isAssy && (<>
                  <KV rows={[['Program', programById[row.assembly.program_id].name], ['Matching parts', `${row.matched} of ${row.parts}`], ['Best match', row.best ? `${row.best.name} · ${row.best.part_id}` : '—'], ['Uses this part', mode === 'pa' ? (row.exact ? 'Yes' : 'No') : '—']]} />
                  <div className="col"><span className="caps">Parts in this assembly</span>
                    {row.assembly.parts.map((p) => <div key={p.part_id} className="row"><span className="grow trunc">{p.name}</span><span className="mono muted">{p.part_id}</span></div>)}</div></>)}
                <div className="row wrap">
                  {!isAssy && siBomByPart[row.part.part_id] && <><Certainty v={siBomByPart[row.part.part_id].certainty} /><Btn primary onClick={() => go('/bom?line=' + siBomByPart[row.part.part_id].bom_line_id)}>Open BOM line</Btn></>}
                  {!isAssy && !siBomByPart[row.part.part_id] && <span className="muted small">Not on the Civic Si BOM — it is production evidence from another program.</span>}
                  {isAssy && row.assembly.program_id === 'PGM-CIV-SI' && <Btn primary onClick={() => go('/bom')}>Open BOM review</Btn>}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </EntryShell>
  )
}
