import { useState } from 'react'
import { Button, SearchBox } from '../../components/ui'
import { facetByKey } from '../../config/catalogueConfig'
import s from './catalogue.module.css'

/**
 * Quick-select chips for the axes a category node declares (0 to 3). Same facet semantics as the sidebar: multi-select is OR,
 * each count is computed with every other facet applied, options with no results are disabled unless already active.
 */
export function QuickSelect({ axes, counts, selected, onToggle }: {
  axes: string[]; counts: Record<string, Record<string, number>>; selected: Record<string, string[]>; onToggle: (facet: string, value: string, on: boolean) => void
}) {
  if (axes.length === 0) return null
  return (
    <div className={s.quick} data-testid="quick-select">
      {axes.slice(0, 3).map((key) => {
        const def = facetByKey(key)
        if (!def) return null
        const opts = Object.entries(counts[key] ?? {})
        const rank = (v: string) => (def.order ? def.order.indexOf(v) + 1 || 99 : 0)
        opts.sort((a, b) => (rank(a[0]) - rank(b[0])) || a[0].localeCompare(b[0], undefined, { numeric: true }))
        const sel = selected[key] ?? []
        return (
          <div key={key} className={s.axis} role="group" aria-label={`Quick select ${def.label}`}>
            <span className={s.axisLabel}>{def.label}</span>
            {opts.map(([v, n]) => {
              const on = sel.includes(v)
              return <button key={v} type="button" className={s.qchip} aria-pressed={on} disabled={n === 0 && !on} onClick={() => onToggle(key, v, !on)}><span className={def.mono ? 'data' : undefined}>{v}</span><span className={s.n}>{n}</span></button>
            })}
          </div>
        )
      })}
    </div>
  )
}

/** Free text that parses a spec query into facets ("M16 hex stainless"). Enter or Search applies it. */
export function CatalogueSearch({ onSubmit, placeholder, label, big, compact }: { onSubmit: (text: string) => void; placeholder: string; label: string; big?: boolean; compact?: boolean }) {
  const [text, setText] = useState('')
  const submit = () => { onSubmit(text); setText('') }
  return (
    <form className={compact ? s.searchCompact : s.search} role="search" onSubmit={(e) => { e.preventDefault(); submit() }}>
      <div className={s.box}><SearchBox value={text} onChange={setText} placeholder={placeholder} label={label} /></div>
      <Button primary={big} size={big ? 'md' : 'sm'} type="submit">Search</Button>
    </form>
  )
}
