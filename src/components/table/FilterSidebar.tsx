import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useConfig } from '../../config/useConfig'
import { useService } from '../../services/context'
import { useAppStore } from '../../stores/appStore'
import { useProjectStore } from '../../stores/projectStore'
import { Stub } from '../stub/Stub'
import { Button, Checkbox, IconButton, LinkButton, Modal, SearchBox, Seg, TextInput } from '../ui'
import { DATE_PRESETS, numericBounds, optionCounts } from './filtering'
import type { TableModel } from './useTableModel'
import type { ColumnDef, FilterValue, GroupOption } from './types'
import s from './Table.module.css'

const kindLabel = (k: string | undefined, n: number): string => (k === 'text-search' ? 'text search' : k === 'range-units' ? 'range' : k === 'date-preset' ? 'date' : k === 'level-seg' ? 'level seg' : n >= 6 ? 'multi search' : 'multi tag')

/** Dual-handle range with min/max inputs. Two overlapping range inputs; the track is the design-system border colour. */
function RangeControl({ lo, hi, value, onChange, unit }: { lo: number; hi: number; value: FilterValue; onChange: (v: FilterValue) => void; unit?: string }) {
  const min = value.min ?? lo, max = value.max ?? hi
  const set = (a: number, b: number) => onChange({ min: a <= lo ? null : a, max: b >= hi ? null : b })
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className={s.dual}>
        <input type="range" min={lo} max={hi} value={min} aria-label="Minimum" onChange={(e) => set(Math.min(+e.target.value, max), max)} />
        <input type="range" min={lo} max={hi} value={max} aria-label="Maximum" onChange={(e) => set(min, Math.max(+e.target.value, min))} />
      </div>
      <div className="row">
        <TextInput inputMode="decimal" value={value.min ?? ''} placeholder={String(lo)} aria-label="Minimum value" onChange={(e) => onChange({ ...value, min: e.target.value === '' ? null : Number(e.target.value) })} style={{ width: 84 }} />
        <span className="muted">–</span>
        <TextInput inputMode="decimal" value={value.max ?? ''} placeholder={String(hi)} aria-label="Maximum value" onChange={(e) => onChange({ ...value, max: e.target.value === '' ? null : Number(e.target.value) })} style={{ width: 84 }} />
        {unit && <span className="data muted">{unit}</span>}
      </div>
    </div>
  )
}

function Control<R>({ model, def }: { model: TableModel<R>; def: ColumnDef<R> }) {
  const [q, setQ] = useState('')
  const v = model.filters[def.key] ?? {}
  const set = (n: FilterValue) => model.setFilter(def.key, n)
  switch (def.filter) {
    case 'text-search': return <SearchBox value={v.query ?? ''} onChange={(x) => set({ query: x })} placeholder={`Search ${def.label.toLowerCase()}…`} />
    case 'range-units': { const [lo, hi] = numericBounds(model.rows, def); return <RangeControl lo={lo} hi={hi} value={v} onChange={set} unit={def.unit} /> }
    case 'date-preset': return (
      <div className="col" style={{ gap: 4 }}>
        {DATE_PRESETS.map(([k, l]) => (
          <label key={k} className={s.radio}><input type="radio" name={`${model.id}-${def.key}`} checked={(v.preset ?? 'all') === k} onChange={() => set({ preset: k, from: v.from, to: v.to })} /><span>{l}</span></label>
        ))}
        {v.preset === 'custom' && (
          <div className="row"><TextInput type="date" aria-label="From date" value={v.from ?? ''} onChange={(e) => set({ ...v, preset: 'custom', from: e.target.value })} /><span className="muted">to</span><TextInput type="date" aria-label="To date" value={v.to ?? ''} onChange={(e) => set({ ...v, preset: 'custom', to: e.target.value })} /></div>
        )}
      </div>
    )
    default: {
      const opts = optionCounts(model.rows, model.columns, model.filters, def)
      const sel = v.values ?? []
      const toggle = (o: string, on: boolean) => set({ values: on ? [...sel, o] : sel.filter((x) => x !== o) })
      const lab = (o: string) => (def.label_of ? def.label_of(o) : o)
      if (def.filter === 'level-seg') {
        return (
          <div className={s.levelseg} role="group" aria-label={def.label}>
            {opts.map(([o, n]) => <button key={o} type="button" aria-pressed={sel.includes(o)} disabled={n === 0 && !sel.includes(o)} onClick={() => toggle(o, !sel.includes(o))}>{lab(o)}<span className="data">{n}</span></button>)}
          </div>
        )
      }
      const shown = opts.filter(([o]) => !q || lab(o).toLowerCase().includes(q.toLowerCase()))
      return (
        <div className="col" style={{ gap: 6 }}>
          {def.filter === 'multi-search' && <SearchBox value={q} onChange={setQ} placeholder={`Filter ${opts.length} options…`} />}
          <div className={s.optlist}>
            {shown.length === 0 && <span className="muted" style={{ fontStyle: 'italic' }}>No matches</span>}
            {shown.map(([o, n]) => <Checkbox key={o} checked={sel.includes(o)} disabled={n === 0 && !sel.includes(o)} onChange={(on) => toggle(o, on)} label={lab(o)} count={n} />)}
          </div>
        </div>
      )
    }
  }
}

