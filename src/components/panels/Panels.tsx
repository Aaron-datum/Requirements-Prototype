import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { IconButton, Tabs } from '../ui'
import s from './Panels.module.css'

/** Right-hand side panel: the canonical detail view everywhere. Resizable from its inner edge (default 400, 320 to 640). */
export function SidePanel<T extends string = string>({ title, subtitle, badge, onClose, tabs, tab, onTab, children, footer, empty, defaultWidth = 400 }: {
  title: ReactNode; subtitle?: ReactNode; badge?: ReactNode; onClose?: () => void
  tabs?: Array<{ key: T; label: string; count?: number }>; tab?: T; onTab?: (t: T) => void
  children: ReactNode; footer?: ReactNode; empty?: ReactNode; defaultWidth?: number
}) {
  const [width, setWidth] = useState(defaultWidth)
  const drag = useRef<{ x: number; w: number } | null>(null)
  const start = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, w: width }
    const move = (ev: MouseEvent) => drag.current && setWidth(Math.max(320, Math.min(640, drag.current.w - (ev.clientX - drag.current.x))))
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }
  return (
    <aside className={s.panel} style={{ width, flexBasis: width }} aria-label="Detail panel" data-testid="side-panel">
      <div className={s.handle} onMouseDown={start} title="Drag to resize" />
      {empty ? <div className={s.empty}>{empty}</div> : (<>
        <header className={s.hd}>
          <div className="grow"><div className="text-section trunc">{title}</div>{subtitle && <div className="data muted trunc">{subtitle}</div>}</div>
          {badge}
          {onClose && <IconButton label="Close panel" onClick={onClose}><X size={14} /></IconButton>}
        </header>
        {tabs && tab && onTab && <div className={s.tabs}><Tabs value={tab} tabs={tabs} onChange={onTab} label="Detail tabs" /></div>}
        <div className={s.bd}>{children}</div>
        {footer && <footer className={s.ft}>{footer}</footer>}
      </>)}
    </aside>
  )
}

/** Bottom drawer: reserved for chronological, scrubbable content (the carryover chain, recent activity). */
export function BottomDrawer({ title, meta, open, onToggle, children, height = 168 }: { title: ReactNode; meta?: ReactNode; open: boolean; onToggle: (open: boolean) => void; children: ReactNode; height?: number }) {
  return (
    <section className={s.drawer} style={{ height: open ? height : 'var(--drawer-handle-height)' }} aria-label="Bottom drawer" data-testid="bottom-drawer">
      <button type="button" className={s.drawerHd} onClick={() => onToggle(!open)} aria-expanded={open}>
        {open ? <ChevronDown size={14} aria-hidden /> : <ChevronUp size={14} aria-hidden />}
        <span className="text-section">{title}</span>{meta && <span className="data muted">{meta}</span>}
      </button>
      {open && <div className={s.drawerBd}>{children}</div>}
    </section>
  )
}
