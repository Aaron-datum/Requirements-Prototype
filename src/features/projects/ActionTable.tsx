import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TableShell } from '../../components/table/TableShell'
import type { ColumnDef } from '../../components/table/types'
import { useVocab } from '../../config/useConfig'
import type { ActionRow } from '../../fixtures/derive-projects'
import { KindBadge, SeverityBadge, kindLabel, ownerName, useVocabOrder } from './shared'
import s from './Projects.module.css'

/**
 * Band 5: the overflow table. The shared TableShell (D-11) listing every action row. Due date, downstream impact, severity and
 * owner are pinned columns, so no row ever lacks one of the four. Filters live in the shell's Filters tab and in the URL.
 */
export function ActionTable({ rows, loading, error, onRetry, scopeLabel }: { rows: ActionRow[]; loading?: boolean; error?: string | null; onRetry?: () => void; scopeLabel: string }) {
  const { resolve } = useVocab()
  const severityOrder = useVocabOrder('severity')
  const columns = useMemo<Array<ColumnDef<ActionRow>>>(() => [
    { key: 'title', label: 'Item', get: (r) => r.title, filter: 'text-search', pinned: true, width: '34%', render: (r) => <span className="col" style={{ gap: 2 }}><Link to={r.to}>{r.title}</Link><span className="muted" style={{ fontSize: 'var(--text-badge)' }}>{kindLabel(r.kind)}</span></span> },
    { key: 'kind', label: 'Type', get: (r) => r.kind, filter: 'multi-tag', label_of: kindLabel, defaultVisible: false, render: (r) => <KindBadge raw={r.kind} /> },
    { key: 'severity', label: 'Severity', get: (r) => r.severity, filter: 'level-seg', order: severityOrder, label_of: (raw) => resolve('severity', raw).label, pinned: true, render: (r) => <SeverityBadge raw={r.severity} /> },
    { key: 'owner', label: 'Owner', get: (r) => r.owner, filter: 'multi-tag', pinned: true, render: (r) => <span title={r.owner} style={{ whiteSpace: 'nowrap' }}>{ownerName(r.owner)}</span> },
    { key: 'due', label: 'Due', get: (r) => r.due, filter: 'multi-tag', pinned: true, render: (r) => <span className="data" style={{ whiteSpace: 'nowrap' }} title={`Inherited from ${r.dueFrom}`}>{r.due}</span> },
    { key: 'impact', label: 'Downstream impact', get: (r) => r.impact, filter: 'text-search', pinned: true, width: '36%', render: (r) => <span className={s.cellImpact}>{r.impact}</span> },
    { key: 'status', label: 'Status', get: (r) => r.status, filter: 'text-search', defaultVisible: false },
  ], [resolve, severityOrder])
  return (
    <div className={s.tableWrap} data-testid="action-table">
      <TableShell<ActionRow> id="actions" noun="action rows" title={`Action rows · ${scopeLabel}`} columns={columns} rows={rows} rowId={(r) => r.id} urlSync sidebarWidth={240}
        loading={loading} error={error} onRetry={onRetry}
        rowTone={(r) => (r.kind === 'dangerous-case' ? 'danger' : undefined)}
        empty={{ title: 'No open action rows', body: 'Everything in this scope has a decision.' }} />
    </div>
  )
}