const clearOf = (def: { filter?: string }): FilterValue => (def.filter === 'range-units' ? {} : def.filter === 'date-preset' ? { preset: 'all' } : def.filter === 'text-search' ? { query: '' } : { values: [] })

/**
 * The shared filter sidebar (design system "Filter sidebar" card): header with active count and Clear all, Filters / Columns /
 * Manage tabs, collapsible groups of collapsible sections with a control chosen by data type, 4px resize edge, footer collapse.
 */
export function FilterSidebar<R>({ model, noun = 'rows', groupOptions = [], shownCount, canGallery, onNewView }: {
  model: TableModel<R>; noun?: string; groupOptions?: Array<GroupOption<R>>; shownCount: number; canGallery?: boolean; onNewView?: () => void
}) {
  const config = useConfig()
  const persistence = useService('persistence')
  const density = useAppStore((a) => a.density)
  const setApp = useAppStore((a) => a.set)
  const views = useProjectStore((p) => p.views)
  const [tab, setTab] = useState<'Filters' | 'Columns' | 'Manage'>('Filters')
  const [query, setQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [exp, setExp] = useState<Record<string, boolean> | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(320)
  const [picker, setPicker] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const [viewName, setViewName] = useState('')
  const drag = useRef<{ x: number; w: number } | null>(null)

  const { filterCols, activeKeys, filters, columns } = model
  const matches = (c: ColumnDef<R>) => (!activeOnly || activeKeys.includes(c.key)) && (!query || c.label.toLowerCase().includes(query.toLowerCase()))
  const groups = [...new Set(filterCols.map((c) => c.group ?? 'Other'))]
  const isOpen = (k: string) => (exp ? !!exp[k] : k === filterCols[0]?.key || activeKeys.includes(k))
  const savedViews = views.filter((v) => v.meta?.table === model.id)

  const startResize = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, w: width }
    const move = (ev: MouseEvent) => drag.current && setWidth(Math.max(260, Math.min(500, drag.current.w + ev.clientX - drag.current.x)))
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }
  const saveView = () => {
    void persistence.save('view', { title: viewName.trim() || `${model.id} view ${savedViews.length + 1}`, projectId: 'p-civic-si', meta: { table: model.id, filters: JSON.stringify(filters), visible: model.visible.join(','), fields: model.fields.join(',') } })
    setViewName('')
  }
  const loadView = (meta?: Record<string, string | number>) => {
    if (!meta) return
    try {
      model.setFilters(JSON.parse(String(meta.filters ?? '{}')))
      model.setVisible(String(meta.visible ?? '').split(',').filter(Boolean))
    } catch { /* ignore malformed view */ }
  }

  if (collapsed) {
    return (
      <aside className={`${s.side} ${s.collapsed}`} aria-label="Table sidebar (collapsed)">
        <IconButton label="Expand sidebar" onClick={() => setCollapsed(false)} ghost={false}><ChevronsRight size={14} /></IconButton>
        {activeKeys.length > 0 && <span className={s.count} title="Active filters">{activeKeys.length}</span>}
      </aside>
    )
  }

  return (
    <aside className={s.side} style={{ width, flexBasis: width }} aria-label="Table sidebar" data-testid="filter-sidebar">
      <div className={s.head}>
        <div className="col" style={{ gap: 2 }}>
          <span className="text-section">Filters</span>
          <span className="data muted" data-testid="row-count">{activeKeys.length ? `${activeKeys.length} active · ${shownCount} of ${model.rows.length}` : `${model.rows.length} ${noun}`}</span>
        </div>
        <LinkButton disabled={!activeKeys.length} onClick={model.clearAll}>Clear all</LinkButton>
      </div>
      <div className={s.tabs} role="tablist">
        {(['Filters', 'Columns', 'Manage'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}{t === 'Filters' && activeKeys.length > 0 && <span className={s.count}>{activeKeys.length}</span>}</button>
        ))}
      </div>

      <div className={s.body}>
        {tab === 'Filters' && (<>
          <div className={s.block}>
            <SearchBox value={query} onChange={setQuery} placeholder="Search filters…" />
            <Checkbox checked={activeOnly} onChange={setActiveOnly} label="Show active filters only" />
          </div>
          {groups.map((g) => {
            const cols = filterCols.filter((c) => (c.group ?? 'Other') === g && matches(c))
            if (!cols.length) return null
            const gActive = cols.filter((c) => activeKeys.includes(c.key)).length
            const gOpen = open[g] !== false
            return (
              <div key={g} className={s.group}>
                <div className={s.groupHead}>
                  <button type="button" aria-expanded={gOpen} onClick={() => setOpen({ ...open, [g]: !gOpen })}>
                    {gOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}<span className="grow">{g}</span>{gActive > 0 && <span className={s.countSolid}>{gActive}</span>}
                  </button>
                  {gActive > 0 && <LinkButton onClick={() => model.setFilters({ ...filters, ...Object.fromEntries(cols.map((c) => [c.key, clearOf(c)])) })}>Clear</LinkButton>}
                </div>
                {gOpen && cols.map((c) => {
                  const act = activeKeys.includes(c.key)
                  const on = isOpen(c.key)
                  const n = c.filter === 'multi-tag' || c.filter === 'multi-search' ? optionCounts(model.rows, columns, filters, c).length : 0
                  return (
                    <div key={c.key} className={s.section}>
                      <button type="button" className={s.sectionHead} aria-expanded={on} onClick={() => setExp({ ...(exp ?? Object.fromEntries(filterCols.filter((x) => isOpen(x.key)).map((x) => [x.key, true]))), [c.key]: !on })}>
                        {on ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}<span className="grow">{c.label}</span>
                        <span className={s.kind}>{kindLabel(c.filter, n)}</span>{act && <i className={s.dot} title="Filter active" />}
                      </button>
                      {on && (
                        <div className={s.sectionBody}>
                          {!model.fields.includes(c.key) && <span className="muted">Column removed. The filter stays while it is applied.</span>}
                          <Control model={model} def={c} />
                          {act && <LinkButton onClick={() => model.setFilter(c.key, clearOf(c))}>Clear</LinkButton>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {filterCols.every((c) => !matches(c)) && <div className={s.noFilters}>No filters match{query ? ` “${query}”` : ''}.</div>}
        </>)}

        {tab === 'Columns' && (<>
          <div className={s.block}>
            <div className="row"><span className="text-label-caps grow">Columns</span>
              <LinkButton onClick={() => model.setVisible(model.fields)}>Show all</LinkButton><span className="muted">·</span>
              <LinkButton onClick={() => model.setVisible(columns.filter((c) => c.pinned).map((c) => c.key))}>Hide all</LinkButton></div>
            <span className="muted">Hiding a column keeps its filter.</span>
          </div>
          <div>
            {columns.filter((c) => model.fields.includes(c.key)).map((c) => (
              <div key={c.key} className={s.colrow}>
                <Checkbox checked={!!c.pinned || model.visible.includes(c.key)} disabled={!!c.pinned} label={c.label} hint={c.pinned ? 'pinned' : c.showOnlyWhenFiltered ? 'on filter' : undefined}
                  onChange={(on) => model.setVisible(on ? [...model.visible, c.key] : model.visible.filter((x) => x !== c.key))} />
                <span className={s.kind}>{c.filter && c.filter !== 'none' ? kindLabel(c.filter, 6).replace('multi search', 'list').replace('multi tag', 'list') : '—'}</span>
              </div>
            ))}
          </div>
          <div className={s.block}>
            <Button onClick={() => { setDraft(model.fields); setPicker(true) }}>Add / Remove Columns</Button>
            <span className="muted">Adding a column adds its filter, even if the column stays hidden.</span>
          </div>
          <div className={s.block}>
            <span className="text-label-caps">Row density</span>
            <Seg value={density} onChange={(d) => setApp({ density: d })} label="Row density" options={[['compact', 'Compact'], ['default', 'Default'], ['comfy', 'Comfy']]} />
            <span className="muted">Density is global. It also lives in Settings.</span>
            {canGallery && <><span className="text-label-caps">Layout</span><Seg value={model.layout} onChange={model.setLayout} label="Layout" options={[['table', 'List'], ['gallery', 'Gallery']]} /></>}
            {groupOptions.length > 0 && <><span className="text-label-caps">Group into subfolders</span>
              <Seg value={model.group} onChange={model.setGroup} label="Group by" options={[...groupOptions.map((g): [string, string] => [g.key, g.label]), ['none', 'None']]} /></>}
          </div>
        </>)}

        {tab === 'Manage' && (<>
          <div className={s.block}>
            <span className="text-label-caps">Current view</span>
            <span className="secondary">{activeKeys.length === 0 ? 'No filters applied.' : `${activeKeys.length} filter${activeKeys.length === 1 ? '' : 's'} applied.`}</span>
            <div className="row"><Button className="grow" disabled={!activeKeys.length} onClick={model.clearAll}>Reset</Button>
              <Stub id="persistence" note="Saved in memory"><Button primary className="grow" onClick={saveView}>Save current view</Button></Stub></div>
            <TextInput placeholder="View name (optional)" value={viewName} onChange={(e) => setViewName(e.target.value)} aria-label="View name" />
            {onNewView && <LinkButton onClick={onNewView}>New view</LinkButton>}
          </div>
          <div className={s.block}>
            <span className="text-label-caps">My saved views</span>
            {savedViews.length === 0 && <span className="muted">No saved views yet.</span>}
            {savedViews.map((v) => (
              <div key={v.id} className={s.viewrow}>
                <button type="button" className="grow" onClick={() => loadView(v.meta)}><span className="trunc">{v.title}</span></button>
                <IconButton label={`Delete view ${v.title}`} onClick={() => useProjectStore.setState((p) => ({ views: p.views.filter((x) => x.id !== v.id) }))}><Trash2 size={14} /></IconButton>
              </div>
            ))}
          </div>
        </>)}
      </div>

      <div className={s.foot}><button type="button" className={s.collapseBtn} onClick={() => setCollapsed(true)}><ChevronsLeft size={14} aria-hidden />Collapse</button></div>
      <div className={s.resize} onMouseDown={startResize} title="Drag to resize" />

      {picker && (
        <Modal title="Add / remove columns" onClose={() => setPicker(false)}
          footer={<><span className="muted grow">{draft.length} columns selected{draft.length > config.limits.maxExtraColumns + 7 ? ' · not all may fit on smaller screens' : ''}</span><Button onClick={() => setPicker(false)}>Cancel</Button><Button primary onClick={() => { model.applyFields(draft); setPicker(false) }}>Apply</Button></>}>
          {[...new Set(columns.map((c) => c.group ?? 'Other'))].map((g) => (
            <div key={g} className="col" style={{ marginBottom: 12, gap: 2 }}>
              <span className="text-label-caps">{g}</span>
              {columns.filter((c) => (c.group ?? 'Other') === g).map((c) => (
                <Checkbox key={c.key} checked={!!c.pinned || draft.includes(c.key)} disabled={!!c.pinned} label={c.label} hint={c.pinned ? 'pinned' : undefined}
                  onChange={(on) => setDraft(on ? [...draft, c.key] : draft.filter((x) => x !== c.key))} />
              ))}
            </div>
          ))}
        </Modal>
      )}
    </aside>
  )
}
