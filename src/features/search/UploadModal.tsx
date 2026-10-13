import { Upload } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, InlineError, Modal } from '../../components/ui'
import { Stub } from '../../components/stub/Stub'
import { useConfig } from '../../config/useConfig'
import type { SearchModality } from '../../domain/types'
import { findFileByName, searchFiles } from '../../fixtures/derive-search'
import type { SearchFile } from '../../fixtures/extras/search/types'
import { useWorkflowCtx } from '../../lib/workflowContext'
import { modalityById } from './modalities'
import { defineHref } from './query'
import s from './Search.module.css'

/** Accepted-format names (config) to file extensions. Example list, the real one is not fixed. */
const EXT: Record<string, string[]> = { SolidWorks: ['sldprt', 'sldasm'], STEP: ['step', 'stp'] }
const extensionsFor = (formats: string[]): string[] => formats.flatMap((f) => EXT[f] ?? [f.toLowerCase()])

/**
 * Upload popup (decided): drag and drop or a file selector. File contents are never parsed: the upload picks the library
 * fixture with the same name (StubId cad-parser). No match falls back to a sample of the right kind, said inline.
 */
export function UploadModal({ modality, onClose }: { modality: SearchModality; onClose: () => void }) {
  const config = useConfig()
  const nav = useNavigate()
  const ctx = useWorkflowCtx()
  const m = modalityById(modality)
  const exts = extensionsFor(config.acceptedFormats)
  const [over, setOver] = useState(false)
  const [picked, setPicked] = useState<{ upload: string; file?: SearchFile; note?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const samples = searchFiles.filter((f) => f.kind === m.needs && exts.includes(f.format.toLowerCase())).slice(0, 3)

  const take = (name: string) => {
    setError(null)
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    if (!exts.includes(ext)) { setPicked(null); setError(`${name} is not an accepted format. Accepted: ${config.acceptedFormats.join(', ')}.`); return }
    const hit = findFileByName(name)
    const file = hit && hit.kind === m.needs ? hit : undefined
    if (hit && !file) { setPicked(null); setError(`${m.name} needs ${m.needs === 'part' ? 'a part' : 'an assembly'}, but ${hit.name} is ${hit.kind === 'part' ? 'a part' : 'an assembly'}.`); return }
    if (file) setPicked({ upload: name, file })
    else setPicked({ upload: name, file: samples[0], note: `No library file is named ${name}. The prototype continues with a sample ${m.needs}.` })
  }
  const go = (f: SearchFile) => nav(defineHref({ file: f.id, modality, measurements: [], src: 'new' }, ctx))

  return (
    <Modal title={`Upload · ${m.name}`} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button primary disabled={!picked?.file} onClick={() => picked?.file && go(picked.file)}>Continue to Define</Button></>}>
      <div className="col" style={{ gap: 'var(--gap-3)' }}>
        <label className={s.drop} data-over={over} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) take(f.name) }}>
          <Upload size={20} aria-hidden />
          <span>Drop {m.needs === 'part' ? 'a part' : 'an assembly'} here, or click to browse</span>
          <span className="muted data">{config.acceptedFormats.join(' · ')}</span>
          <input type="file" hidden aria-label="Choose a CAD file" accept={exts.map((e) => `.${e}`).join(',')} onChange={(e) => { const f = e.target.files?.[0]; if (f) take(f.name) }} />
        </label>
        {error && <InlineError>{error}</InlineError>}
        {picked && (
          <Stub id="cad-parser" note="Library fixture picked by file name; contents are not parsed">
            <div className="col" style={{ gap: 'var(--gap-1)' }} data-testid="upload-match">
              <span className="text-label-caps">Matched library file</span>
              <span className="data">{picked.file?.name ?? '—'}</span>
              {picked.note && <span className="muted">{picked.note}</span>}
            </div>
          </Stub>
        )}
        <div className="col" style={{ gap: 'var(--gap-2)' }}>
          <span className="text-label-caps">Or use a sample {m.needs}</span>
          <div className={s.chips}>{samples.map((f) => <Button key={f.id} size="sm" className={s.sample} onClick={() => take(f.name)}><span className="trunc data">{f.name}</span></Button>)}</div>
        </div>
      </div>
    </Modal>
  )
}
