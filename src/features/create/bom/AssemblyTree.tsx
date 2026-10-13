import { Box, ChevronDown, ChevronRight, Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Stub } from '../../../components/stub/Stub'
import { Badge, Button, Checkbox, EmptyState, Modal, TextInput } from '../../../components/ui'
import { INTAKE, INTAKE_META, hasCadFlag, isIncluded, SUBASSEMBLY_ORDER, trackCounts, treeGroups, treeSummary, type TreeRow } from '../../../fixtures/derive-bom'
import { toastSuccess } from '../../../stores/toastStore'
import { useBomVocab } from './bomConfig'
import { useBomStore } from './bomStore'
import s from './bom.module.css'

/** CAD status is binary: an icon with an upload action (docs/01: 02). No CAD caps certainty at Estimated. */
function CadFlag({ row, on, onAttach }: { row: TreeRow; on: boolean; onAttach: () => void }) {
  const vocab = useBomVocab()
  const label = vocab.resolve('cadFlag', on ? 'has-cad' : 'no-cad').label
  return on
    ? <span className={s.cad} title={label} data-cad="has"><Box size={14} aria-hidden /><span className="sr-only">{label}</span></span>
    : <span className={`${s.cad} ${s.cadNo}`} data-cad="none">
        <button type="button" className={s.cadBtn} aria-label={`${label}: upload CAD for ${row.name}`} title="Upload CAD" onClick={onAttach}><Box size={14} strokeDasharray="3 2" aria-hidden /><Upload size={12} aria-hidden /></button>
        <span className="muted">{label}</span>
      </span>
}

