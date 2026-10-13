import { useVocab } from '../../config/useConfig'
import type { CatalogueFieldDef } from '../../config/catalogueConfig'
import { Badge } from '../../components/ui'
import { formatCell, type Cell } from './compareLogic'

/** One field value. Vocabulary fields (Reuse status, Status) render through the tenant vocabulary; numbers carry their unit; missing is a dash. */
export function CellView({ def, value }: { def: Pick<CatalogueFieldDef, 'vocabularyId' | 'unit' | 'mono'>; value: Cell }) {
  const vocab = useVocab()
  if (value == null) return <span className="muted" aria-label="No value">—</span>
  if (def.vocabularyId) {
    const r = vocab.resolve(def.vocabularyId, value)
    return <Badge tone={r.tone} title={r.known ? undefined : 'Unknown value shown as received'}>{r.label}</Badge>
  }
  return <span className={def.mono ? 'data' : undefined}>{formatCell(value, def.unit)}</span>
}
