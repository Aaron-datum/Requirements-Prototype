import { useParams } from 'react-router-dom'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { EmptyState } from '../../components/ui'

const NAMES: Record<string, string> = { warranty: 'Warranty Analysis', replacement: 'Part Replacement' }
/** Warranty Analysis and Part Replacement are listed in the Create nav but are not designed yet. */
export function ComingSoon() {
  const { id = '' } = useParams()
  const name = NAMES[id] ?? 'Workflow'
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: name }])
  return <div style={{ flex: 1 }}><EmptyState title={name}>Not available yet. Try BOM Creation.</EmptyState></div>
}
