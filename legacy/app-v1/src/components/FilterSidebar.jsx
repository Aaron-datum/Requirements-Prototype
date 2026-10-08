import { useRef, useState } from 'react'
import Icon from './Icon'
import { Btn, Seg, useLocal } from './ui'

// Filter sidebar — follows the design system's "Filter sidebar" card:
//   header (title + count + Clear all) · tab bar with active-count badge · Filters / Columns / Manage
//   Filters: field search + "active only", collapsible GROUPS (subtle band, count pill, Clear) holding collapsible
//   FILTER SECTIONS (chevron, label, kind tag, active dot). Control chosen by data type:
//   text-search · multi-tag (≤5) · multi-search (6+) · level-seg (ordered) · range.
const kindOf = (c, nOpts) => (c.type === 'text' ? 'text search' : c.type === 'range' ? 'range' : c.levels ? 'level seg' : nOpts >= 6 ? 'multi search' : 'multi tag')

function Check({ checked, onChange, label, count, disabled, hint }) {
  return (
    <label className="chk">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="box" aria-hidden>{checked && <Icon n="check" size={12} />}</span>
      <span className="grow trunc">{label}</span>
      {hint && <span className="muted small">{hint}</span>}
      {count != null && <span className="mono muted">{count}</span>}
    </label>
  )
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="sbox"><Icon n="search" size={14} /><input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} /></div>
  )
}

function Control({ c, value, onChange, options }) {
  const [q, setQ] = useState('')
  if (c.type === 'text') return <SearchBox value={value || ''} onChange={onChange} placeholder={`Search ${c.label.toLowerCase()}…`} />
  if (c.type === 'range') {
    const v = value || {}
    return (
      <div className="row">
        <input type="text" inputMode="decimal" placeholder="min" value={v.min ?? ''} onChange={(e) => onChange({ ...v, min: e.target.value })} aria-label={`${c.label} minimum`} />
        <span className="muted">–</span>
        <input type="text" inputMode="decimal" placeholder="max" value={v.max ?? ''} onChange={(e) => onChange({ ...v, max: e.target.value })} aria-label={`${c.label} maximum`} />
      </div>
    )
  }
  const sel = value || []
  const toggle = (o, on) => onChange(on ? [...sel, o] : sel.filter((x) => x !== o))
  if (c.levels) {
    const counts = Object.fromEntries(options)
    return (
      <div className="levelseg" role="group" aria-label={c.label}>
        {c.levels.filter((l) => counts[l] != null || sel.includes(l)).map((l) => (
          <button key={l} className={sel.includes(l) ? 'on' : ''} aria-pressed={sel.includes(l)} onClick={() => toggle(l, !sel.includes(l))}>{l}<span className="mono">{counts[l] ?? 0}</span></button>
        ))}
      </div>
    )
  }
  const shown = options.filter(([o]) => !q || o.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="col" style={{ gap: 6 }}>
      {options.length >= 6 && <SearchBox value={q} onChange={setQ} placeholder={`Filter ${options.length} options…`} />}
      <div className="optlist">
        {shown.length === 0 && <span className="muted small" style={{ fontStyle: 'italic', padding: '6px 0' }}>No matches</span>}
        {shown.map(([o, n]) => <Check key={o} checked={sel.includes(o)} onChange={(on) => toggle(o, on)} label={o} count={n} />)}
      </div>
    </div>
  )
}