/** 02 Assembly tree: choose which parsed CAD parts become blank BOM lines. */
export function AssemblyTree() {
  const nav = useNavigate()
  const routes = useBomStore((st) => st.routes)
  const tree = useBomStore((st) => st.tree)
  const { setIncluded, addManual, removeManual, attachCad } = useBomStore.getState()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', subassembly: SUBASSEMBLY_ORDER[0]!, quantity: 1 })
  const t = trackCounts(routes)
  const sum = treeSummary(tree)

  if (!t.assemblyRouted) {
    return <div className={s.page}><EmptyState title="No CAD assembly is routed to CAD → BOM" action={<Link to="/create/bom/01-intake"><Button primary>Back to RFQ intake</Button></Link>}>Route the assembly on RFQ intake to build the tree.</EmptyState></div>
  }
  const groups = treeGroups(tree)
  const rowLabel = (r: TreeRow) => (r.kind === 'reference' ? 'Reference' : r.kind === 'manual' ? 'Manual' : null)

  return (
    <div className={s.treeLayout} data-testid="assembly-tree">
      <div className={s.treeMain}>
        <div className={s.pageHead}>
          <div className="col" style={{ gap: 4 }}><h1 className="text-page">Select components for the BOM</h1>
            <span className="secondary"><span className="data">{INTAKE.files[0]!.name}</span> · {INTAKE.files[0]!.sizeLabel} · {t.cad.subassemblies} subassemblies</span></div>
        </div>
        <div className="row wrap">
          <h2 className="text-section">Assembly tree</h2>
          <Badge tone="pass" icon={<Box size={12} aria-hidden />}>Has CAD</Badge>
          <Badge tone="neutral" icon={<Box size={12} strokeDasharray="3 2" aria-hidden />}>No CAD</Badge>
          <Button className="right" size="sm" onClick={() => setAdding(true)}><Plus size={14} aria-hidden />Add Manual Line</Button>
        </div>
        <Stub id="cad-parser" note="Fixed assembly tree">
          <div className={s.tableWrap}>
            {groups.map((g) => {
              const included = g.rows.filter((r) => isIncluded(r, tree)).length
              const togglable = g.rows.filter((r) => r.kind === 'part')
              const isOpen = open[g.name] !== false
              return (
                <div key={g.name} className={s.group} data-group={g.name}>
                  <div className={s.groupHead} onClick={() => setOpen({ ...open, [g.name]: !isOpen })} role="button" tabIndex={0} aria-expanded={isOpen}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen({ ...open, [g.name]: !isOpen }) } }}>
                    {isOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                    <span>{g.name}</span><span className="data muted">{included} of {g.rows.length} parts</span>
                    <button type="button" className="right" style={{ background: 'none', border: 0, color: 'var(--accent)' }} onClick={(e) => { e.stopPropagation(); setIncluded(togglable.map((r) => r.id), !togglable.every((r) => isIncluded(r, tree))) }}>
                      {togglable.every((r) => isIncluded(r, tree)) ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  {isOpen && g.rows.map((r) => {
                    const inc = isIncluded(r, tree)
                    const cad = hasCadFlag(r, tree)
                    return (
                      <div key={r.id} className={`${s.treeRow} ${inc ? '' : s.treeRowOff}`} data-row={r.id}>
                        {r.kind === 'manual'
                          ? <span style={{ width: 16 }} />
                          : <Checkbox checked={inc} onChange={(on) => setIncluded([r.id], on)} label={<span className="sr-only">Include {r.name}</span>} />}
                        <span className="grow trunc">{r.name}</span>
                        {rowLabel(r) && <Badge tone="outline">{rowLabel(r)}</Badge>}
                        {inc && <CadFlag row={r} on={cad} onAttach={() => { attachCad(r.id); toastSuccess(`CAD attached: ${r.name}`) }} />}
                        {r.kind === 'reference' && !inc && <Button size="sm" onClick={() => setIncluded([r.id], true)}>Include</Button>}
                        {r.kind === 'manual' && <button type="button" style={{ background: 'none', border: 0, color: 'var(--accent)' }} onClick={() => removeManual(r.id)}>Remove</button>}
                        <span className="data muted" style={{ minWidth: 96, textAlign: 'right' }}>{r.partNumber}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </Stub>
      </div>
      <aside className={s.treeSide} aria-label="BOM summary" data-testid="tree-summary">
        <span className="text-label-caps">Blank BOM</span>
        <div className="row" style={{ alignItems: 'baseline' }}><span className={s.statN} data-testid="tree-lines">{sum.lines}</span><span className="secondary" data-testid="tree-footer">lines from {sum.parts + sum.manual} parts</span></div>
        <dl className={s.kv} style={{ gridTemplateColumns: '1fr auto' }}>
          <dt>Selected parts</dt><dd className="data">{sum.selected}</dd>
          <dt>Excluded by you</dt><dd className="data">{sum.excludedByYou}</dd>
          <dt>Reference excluded</dt><dd className="data">{sum.referenceExcluded}</dd>
          <dt>Manual lines</dt><dd className="data">{sum.manual}</dd>
          <dt>No CAD</dt><dd className="data">{sum.noCad}</dd>
          <dt>Programs</dt><dd>{INTAKE_META.builtOff}</dd>
        </dl>
        <div style={{ marginTop: 'auto' }}><Button primary size="lg" style={{ width: '100%' }} disabled={sum.lines === 0} onClick={() => nav('/create/bom/03-review')}>Create BOM</Button></div>
      </aside>
      {adding && (
        <Modal title="Add manual line" onClose={() => setAdding(false)}
          footer={<><Button onClick={() => setAdding(false)}>Cancel</Button>
            <Button primary disabled={!draft.name.trim()} onClick={() => { const l = addManual({ name: draft.name.trim(), subassembly: draft.subassembly, quantity: draft.quantity }); toastSuccess(`Manual line added: ${l.name}`); setDraft({ ...draft, name: '' }); setAdding(false) }}>Add line</Button></>}>
          <div className="col" style={{ gap: 'var(--gap-3)' }}>
            <label className="col" style={{ gap: 4 }}><span className="text-label-caps">Part name</span><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Part name" autoFocus /></label>
            <label className="col" style={{ gap: 4 }}><span className="text-label-caps">Subassembly</span>
              <select value={draft.subassembly} onChange={(e) => setDraft({ ...draft, subassembly: e.target.value })} aria-label="Subassembly" style={{ height: 'var(--input-height)', background: 'var(--bg-card)', color: 'var(--fg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)' }}>
                {SUBASSEMBLY_ORDER.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="col" style={{ gap: 4 }}><span className="text-label-caps">Quantity</span><TextInput type="number" min={1} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Math.max(1, Number(e.target.value) || 1) })} aria-label="Quantity" style={{ width: 96 }} /></label>
            <span className="muted">Manual lines have no CAD. Certainty is capped at Estimated.</span>
          </div>
        </Modal>
      )}
    </div>
  )
}
