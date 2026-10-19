import { Box, GitCompareArrows } from 'lucide-react'
import { useState } from 'react'
import { FieldRenderer } from '../../components/fields/FieldRenderer'
import { SidePanel } from '../../components/panels/Panels'
import { Badge, Button, Modal } from '../../components/ui'
import { ViewerPlaceholder } from '../../components/viewer/Viewer'
import { CATALOGUE_RECORD_FIELDS, CATALOGUE_RECORD_LABELS, CATALOGUE_SPEC_FIELDS, compareFieldByKey } from '../../config/catalogueConfig'
import { useVocab } from '../../config/useConfig'
import type { CatalogueRowX } from '../../domain/catalogue'
import { CellView } from './CellView'
import { fieldValue } from './compareLogic'
import { DecisionButtons, OpenInPlm, SearchOnLink } from './PartActions'
import s from './catalogue.module.css'

/**
 * Part detail drawer (the shared SidePanel). Empty, never gone: with no part selected it says so.
 * Spec section, PLM Data (schema-driven FieldRenderer), Used On, Open in Viewer, Open in PLM (disabled), Add to Compare, Search on,
 * and the workflow's decision action only when the catalogue was reached from a workflow.
 */
export function PartDrawer({ part, inCompare, onToggleCompare, onClose, emptyText = 'Select a part to see its detail here.' }: {
  part: CatalogueRowX | null; inCompare: boolean; onToggleCompare: () => void; onClose: () => void; emptyText?: string
}) {
  const vocab = useVocab()
  const [viewer, setViewer] = useState(false)
  if (!part) return <SidePanel title="" defaultWidth={340} empty={<span data-testid="drawer-empty">{emptyText}</span>}>{null}</SidePanel>
  const reuse = vocab.resolve('reuseStatus', part.reuseStatus)
  return (
    <SidePanel title={<span className="data">{part.partNumber}</span>} subtitle={part.description} badge={<Badge tone={reuse.tone}>{reuse.label}</Badge>} onClose={onClose} defaultWidth={340}
      footer={(
        <div className={s.footBtns}>
          <Button size="sm" onClick={onToggleCompare} aria-pressed={inCompare}><GitCompareArrows size={14} aria-hidden />{inCompare ? 'Remove from Compare' : 'Add to Compare'}</Button>
          <SearchOnLink partNumber={part.partNumber} />
          <OpenInPlm partNumber={part.partNumber} />
          <DecisionButtons partNumber={part.partNumber} />
        </div>
      )}>
      <div data-testid="part-drawer" data-part={part.partNumber} className={s.sec} style={{ gap: 'var(--gap-4)' }}>
        <div className={s.sec}>
          <img className={s.thumb} src={part.image} alt="" />
          <Button size="sm" onClick={() => setViewer(true)}><Box size={14} aria-hidden />Open in Viewer</Button>
        </div>
        <section className={s.sec} aria-label="Specification">
          <h3 className="text-label-caps">Specification</h3>
          <dl className={s.dl}>
            {CATALOGUE_SPEC_FIELDS.map((k) => { const d = compareFieldByKey(k); if (!d) return null; return <div key={k} style={{ display: 'contents' }}><dt>{d.label}</dt><dd><CellView def={d} value={fieldValue(part, d)} /></dd></div> })}
          </dl>
        </section>
        <section className={s.sec} aria-label="PLM Data">
          <h3 className="text-label-caps">PLM Data</h3>
          <FieldRenderer record={part.plm} />
          <dl className={s.dl}>
            {CATALOGUE_RECORD_FIELDS.map((k) => { const d = compareFieldByKey(k); const v = d ? fieldValue(part, d) : (part.fields[k] ?? null); return <div key={k} style={{ display: 'contents' }}><dt>{d?.label ?? CATALOGUE_RECORD_LABELS[k] ?? k}</dt><dd>{d ? <CellView def={d} value={v} /> : <span>{v ?? '—'}</span>}</dd></div> })}
          </dl>
        </section>
        <section className={s.sec} aria-label="Used on">
          <h3 className="text-label-caps">Used on</h3>
          {part.usedOn.length === 0 ? <span className="muted">Not used on any assembly.</span> : (
            <ul className={s.usedOn}>{part.usedOn.map((u) => <li key={u.name}><span>{u.name} <span className="muted">· {u.program}</span></span><span className="data muted">{u.uses} uses</span></li>)}</ul>
          )}
        </section>
      </div>
      {viewer && (
        <Modal title={`Viewer · ${part.partNumber}`} width={760} onClose={() => setViewer(false)}>
          <ViewerPlaceholder chip={part.partNumber} height={380} />
        </Modal>
      )}
    </SidePanel>
  )
}
