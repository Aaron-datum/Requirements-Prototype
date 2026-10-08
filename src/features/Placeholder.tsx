import { useBreadcrumbs } from '../components/shell/useBreadcrumbs'
import { EmptyState } from '../components/ui'

/** Temporary page for a route whose feature phase has not landed yet. Replaced by the owning phase. */
export function Placeholder({ title, phase, crumbs }: { title: string; phase: string; crumbs?: Array<{ label: string; to?: string }> }) {
  useBreadcrumbs(crumbs ?? [{ label: 'Home', to: '/' }, { label: title }])
  return <div style={{ flex: 1 }}><EmptyState title={title}>Not built yet. Lands in {phase}.</EmptyState></div>
}
