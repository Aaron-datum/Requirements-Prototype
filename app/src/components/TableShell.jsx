import Icon from './Icon'
import { Fragment, useMemo, useState } from 'react'
import { useStore } from '../store'
import { Btn, Modal, Seg, Tabs, useLocal } from './ui'

/**
 * Shared table shell — one component for the BOM table, the requirement trace table (and any future table).
 *   left sidebar: Filters · Columns · Manage          center: pills + table (optionally subfoldered)
 * Standing rules (prototype-v2-consolidated-design-brief §0):
 *   - adding a column (Manage → Add / Remove Columns) adds its filter, even if the column is then hidden
 *   - removing a column removes its filter unless that filter is actively applied
 *   - toggling visibility (Columns tab) never touches Filters
 *
 * column: { key, label, group, get(row), render?(row), type: 'enum'|'text'|'range'|'none', visible?, pinned?, align? }
 */
export default function TableShell({
  id, columns, rows, rowId, selectedId, onSelect, rowClass, groupOptions = [], folderMeta, toolbar, empty = 'No rows match these filters.', defaultGroup,
}) {
  const { state, dispatch } = useStore()
  const [tab, setTab] = useLocal(id + ':tab', 'Filters')
  const [collapsed, setCollapsed] = useLocal(id + ':collapsed', false)
  const [fieldSet, setFieldSet] = useLocal(id + ':fields', columns.map((c) => c.key))
  const [visible, setVisible] = useLocal(id + ':visible', columns.filter((c) => c.visible !== false).map((c) => c.key))
  const [filters, setFilters] = useLocal(id + ':filters', {})
  const [density, setDensity] = useLocal(id + ':density', 'default')
  const [group, setGroup] = useLocal(id + ':group', defaultGroup ?? (groupOptions[0]?.key || 'none'))
  const [sort, setSort] = useLocal(id + ':sort', null)
  const [closed, setClosed] = useState({})
  const [colModal, setColModal] = useState(false)
  const [draft, setDraft] = useState([])
  const [viewName, setViewName] = useState('')

  const col = (k) => columns.find((c) => c.key === k)
  // a filter exists for every column in the field set (shown or hidden) + any actively applied one
  const filterKeys = columns.filter((c) => c.type !== 'none' && (fieldSet.includes(c.key) || isActive(filters[c.key]))).map((c) => c.key)
  const visCols = columns.filter((c) => fieldSet.includes(c.key) && (visible.includes(c.key) || c.pinned))

  function isActive(v) {
    if (v == null) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') return v.min !== '' && v.min != null || v.max !== '' && v.max != null
    return String(v).length > 0
  }
  function passes(row) {
    return filterKeys.every((k) => {
      const f = filters[k], c = col(k)
      if (!isActive(f)) return true
      const val = c.get(row)
      if (c.type === 'enum') return f.includes(String(val))
      if (c.type === 'text') return String(val ?? '').toLowerCase().includes(f.toLowerCase())
      if (c.type === 'range') {
        const n = Number(val)
        if (val == null || Number.isNaN(n)) return false
        return (f.min === '' || f.min == null || n >= +f.min) && (f.max === '' || f.max == null || n <= +f.max)
      }
      return true
    })
  }
  const shown = useMemo(() => {
    let r = rows.filter(passes)
    if (sort) {
      const c = col(sort.key)
      r = [...r].sort((a, b) => {
        const x = c.get(a), y = c.get(b)
        const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''))
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, filters, sort, fieldSet])

  const activeKeys = filterKeys.filter((k) => isActive(filters[k]))
  const setF = (k, v) => setFilters({ ...filters, [k]: v })
  const pills = activeKeys.flatMap((k) => {
    const f = filters[k], c = col(k)
    if (Array.isArray(f)) return f.map((v) => ({ k, label: `${c.label}: ${v}`, clear: () => setF(k, f.filter((x) => x !== v)) }))
    if (typeof f === 'object') return [{ k, label: `${c.label}: ${f.min || '…'}–${f.max || '…'}`, clear: () => setF(k, {}) }]
    return [{ k, label: `${c.label}: “${f}”`, clear: () => setF(k, '') }]
  })

  function openColModal() { setDraft(fieldSet); setColModal(true) }
  function applyCols() {
    const added = draft.filter((k) => !fieldSet.includes(k))
    const removed = fieldSet.filter((k) => !draft.includes(k))
    setFieldSet(draft)
    setVisible([...new Set([...visible.filter((k) => draft.includes(k)), ...added])])
    // removed columns drop their (inactive) filter; active ones stay, flagged in the sidebar
    const nf = { ...filters }
    removed.forEach((k) => { if (!isActive(nf[k])) delete nf[k] })
    setFilters(nf)
    setColModal(false)
  }

  const groups = group !== 'none' && groupOptions.find((g) => g.key === group)
  const folders = useMemo(() => {
    if (!groups) return [{ name: null, rows: shown }]
    const m = new Map()
    shown.forEach((r) => { const n = groups.get(r); if (!m.has(n)) m.set(n, []); m.get(n).push(r) })
    return [...m].map(([name, rs]) => ({ name, rows: rs }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, group])

  const views = state.views[id] || []
  const saveView = () => {
    const name = viewName.trim() || `View ${views.length + 1}`
    dispatch({ type: 'saveView', table: id, view: { name, note: `${visible.length} cols · ${activeKeys.length} filters`, fieldSet, visible, filters, density, group } })
    setViewName('')
  }
  const loadView = (v) => { setFieldSet(v.fieldSet); setVisible(v.visible); setFilters(v.filters); setDensity(v.density); setGroup(v.group) }

  const optionsFor = (c) => {
    const m = new Map()
    rows.forEach((r) => { const v = String(c.get(r) ?? '—'); m.set(v, (m.get(v) || 0) + 1) })
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }
  const colGroups = [...new Set(columns.map((c) => c.group || 'Other'))]

  return (
    <>
      {collapsed ? (
        <aside className="side collapsed" aria-label="Table sidebar (collapsed)">
          <div className="bd" style={{ alignItems: 'center' }}>
            <Btn size="sm" className="icon" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"><Icon n="dright" /></Btn>
            {activeKeys.length > 0 && <span className="badge b-info">{activeKeys.length}</span>}
          </div>
        </aside>
      ) : (
        <aside className="side" aria-label="Table sidebar">
          <div className="hd">
            <Tabs value={tab} tabs={['Filters', 'Columns', 'Manage']} onChange={setTab} />
          </div>
          <div className="bd">
            {tab === 'Filters' && (
              <>
                <div className="row">
                  <span className="caps">Filters</span>
                  {activeKeys.length > 0 && <span className="badge b-info">{activeKeys.length} active</span>}
                  <button className="linkbtn right" onClick={() => setFilters({})} disabled={!activeKeys.length}>Clear all</button>
                </div>
                {filterKeys.map((k) => {
                  const c = col(k)
                  const f = filters[k]
                  return (
                    <div className="fgroup" key={k}>
                      <div className="row">
                        <span className="h3">{c.label}</span>
                        {!fieldSet.includes(k) && <span className="muted" style={{ fontSize: 13 }}>column removed · filter active</span>}
                        {isActive(f) && <button className="linkbtn right" onClick={() => setF(k, c.type === 'enum' ? [] : c.type === 'range' ? {} : '')}>Clear</button>}
                      </div>
                      {c.type === 'enum' && (() => {
                        const opts = optionsFor(c)
                        return opts.map(([v, n]) => (
                          <label className="opt" key={v}>
                            <input type="checkbox" checked={(f || []).includes(v)} onChange={(e) => setF(k, e.target.checked ? [...(f || []), v] : (f || []).filter((x) => x !== v))} />
                            <span className="grow trunc">{v}</span><span className="muted mono">{n}</span>
                          </label>
                        ))
                      })()}
                      {c.type === 'text' && <input type="search" placeholder={`Search ${c.label.toLowerCase()}…`} value={f || ''} onChange={(e) => setF(k, e.target.value)} />}
                      {c.type === 'range' && (
                        <div className="row">
                          <input type="text" inputMode="numeric" placeholder="min" style={{ width: 80 }} value={f?.min ?? ''} onChange={(e) => setF(k, { ...f, min: e.target.value })} />
                          <span className="muted">–</span>
                          <input type="text" inputMode="numeric" placeholder="max" style={{ width: 80 }} value={f?.max ?? ''} onChange={(e) => setF(k, { ...f, max: e.target.value })} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
            {tab === 'Columns' && (
              <>
                <div className="row">
                  <span className="caps">Columns</span>
                  <button className="linkbtn right" onClick={() => setVisible(fieldSet)}>Show all</button>
                  <button className="linkbtn" onClick={() => setVisible(columns.filter((c) => c.pinned).map((c) => c.key))}>Hide all</button>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>Hiding a column here keeps its filter. Use Manage to add or remove columns.</div>
                {colGroups.map((g) => (
                  <div className="fgroup" key={g}>
                    <span className="caps">{g}</span>
                    {columns.filter((c) => (c.group || 'Other') === g && fieldSet.includes(c.key)).map((c) => (
                      <label className="opt" key={c.key}>
                        <input type="checkbox" checked={c.pinned || visible.includes(c.key)} disabled={c.pinned}
                          onChange={(e) => setVisible(e.target.checked ? [...visible, c.key] : visible.filter((x) => x !== c.key))} />
                        <span className="grow">{c.label}</span>
                        {c.pinned && <span className="muted" style={{ fontSize: 13 }}>pinned</span>}
                      </label>
                    ))}
                  </div>
                ))}
              </>
            )}
            {tab === 'Manage' && (
              <>
                <div className="fgroup">
                  <span className="caps">Row density</span>
                  <Seg value={density} onChange={setDensity} options={[['compact', 'Compact'], ['default', 'Default'], ['comfy', 'Comfy']]} />
                </div>
                {groupOptions.length > 0 && (
                  <div className="fgroup">
                    <span className="caps">Group into subfolders</span>
                    <Seg value={group} onChange={setGroup} options={[...groupOptions.map((g) => [g.key, g.label]), ['none', 'None']]} />
                  </div>
                )}
                <div className="fgroup">
                  <span className="caps">Columns</span>
                  <Btn onClick={openColModal}>Add / Remove Columns</Btn>
                  <span className="muted" style={{ fontSize: 13 }}>Adding a column adds its filter — even if the column stays hidden.</span>
                </div>
                <div className="fgroup">
                  <span className="caps">Saved views</span>
                  {views.map((v) => (
                    <button key={v.name} className="btn" style={{ justifyContent: 'space-between' }} onClick={() => loadView(v)}>
                      <span>{v.name}</span><span className="muted" style={{ fontWeight: 400 }}>{v.note}</span>
                    </button>
                  ))}
                  <div className="row"><input type="text" className="grow" placeholder="View name" value={viewName} onChange={(e) => setViewName(e.target.value)} /><Btn onClick={saveView}>Save Current View</Btn></div>
                </div>
              </>
            )}
          </div>
          <div className="ft"><Btn size="sm" className="ghost" onClick={() => setCollapsed(true)}><Icon n="dleft" />Collapse</Btn></div>
        </aside>
      )}

      <div className="fill" data-density={density === 'default' ? undefined : density}>
        <div className="row wrap" style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-default)', minHeight: 40 }}>
          <span className="muted">{shown.length} of {rows.length}</span>
          {pills.map((p, i) => <span className="pill" key={i}>{p.label}<button onClick={p.clear} aria-label={`Remove filter ${p.label}`}><Icon n="x" /></button></span>)}
          {pills.length > 0 && <button className="linkbtn" onClick={() => setFilters({})}>Clear all</button>}
          <div className="right row">{toolbar}</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                {visCols.map((c) => (
                  <th key={c.key} className={`sortable ${sort?.key === c.key ? 'sorted' : ''}`} style={{ textAlign: c.align || 'left' }}
                    onClick={() => setSort(sort?.key === c.key ? (sort.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' })}
                    aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <span className="th-in">{c.label}{sort?.key === c.key && <Icon n={sort.dir === 'asc' ? 'up' : 'down'} />}{isActive(filters[c.key]) && <i style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)' }} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={visCols.length}><div className="empty">{empty}</div></td></tr>}
              {folders.map((f) => (
                <Fragment key={f.name ?? '_'}>
                  {f.name != null && (
                    <tr className="folder" onClick={() => setClosed({ ...closed, [f.name]: !closed[f.name] })}>
                      <td colSpan={visCols.length}>
                        <span aria-hidden style={{ display: "inline-flex", verticalAlign: "middle" }}><Icon n={closed[f.name] ? 'right' : 'down'} /></span> {f.name}
                        <span className="muted" style={{ fontWeight: 400 }}> · {f.rows.length} {f.rows.length === 1 ? 'row' : 'rows'}{folderMeta ? ' · ' + folderMeta(f.rows) : ''}</span>
                      </td>
                    </tr>
                  )}
                  {!closed[f.name] && f.rows.map((r) => {
                    const rid = rowId(r)
                    return (
                      <tr key={rid} className={`rowhover ${selectedId === rid ? 'picked' : ''} ${rowClass ? rowClass(r) : ''}`} onClick={() => onSelect?.(rid)} tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect?.(rid))}>
                        {visCols.map((c) => <td key={c.key} className={sort?.key === c.key ? 'col-sorted' : ''} style={{ textAlign: c.align || 'left' }}>{c.render ? c.render(r) : c.get(r)}</td>)}
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {colModal && (
        <Modal title="Add / remove columns" onClose={() => setColModal(false)}
          footer={<><span className="muted grow">{draft.length} columns selected</span><Btn onClick={() => setColModal(false)}>Cancel</Btn><Btn primary onClick={applyCols}>Apply</Btn></>}>
          {colGroups.map((g) => (
            <div className="fgroup" key={g} style={{ marginBottom: 12 }}>
              <span className="caps">{g}</span>
              {columns.filter((c) => (c.group || 'Other') === g).map((c) => (
                <label className="opt" key={c.key}>
                  <input type="checkbox" checked={c.pinned || draft.includes(c.key)} disabled={c.pinned}
                    onChange={(e) => setDraft(e.target.checked ? [...draft, c.key] : draft.filter((x) => x !== c.key))} />
                  <span className="grow">{c.label}</span>
                  {c.pinned && <span className="muted">pinned</span>}
                  {c.type !== 'none' && <span className="muted" style={{ fontSize: 13 }}>filter: {c.type}</span>}
                </label>
              ))}
            </div>
          ))}
        </Modal>
      )}
    </>
  )
}
