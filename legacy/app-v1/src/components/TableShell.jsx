import Icon from './Icon'
import { Fragment, useMemo, useState } from 'react'
import { useStore } from '../store'
import { Btn, Modal, useLocal } from './ui'
import FilterSidebar from './FilterSidebar'

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
  id, columns, rows, rowId, selectedId, onSelect, rowClass, groupOptions = [], folderMeta, toolbar, empty = 'No rows match these filters.', defaultGroup, card, noun = 'rows',
}) {
  const { state, dispatch } = useStore()
  const [tab, setTab] = useLocal(id + ':tab', 'Filters')
  const [collapsed, setCollapsed] = useLocal(id + ':collapsed', false)
  const [fieldSet, setFieldSet] = useLocal(id + ':fields', columns.map((c) => c.key))
  const [visible, setVisible] = useLocal(id + ':visible', columns.filter((c) => c.visible !== false).map((c) => c.key))
  const [filters, setFilters] = useLocal(id + ':filters', {})
  // Density and layout default to the System settings; a per-table choice in Manage overrides them.
  const [dOver, setDensity] = useLocal(id + ':density', null)
  const [lOver, setLayout] = useLocal(id + ':layout', null)
  const density = dOver ?? state.density
  const layout = card ? lOver ?? state.view : 'table'
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
  const deleteView = (name) => dispatch({ type: 'deleteView', table: id, name })
  const loadView = (v) => { setFieldSet(v.fieldSet); setVisible(v.visible); setFilters(v.filters); setDensity(v.density); setGroup(v.group) }

  const optionsFor = (c) => {
    const m = new Map()
    rows.forEach((r) => { const v = String(c.get(r) ?? '—'); m.set(v, (m.get(v) || 0) + 1) })
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }
  const colGroups = [...new Set(columns.map((c) => c.group || 'Other'))]

  return (
    <>
      <FilterSidebar id={id} columns={columns} fieldSet={fieldSet} visible={visible} setVisible={setVisible} filters={filters} setF={setF} setFilters={setFilters}
        isActive={isActive} optionsFor={optionsFor} noun={noun} total={rows.length} shownCount={shown.length} collapsed={collapsed} setCollapsed={setCollapsed}
        density={density} setDensity={setDensity} layout={layout} setLayout={setLayout} card={card} group={group} setGroup={setGroup} groupOptions={groupOptions}
        openColModal={openColModal} views={views} saveView={saveView} loadView={loadView} deleteView={deleteView} viewName={viewName} setViewName={setViewName} />

      <div className="fill" data-density={density === 'default' ? undefined : density}>
        <div className="row wrap" style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-default)', minHeight: 40 }}>
          <span className="muted">{shown.length} of {rows.length}</span>
          {pills.map((p, i) => <span className="pill" key={i}>{p.label}<button onClick={p.clear} aria-label={`Remove filter ${p.label}`}><Icon n="x" /></button></span>)}
          {pills.length > 0 && <button className="linkbtn" onClick={() => setFilters({})}>Clear all</button>}
          <div className="right row">{toolbar}</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {layout === 'thumbnail' ? <Thumbs folders={folders} card={card} rowId={rowId} selectedId={selectedId} onSelect={onSelect} rowClass={rowClass} closed={closed} setClosed={setClosed} folderMeta={folderMeta} empty={shown.length === 0 && empty} /> : (
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
          </table>)}
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

// Thumbnail layout: icon-card tiles instead of rows; clicking a tile opens the same right-hand detail panel.
function Thumbs({ folders, card, rowId, selectedId, onSelect, rowClass, closed, setClosed, folderMeta, empty }) {
  if (empty) return <div className="empty">{empty}</div>
  return (
    <div>
      {folders.map((f) => (
        <section key={f.name ?? '_'}>
          {f.name != null && (
            <div className="row folderbar" onClick={() => setClosed({ ...closed, [f.name]: !closed[f.name] })}>
              <Icon n={closed[f.name] ? 'right' : 'down'} /><b>{f.name}</b>
              <span className="muted"> · {f.rows.length} {f.rows.length === 1 ? 'row' : 'rows'}{folderMeta ? ' · ' + folderMeta(f.rows) : ''}</span>
            </div>
          )}
          {!closed[f.name] && (
            <div className="thumbs">
              {f.rows.map((r) => {
                const c = card(r), rid = rowId(r)
                return (
                  <button key={rid} className={`thumb ${selectedId === rid ? 'picked' : ''} ${rowClass ? rowClass(r) : ''}`} onClick={() => onSelect?.(rid)}>
                    <div className="pic">{c.img ? <img src={c.img} alt="" /> : <span className="mono muted">{c.sub}</span>}</div>
                    <div className="cap"><span className="n">{c.title}</span>{c.badge}</div>
                    <div className="cap sub"><span className="mono muted">{c.sub}</span><span className="mono">{c.meta}</span></div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
