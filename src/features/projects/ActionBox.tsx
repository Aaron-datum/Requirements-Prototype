import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import s from './Projects.module.css'

export interface BoxItem { id: string; lead?: ReactNode; title: string; sub?: ReactNode; to: string }

/**
 * The action-box pattern (same as the Program composition boxes): a count, one line, a list of top items, one primary action.
 * Three boxes on the dashboard use it with different content: urgent or risky, review, where you left off.
 */
export function ActionBox({ id, title, count, line, items, empty, action, rows = 4 }: {
  id: string; title: string; count: number; line: string; items: BoxItem[]; empty: string; action: { label: string; to: string }; rows?: number
}) {
  const nav = useNavigate()
  return (
    <section className={s.box} aria-labelledby={`${id}-h`} data-testid={`box-${id}`}>
      <div className={s.boxHead}>
        <h2 id={`${id}-h`}>{title}</h2>
        <span className={s.boxCount} data-testid={`box-${id}-count`} aria-label={`${count} items`}>{count}</span>
      </div>
      <div className={s.boxLine}>{line}</div>
      <ul className={s.boxList}>
        {items.length === 0 && <li className={s.boxEmpty}>{empty}</li>}
        {items.slice(0, rows).map((it) => (
          <li key={it.id} className={s.boxItem}>
            {it.lead}
            <span className={s.boxItemMain}><Link to={it.to} className="trunc">{it.title}</Link>{it.sub && <span className="muted trunc">{it.sub}</span>}</span>
          </li>
        ))}
        {items.length > rows && <li className={s.more}>+ {items.length - rows} more in the table below</li>}
      </ul>
      <Button primary onClick={() => nav(action.to)}>{action.label}</Button>
    </section>
  )
}