export default function FilterSidebar(p) {
  const { id, columns, fieldSet, visible, setVisible, filters, setF, setFilters, isActive, optionsFor, noun, total, shownCount, collapsed, setCollapsed,
    density, setDensity, layout, setLayout, card, group, setGroup, groupOptions, openColModal, views, saveView, loadView, deleteView, viewName, setViewName } = p
  const [tab, setTab] = useLocal(id + ':tab', 'Filters')
  const [query, setQuery] = useLocal(id + ':fq', '')
  const [activeOnly, setActiveOnly] = useLocal(id + ':fa', false)
  const [groupOpen, setGroupOpen] = useLocal(id + ':fg', {})
  const [expanded, setExpanded] = useLocal(id + ':fe', null)
  const [width, setWidth] = useLocal(id + ':w', 340)
  const drag = useRef(null)

  const filterCols = columns.filter((c) => c.type !== 'none' && (fieldSet.includes(c.key) || isActive(filters[c.key])))
  const activeKeys = filterCols.filter((c) => isActive(filters[c.key])).map((c) => c.key)
  const groups = [...new Set(filterCols.map((c) => c.group || 'Other'))]
  // default: the first section of the first group is open, plus any section with an active filter
  const exp = expanded ?? { [filterCols[0]?.key]: true }
  const isOpen = (k) => !!exp[k] || (expanded == null && activeKeys.includes(k))
  const clearOne = (c) => setF(c.key, c.type === 'enum' ? [] : c.type === 'range' ? {} : '')
  const matches = (c) => (!activeOnly || activeKeys.includes(c.key)) && (!query || c.label.toLowerCase().includes(query.toLowerCase()))
  const optsCache = {}
  const opts = (c) => (optsCache[c.key] ||= optionsFor(c))

  const startResize = (e) => {
    drag.current = { x: e.clientX, w: width }
    const move = (ev) => setWidth(Math.max(260, Math.min(500, drag.current.w + ev.clientX - drag.current.x)))
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }

  if (collapsed) {
    return (
      <aside className="side collapsed" aria-label="Table sidebar (collapsed)">
        <div className="bd" style={{ alignItems: 'center', gap: 8 }}>
          <Btn size="sm" className="icon" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"><Icon n="dright" /></Btn>
          {activeKeys.length > 0 && <span className="countpill" title="Active filters">{activeKeys.length}</span>}
        </div>
      </aside>
    )
  }

  const TABS = [['Filters', activeKeys.length], ['Columns', 0], ['Manage', 0]]
  return (
    <aside className="side fsb" style={{ width, flexBasis: width }} aria-label="Table sidebar">
      <div className="fsb-head">
        <div className="col" style={{ gap: 2 }}>
          <span className="h3">Filters</span>
          <span className="mono muted">{activeKeys.length ? `${activeKeys.length} active · ${shownCount} of ${total}` : `${total} ${noun}`}</span>
        </div>
        <button className="linkbtn" disabled={!activeKeys.length} onClick={() => setFilters({})}>Clear all</button>
      </div>
      <div className="fsb-tabs" role="tablist">
        {TABS.map(([t, n]) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t}{n > 0 && <span className="countpill">{n}</span>}
          </button>
        ))}
      </div>

      <div className="fsb-body">
        {tab === 'Filters' && (<>
          <div className="fsb-search col">
            <SearchBox value={query} onChange={setQuery} placeholder="Search filters…" />
            <Check checked={activeOnly} onChange={setActiveOnly} label="Show active filters only" />
          </div>
          {groups.map((g) => {
            const cols = filterCols.filter((c) => (c.group || 'Other') === g && matches(c))
            if (!cols.length) return null
            const gActive = cols.filter((c) => activeKeys.includes(c.key)).length
            const open = groupOpen[g] !== false
            return (
              <div key={g} className="fgrp">
                <div className="fgrp-head">
                  <button onClick={() => setGroupOpen({ ...groupOpen, [g]: !open })} aria-expanded={open}>
                    <Icon n={open ? 'down' : 'right'} size={14} /><span className="grow">{g}</span>
                    {gActive > 0 && <span className="countpill solid">{gActive}</span>}
                  </button>
                  {gActive > 0 && <button className="linkbtn clr" onClick={() => setFilters({ ...filters, ...Object.fromEntries(cols.map((c) => [c.key, c.type === 'enum' ? [] : c.type === 'range' ? {} : ''])) })}>Clear</button>}
                </div>
                {open && cols.map((c) => {
                  const o = c.type === 'enum' ? opts(c) : []
                  const on = isOpen(c.key), act = activeKeys.includes(c.key)
                  return (
                    <div key={c.key} className="fsec">
                      <button className="fsec-head" onClick={() => setExpanded({ ...exp, [c.key]: !on })} aria-expanded={on}>
                        <Icon n={on ? 'down' : 'right'} size={14} /><span className="grow">{c.label}</span>
                        <span className="kind">{kindOf(c, o.length)}</span>
                        {act && <i className="adot" title="Filter active" />}
                      </button>
                      {on && (
                        <div className="fsec-body">
                          {!fieldSet.includes(c.key) && <span className="muted small">Column removed — filter stays while it is applied.</span>}
                          <Control c={c} value={filters[c.key]} onChange={(v) => setF(c.key, v)} options={o} />
                          {act && <button className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => clearOne(c)}>Clear</button>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {filterCols.every((c) => !matches(c)) && <div className="empty">No filters match{query ? ` “${query}”` : ''}.</div>}
        </>)}

        {tab === 'Columns' && (<>
          <div className="fsb-block">
            <div className="row"><span className="caps grow">Columns</span>
              <button className="linkbtn" onClick={() => setVisible(fieldSet)}>Show all</button><span className="muted">·</span>
              <button className="linkbtn sec" onClick={() => setVisible(columns.filter((c) => c.pinned).map((c) => c.key))}>Hide all</button></div>
            <span className="muted small">Hiding a column keeps its filter.</span>
          </div>
          <div className="collist">
            {columns.filter((c) => fieldSet.includes(c.key)).map((c) => (
              <div key={c.key} className="colrow">
                <Check checked={c.pinned || visible.includes(c.key)} disabled={c.pinned} onChange={(on) => setVisible(on ? [...visible, c.key] : visible.filter((x) => x !== c.key))} label={c.label} hint={c.pinned ? 'pinned' : undefined} />
                <span className="kind">{c.type === 'range' ? 'range' : c.type === 'text' ? 'text' : c.type === 'enum' ? 'list' : '—'}</span>
              </div>
            ))}
          </div>
          <div className="fsb-block"><Btn style={{ width: '100%' }} onClick={openColModal}>Add / Remove Columns</Btn>
            <span className="muted small">Adding a column adds its filter — even if the column stays hidden.</span></div>
          <div className="fsb-block"><span className="caps">Row density</span>
            <Seg value={density} onChange={setDensity} options={[['compact', 'Compact'], ['default', 'Default'], ['comfy', 'Comfy']]} />
            {card && <><span className="caps" style={{ marginTop: 8 }}>Layout</span><Seg value={layout} onChange={setLayout} options={[['table', 'Table'], ['thumbnail', 'Thumbnail']]} /></>}
            {groupOptions.length > 0 && <><span className="caps" style={{ marginTop: 8 }}>Group into subfolders</span>
              <Seg value={group} onChange={setGroup} options={[...groupOptions.map((g) => [g.key, g.label]), ['none', 'None']]} /></>}</div>
        </>)}

        {tab === 'Manage' && (<>
          <div className="fsb-block">
            <span className="caps">Current view</span>
            <span className="sec">{activeKeys.length === 0 ? 'No filters applied.' : `${activeKeys.length} filter${activeKeys.length === 1 ? '' : 's'} applied.`}</span>
            <div className="row">
              <Btn className="grow" disabled={!activeKeys.length} onClick={() => setFilters({})}>Reset</Btn>
              <Btn primary className="grow" onClick={saveView}>Save current view</Btn>
            </div>
            <input type="text" placeholder="View name (optional)" value={viewName} onChange={(e) => setViewName(e.target.value)} aria-label="View name" />
          </div>
          <div className="fsb-block">
            <span className="caps">My saved views</span>
            {views.length === 0 && <span className="muted small">No saved views yet.</span>}
            {views.map((v) => (
              <div key={v.name} className="viewrow">
                <button className="grow" onClick={() => loadView(v)}><span className="trunc">{v.name}</span><span className="mono muted">{v.note}</span></button>
                <Btn size="sm" className="ghost icon" aria-label={`Delete view ${v.name}`} onClick={() => deleteView(v.name)}><Icon n="trash" size={14} /></Btn>
              </div>
            ))}
          </div>
        </>)}
      </div>

      <div className="fsb-foot"><button className="sbcollapse" onClick={() => setCollapsed(true)}><Icon n="dleft" size={14} />Collapse</button></div>
      <div className="resize-handle" onMouseDown={startResize} title="Drag to resize" />
    </aside>
  )
}
