import { Box, Link2, Maximize, Camera, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { ViewerController } from '../../domain/types'
import { Stub } from '../stub/Stub'
import { Badge, IconButton, Seg } from '../ui'
import s from './Viewer.module.css'

export const VIEW_MODES: Array<[ViewerController['viewMode'], string]> = [['shaded', 'Shaded'], ['x-ray', 'X-Ray'], ['wireframe', 'Wireframe'], ['hidden-line', 'Hidden Line']]

export interface OverlayLegendItem { label: string; tone: 'query' | 'overlap' | 'result'; value?: string }

/**
 * Placeholder CAD viewport with the real toolbar state. There is no real viewer: StubId cad-viewer.
 * View modes, linked cameras and the overlay legend are visual state only. Overlay colors are always labelled.
 *   Search compare: query only = red, overlap = blue, result only = green (labelled A red, B blue in catalogue compare).
 */
export function ViewerPlaceholder({ chip, image = '/cad-preview-2.png', legend, linkedCameras, onLinkedChange, children, height = 320 }: {
  chip: string; image?: string; legend?: OverlayLegendItem[]; linkedCameras?: boolean; onLinkedChange?: (v: boolean) => void; children?: ReactNode; height?: number
}) {
  const [mode, setMode] = useState<ViewerController['viewMode']>('shaded')
  return (
    <Stub id="cad-viewer" note="Placeholder viewport">
      <figure className={s.viewer} style={{ height }} data-testid="viewer-placeholder">
        <div className={s.toolbar}>
          <Seg value={mode} options={VIEW_MODES} onChange={setMode} label="View mode" />
          <span className="right row">
            {onLinkedChange && <IconButton label={linkedCameras ? 'Cameras linked' : 'Cameras unlinked'} ghost={!linkedCameras} onClick={() => onLinkedChange(!linkedCameras)}><Link2 size={14} /></IconButton>}
            <IconButton label="Fit"><Maximize size={14} /></IconButton>
            <IconButton label="Reset"><RotateCcw size={14} /></IconButton>
            <IconButton label="Snapshot"><Camera size={14} /></IconButton>
          </span>
        </div>
        <div className={s.stage}>
          <img src={image} alt="" className={`${s.model} ${mode === 'wireframe' ? s.wire : ''} ${mode === 'x-ray' ? s.xray : ''}`} />
          <span className={s.chip}>{chip}</span>
          <span className={s.cube} aria-hidden><Box size={20} /></span>
          <span className={s.axis} aria-hidden>X Y Z</span>
          {children}
        </div>
        {legend && (
          <figcaption className={s.legend}>
            {legend.map((l) => <span key={l.label} className={s.lg}><i className={s[l.tone]} />{l.label}{l.value && <b className="data"> {l.value}</b>}</span>)}
            <Badge tone="outline">Placeholder viewport</Badge>
          </figcaption>
        )}
      </figure>
    </Stub>
  )
}
