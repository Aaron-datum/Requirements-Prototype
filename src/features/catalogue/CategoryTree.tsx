import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { CatalogueNode } from '../../domain/catalogue'
import s from './catalogue.module.css'

const fmt = (n: number): string => n.toLocaleString('en-US')

/**
 * The pinned category tree. Counts are live: while filters are active each node shows how many matching parts it holds, and
 * nodes with none are dimmed (they stay clickable and keep their place). Selecting a node scopes the filters and results.
 */
export function CategoryTree({ tree, selectedId, onSelect, filtersActive, title = 'Categories' }: {
  tree: CatalogueNode[]; selectedId: string | null; onSelect: (node: CatalogueNode) => void; filtersActive: boolean; title?: string
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const ancestors = new Set<string>()
  const mark = (nodes: CatalogueNode[], trail: string[]): boolean => nodes.some((n) => {
    if (n.id === selectedId) { trail.forEach((t) => ancestors.add(t)); return true }
    return n.children ? mark(n.children, [...trail, n.id]) : false
  })
  if (selectedId) mark(tree, [])
  const isOpen = (n: CatalogueNode) => open[n.id] ?? ancestors.has(n.id)

  const render = (n: CatalogueNode, depth: number) => {
    const kids = n.children?.length ? n.children : null
    const on = n.id === selectedId
    const dimmed = filtersActive && n.count === 0
    return (
      <li key={n.id} role="none">
        <div className={`${s.node} ${on ? s.nodeOn : ''} ${dimmed ? s.dim : ''}`} style={{ paddingLeft: depth * 12 }} data-testid={`tree-node-${n.id}`} data-count={n.count} data-dimmed={dimmed || undefined}>
          {kids
            ? <button type="button" className={s.twist} aria-label={`${isOpen(n) ? 'Collapse' : 'Expand'} ${n.label}`} aria-expanded={isOpen(n)} onClick={() => setOpen({ ...open, [n.id]: !isOpen(n) })}>{isOpen(n) ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}</button>
            : <span className={s.twistSpacer} />}
          <button type="button" role="treeitem" className={s.nodeBtn} aria-current={on ? 'true' : undefined} aria-selected={on} aria-expanded={kids ? isOpen(n) : undefined}
            title={dimmed ? `No parts in ${n.label} match the active filters` : undefined} onClick={() => onSelect(n)}>
            <span className={`${s.nodeLabel} ${n.scope ? 'data' : ''}`}>{n.label}</span>
            <span className={s.nodeCount}>{fmt(n.count)}</span>
          </button>
        </div>
        {kids && isOpen(n) && <ul role="group" style={{ listStyle: 'none', margin: 0, padding: 0 }}>{kids.map((c) => render(c, depth + 1))}</ul>}
      </li>
    )
  }

  return (
    <nav aria-label="Catalogue categories" data-testid="category-tree">
      <div className={s.treeHead}><span className={s.cap}>{title}</span><span className="data muted">{tree.length} groups</span></div>
      <ul role="tree" className={s.tree} style={{ listStyle: 'none', margin: 0 }}>{tree.map((n) => render(n, 0))}</ul>
    </nav>
  )
}
