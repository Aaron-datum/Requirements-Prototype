import { Check, Search, X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import type { Tone } from '../../domain/types'
import { cn } from '../../lib/cn'
import { useToastStore } from '../../stores/toastStore'
import s from './ui.module.css'

/* ------------------------------ Buttons -------------------------------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; ghost?: boolean; danger?: boolean; size?: 'sm' | 'md' | 'lg' }
export function Button({ primary, ghost, danger, size = 'md', className, type = 'button', ...p }: BtnProps) {
  return <button type={type} className={cn(s.btn, primary && s.primary, ghost && s.ghost, danger && s.danger, size === 'sm' && s.sm, size === 'lg' && s.lg, className)} {...p} />
}
/** Icon-only button. aria-label is required (no visible label). */
export function IconButton({ label, children, ghost = true, ...p }: Omit<BtnProps, 'aria-label' | 'size'> & { label: string; children: ReactNode }) {
  return <Button size="sm" ghost={ghost} aria-label={label} title={label} className={cn(s.iconOnly, p.className)} {...p}>{children}</Button>
}
export function LinkButton({ className, type = 'button', ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn(s.link, className)} {...p} />
}

/* ------------------------------ Badges --------------------------------- */
export function Badge({ tone = 'neutral', pill, dashed, title, icon, children, className }: { tone?: Tone | 'outline'; pill?: boolean; dashed?: boolean; title?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <span className={cn(s.badge, s[tone], pill && s.pill, dashed && s.dashed, className)} title={title}>{icon}{children}</span>
}
export function Count({ n }: { n: number }) { return <span className={s.count}>{n}</span> }

/* --------------------------- Seg / Tabs -------------------------------- */
export function Seg<V extends string | number>({ value, options, onChange, label }: { value: V; options: Array<[V, string]> | readonly V[]; onChange: (v: V) => void; label?: string }) {
  const opts: Array<[V, string]> = (options as readonly unknown[]).map((o) => (Array.isArray(o) ? (o as [V, string]) : [o as V, String(o)]))
  return (
    <div className={s.seg} role="group" aria-label={label}>
      {opts.map(([v, l]) => <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}
export function Tabs<T extends string>({ value, tabs, onChange, label }: { value: T; tabs: Array<{ key: T; label: string; count?: number }>; onChange: (k: T) => void; label?: string }) {
  return (
    <div className={s.tabs} role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.key} type="button" role="tab" id={`tab-${t.key}`} aria-selected={t.key === value} className={s.tab} onClick={() => onChange(t.key)}>
          {t.label}{t.count != null && t.count > 0 && <span className={s.count}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------ Inputs --------------------------------- */
export function TextInput({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn(s.input, className)} {...p} /> }
export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label?: string }) {
  return (
    <div className={s.searchbox}>
      <Search size={14} aria-hidden />
      <input type="text" className={s.input} value={value} placeholder={placeholder} aria-label={label ?? placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
export function Checkbox({ checked, onChange, label, count, disabled, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; count?: number | string; disabled?: boolean; hint?: string }) {
  return (
    <label className={s.chk}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className={s.box} aria-hidden>{checked && <Check size={12} />}</span>
      <span className="grow trunc">{label}</span>
      {hint && <span className="muted">{hint}</span>}
      {count != null && <span className={cn(s.mono, 'muted')}>{count}</span>}
    </label>
  )
}

/* --------------------- Skeleton, empty, inline error ------------------- */
export function Skeleton({ width = '100%', height }: { width?: string | number; height?: number }) {
  return <span className={s.skel} style={{ width, height }} aria-hidden />
}
export function SkeletonRows({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div className={s.skelRows} role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} width={`${92 - ((i * 13) % 40)}%`} />)}
    </div>
  )
}
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className={s.empty}><div className={s.emptyTitle}>{title}</div>{children && <div>{children}</div>}{action}</div>
}
/** Errors are always inline, near the action, with a retry where one makes sense. Never toast-only. */
export function InlineError({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return <div className={s.error} role="alert"><div className="grow">{children}</div>{onRetry && <LinkButton onClick={onRetry}>Retry</LinkButton>}</div>
}

/* ------------------------------ Modal / toasts ------------------------- */
export function Modal({ title, onClose, children, footer, width }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className={s.scrim} onMouseDown={onClose}>
      <div className={s.modal} style={width ? { width } : undefined} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className={s.modalHd}><h2 className="text-section grow">{title}</h2><IconButton label="Close" onClick={onClose}><X size={14} /></IconButton></div>
        <div className={s.modalBd}>{children}</div>
        {footer && <div className={s.modalFt}>{footer}</div>}
      </div>
    </div>
  )
}
export function Toasts() {
  const { toasts, dismiss } = useToastStore()
  return (
    <div className={s.toasts} role="status" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={s.toast}><span className="grow">{t.message}</span><button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}><X size={14} /></button></div>)}
    </div>
  )
}
