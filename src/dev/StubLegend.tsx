import { useBreadcrumbs } from '../components/shell/useBreadcrumbs'
import { STUB_REGISTRY } from '../components/stub/registry'
import { Badge } from '../components/ui'

/** /dev/stubs: every StubId with its owner role, what the prototype does instead, and the screens that use it. Generated from the registry. */
export function StubLegend() {
  useBreadcrumbs([{ label: 'Dev', to: '/dev/kitchen-sink' }, { label: 'Stubs' }])
  return (
    <div style={{ padding: 'var(--layout-1)', overflow: 'auto', flex: 1 }}>
      <h1 className="text-page">Stub legend</h1>
      <p className="secondary" style={{ margin: 'var(--gap-2) 0 var(--gap-4)' }}>Every simulated output is wrapped in a Stub marker. Add <span className="data">?showStubs=1</span> to outline them. Swap a stub for a real service by implementing the interface in <span className="data">src/domain/types.ts</span>.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="stub-table">
        <thead><tr>{['Stub', 'Owner', 'What the prototype does instead', 'Screens'].map((h) => <th key={h} className="text-label-caps" style={{ textAlign: 'left', padding: 'var(--gap-2)', borderBottom: '1px solid var(--border-default)' }}>{h}</th>)}</tr></thead>
        <tbody>
          {STUB_REGISTRY.map((s) => (
            <tr key={s.id} data-stub-row={s.id}>
              <td style={{ padding: 'var(--gap-2)', borderBottom: '1px solid var(--border-default)' }}><span className="data">{s.id}</span></td>
              <td style={{ padding: 'var(--gap-2)', borderBottom: '1px solid var(--border-default)' }}><Badge tone="outline">{s.owner}</Badge></td>
              <td style={{ padding: 'var(--gap-2)', borderBottom: '1px solid var(--border-default)', maxWidth: 560 }}>{s.does}</td>
              <td style={{ padding: 'var(--gap-2)', borderBottom: '1px solid var(--border-default)' }}>{s.screens.length ? s.screens.join(', ') : <span className="muted">none</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
