import { CircleHelp, Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useConfig, useVocab } from '../../config/useConfig'
import type { MatchQuality as MatchQualityData, Tone } from '../../domain/types'
import { Badge, LinkButton } from '../ui'
import s from './MatchQuality.module.css'

/** Labels for the two duplicate classifications. There is no "Exact" anywhere (it is not a status). */
export const DUPLICATE_LABEL = { 'geometric-duplicate': 'Geometric duplicate', 'duplicate-file': 'Duplicate file' } as const

const toneClass: Record<Tone, string> = { pass: s.pass, info: s.info, warn: s.warn, fail: s.fail, neutral: s.neutral }

/**
 * The one shared component for "how good, how sure, what kind of data".
 * Three independent dimensions: confidence (numeric or word badge, with a "why" affordance), similarity (percent + bar,
 * banded from config), data type (chip beside the bar, never inside it). Duplicate classification and provenance are
 * additional chips. A row can carry all three, any one, or none. Color is always paired with a readout.
 *   variant 'row'  : compact, for tables.   variant 'full': stacked, for panels and the Similarity tab.
 */
export function MatchQuality({ quality, variant = 'row', onRetry }: { quality: MatchQualityData; variant?: 'row' | 'full'; onRetry?: () => void }) {
  const config = useConfig()
  const vocab = useVocab()
  const [why, setWhy] = useState(false)
  const { confidence, similarity, dataType, duplicate, provenance } = quality

  const type = dataType ? vocab.resolve('dataType', dataType.raw) : null
  const hideSimilarity = !!dataType && config.matchRules.noSimilarityTypes.includes(dataType.raw)
  const canRetry = !!dataType && config.matchRules.retryTypes.includes(dataType.raw)
  const band = similarity && !hideSimilarity ? vocab.band(similarity.percent) : null
  const asserted = !!provenance && config.matchRules.assertedOrigins.includes(provenance.origin) && !provenance.verifiedBy
  const hasWhy = !!confidence && (confidence.why?.length || provenance?.tags?.length)
  const numeric = confidence?.score != null

  if (!confidence && !similarity && !dataType && !duplicate && !provenance) {
    return <span className={s.none} data-testid="match-none">—</span>
  }

  return (
    <div className={`${s.root} ${variant === 'full' ? s.full : ''}`} data-testid="match-quality">
      {similarity && !hideSimilarity && band && (
        <div className={s.sim} aria-label={`Similarity ${similarity.percent}% (${band.label})`}>
          <div className={s.bar} role="meter" aria-valuenow={similarity.percent} aria-valuemin={0} aria-valuemax={100}>
            <i className={toneClass[band.tone]} style={{ width: `${similarity.percent}%` }} />
          </div>
          <span className={`${s.pct} data`}>{similarity.percent}%</span>
          <span className={s.band}>{band.label}</span>
        </div>
      )}
      {(type || duplicate || confidence || provenance) && (
        <div className={s.chips}>
          {type && <Badge tone={type.tone} title={type.description}>{type.label}</Badge>}
          {duplicate && <Badge tone="info" icon={<Copy size={12} aria-hidden />}>{DUPLICATE_LABEL[duplicate]}</Badge>}
          {confidence && (
            <Badge tone="outline" title="Confidence: how sure the system is">
              <span className={s.k}>Conf</span>{numeric ? <span className="data">{confidence.score}%</span> : <span>{confidence.label}</span>}
            </Badge>
          )}
          {provenance && (
            <Badge tone={asserted ? 'warn' : 'outline'} dashed={provenance.origin !== 'computed'} title={asserted ? 'Asserted, not computed, until a reviewer verifies it' : undefined}>
              {provenance.origin === 'computed' ? 'Computed' : provenance.origin === 'confirmed' ? 'Confirmed' : provenance.origin === 'manual' ? 'Manual' : 'Asserted'}
            </Badge>
          )}
          {hasWhy && (
            <span className={s.whyWrap}>
              <button type="button" className={s.whyBtn} aria-expanded={why} aria-label="Why this confidence" onClick={() => setWhy(!why)}><CircleHelp size={14} /></button>
              {why && (
                <div className={s.popover} role="dialog" aria-label="Why">
                  <div className="text-label-caps">Why</div>
                  <ul>{confidence?.why?.map((w) => <li key={w}>{w}</li>)}</ul>
                  {provenance?.tags && <div className={s.tags}>{provenance.tags.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}</div>}
                  {provenance?.verifiedAt && <div className="muted">Last verified {provenance.verifiedAt.slice(0, 10)}{provenance.verifiedBy ? ` by ${provenance.verifiedBy}` : ''}</div>}
                </div>
              )}
            </span>
          )}
          {canRetry && onRetry && <LinkButton onClick={onRetry}><RefreshCw size={12} aria-hidden /> Retry</LinkButton>}
        </div>
      )}
    </div>
  )
}
