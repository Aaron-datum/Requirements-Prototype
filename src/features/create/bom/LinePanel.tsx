import { Check, ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuditList } from '../../../components/audit/Audit'
import { FieldGroups } from '../../../components/fields/FieldRenderer'
import { SidePanel } from '../../../components/panels/Panels'
import { MatchQuality } from '../../../components/quality/MatchQuality'
import { Stub } from '../../../components/stub/Stub'
import { Badge, Button, EmptyState, SearchBox, Seg } from '../../../components/ui'
import { useConfig, useVocab } from '../../../config/useConfig'
import { parts, programById, requirementById } from '../../../fixtures/civic'
import {
  confidenceDecay, estimateModelFor, lineConfidence, plmRecord, priceAgeMonths, programShort, programsUsing, qualityOf, routingFor, routingInputOf, sourcingOptions, uncertaintyDrivers,
  type BomViewRow, type LineMode,
} from '../../../fixtures/derive-bom'
import { priceSourceLabel, rangePctFor } from '../../../fixtures/extras/bom/rules'
import { now } from '../../../lib/clock'
import { PLM_DISABLED_TIP } from '../../../services/stubs/plm'
import { BreakdownBars } from './BreakdownBars'
import { REVIEW_TABS, REQ_LINKS, money, useBomVocab, type ReviewTab } from './bomConfig'
import { useBomStore } from './bomStore'
import { findSurrogateLink, searchOnLink } from './searchLinks'
import { useRetryLine, useSurrogateActions } from './useBomData'
import s from './bom.module.css'

const PROGRAMS = ['PGM-CIV-LX', 'PGM-CIV-SPT', 'PGM-CIV-SI']

function MatchManually({ row, onPick }: { row: BomViewRow; onPick: (partId: string) => void }) {
  const [q, setQ] = useState('')
  const hits = q.trim().length > 1 ? parts.filter((p) => p.part_id !== row.partNumber && `${p.part_id} ${p.name}`.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : []
  return (
    <div className="col" data-testid="match-manually">
      <SearchBox value={q} onChange={setQ} placeholder="Search production parts by number or name" />
      {hits.map((p) => <div key={p.part_id} className="row"><span className="grow trunc">{p.name} <span className="data muted">{p.part_id}</span></span><Button size="sm" onClick={() => onPick(p.part_id)}>Use</Button></div>)}
      <span className="muted">Manual matches are tagged Provenance: manual and carry no computed score.</span>
    </div>
  )
}

/** The BOM line detail panel: Summary / Similarity / Costing / PLM (docs/01: 03). */
export function LinePanel({ row, tab, onTab, onClose, mode }: { row: BomViewRow; tab: ReviewTab; onTab: (t: ReviewTab) => void; onClose: () => void; mode: LineMode }) {
  const config = useConfig()
  const vocab = useVocab()
  const bvocab = useBomVocab()
  const sources = useBomStore((st) => st.sources)
  const retrying = useBomStore((st) => st.retrying)
  const retry = useRetryLine()
  const { accept, undo } = useSurrogateActions()
  const [floor, setFloor] = useState(60)
  const [ran, setRan] = useState<number | null>(null)
  const [manual, setManual] = useState(false)
  const quality = qualityOf(row, mode)
  const top = row.candidates[0]
  const approval = vocab.resolve('workflowApproval', row.confirmed ? config.matchRules.approval.confirmedRaw : config.matchRules.approval.pendingRaw)
  const gateAction = mode === 'carry' ? 'carry-forward' : mode === 'propose' ? 'propose' : 'ask-human'
  const agent = bvocab.resolve('agentAction', gateAction)
  const retryable = config.matchRules.retryTypes.includes(row.certainty)
  const connected = Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, v !== false]))
  const subject = { type: 'bom-line', id: row.id }

  const similar = (
    <>
      {mode === 'pending' && <EmptyState title="Run the surrogate search first">Similarity appears once the line has been matched against production parts.</EmptyState>}
      {mode === 'carry' && (
        <div className={s.panelCard}>
          <span className="text-label-caps">Provenance</span>
          <MatchQuality quality={quality} variant="full" />
          <span>{row.provenance}</span>
          <span className="muted">Identical geometry and material on {programsUsing(row.partNumber).filter((p) => p !== 'PGM-CIV-SI').map(programShort).join(' · ') || 'no other program'}; differs only in PLM metadata. Directly replaceable.</span>
        </div>
      )}
      {mode === 'propose' && row.similarTo && (
        <>
          <div className="row">
            <Badge tone={approval.tone} icon={row.confirmed ? <Check size={12} aria-hidden /> : undefined}>{row.confirmed ? 'Confirmed surrogate' : approval.label}</Badge>
            {row.confirmed && <span className="muted">{row.confirmedBy} · {row.confirmedAt?.slice(0, 10)}</span>}
          </div>
          <div className={s.panelCard} data-testid="similar-to">
            <div className="row"><span className="text-label-caps grow">Similar to</span><span className="data">{row.matchPct}%</span></div>
            <b>{parts.find((p) => p.part_id === row.similarTo?.partId)?.name ?? row.similarTo?.partId}</b>
            <span className="data muted">{row.similarTo?.partId} · {row.similarTo ? programById[row.similarTo.programId]?.name : ''}</span>
            {row.breakdown && <BreakdownBars breakdown={row.breakdown} />}
            <div className="row wrap">
              <Link to={`/create/bom/03b-compare?line=${row.id}${row.similarTo ? `&cand=${row.similarTo.partId}` : ''}`}><Button size="sm">Compare parts</Button></Link>
              <Button size="sm" disabled title={PLM_DISABLED_TIP}>PLM record</Button>
              {row.confirmed
                ? <Button size="sm" onClick={() => undo(row)}>Undo</Button>
                : <Button size="sm" primary onClick={() => accept(row, row.similarTo!.partId)}>Accept as surrogate</Button>}
            </div>
          </div>
          <MatchQuality quality={quality} variant="full" />
        </>
      )}
      {mode === 'estimate' && (
        <div className={s.panelCard}>
          <div className="row"><Badge tone={vocab.resolve('dataType', row.certainty).tone}>Estimated</Badge><span className="text-label-caps">Estimated · cost model</span></div>
          <span>{row.provenance}</span>
          {top && <span className="muted">Closest candidate {top.partId} scored {top.matchPct}%, below the surrogate floor of {config.thresholds.surrogateFloor}%.</span>}
          <MatchQuality quality={quality} variant="full" />
          <div className="row wrap">
            <Link to={`/create/bom/03d-cost?part=${row.partNumber}&line=${row.id}`}><Button size="sm">Open cost estimate</Button></Link>
            <Button size="sm" disabled title={PLM_DISABLED_TIP}>Request quote</Button>
          </div>
        </div>
      )}
      {mode === 'unresolved' && (
        <div className={s.panelCard} data-testid="unresolved">
          <div className="row"><MatchQuality quality={quality} onRetry={retryable ? () => void retry(row) : undefined} /></div>
          <span>{row.provenance}</span>
          {row.carryNote && <span className="muted">{row.carryNote}</span>}
          <span className="text-label-caps">Loosen the search</span>
          <div className="row wrap"><span className="muted">Similarity floor</span><Seg value={floor} onChange={setFloor} label="Similarity floor" options={[[60, '60%'], [55, '55%'], [50, '50%'], [45, '45%']]} /></div>
          <div className="row wrap">
            <Button size="sm" disabled={retrying} onClick={() => (retryable ? void retry(row) : setRan(floor))}>{retrying ? 'Re-running' : 'Re-run'}</Button>
            <Button size="sm" disabled title="Not wired in the prototype">Edit parameters</Button>
            <Button size="sm" primary onClick={() => setManual(true)}>Match manually</Button>
          </div>
          {ran != null && <span className="muted" role="status">Re-run with floor {ran}%: no candidate found. Try Match manually.</span>}
          {manual && <MatchManually row={row} onPick={(id) => { accept(row, id); setManual(false) }} />}
        </div>
      )}
      <div className="row wrap">
        <Link to={findSurrogateLink(row.partNumber, row.id)}><Button size="sm"><Search size={14} aria-hidden />Find a surrogate</Button></Link>
        <a href={searchOnLink(row.partNumber, row.id)} target="_blank" rel="noreferrer"><Button size="sm"><ExternalLink size={14} aria-hidden />Search on</Button></a>
      </div>
      {(mode === 'propose' || mode === 'estimate') && row.candidates.length > 1 && (
        <div className="col"><span className="text-label-caps">Other candidates · {row.candidates.length - 1}</span>
          {row.candidates.slice(1).map((c) => (
            <div key={c.partId + c.programId} className="row" data-testid="other-candidate"><span className="grow"><b className="data">{c.partId}</b> <span className="muted">{programShort(c.programId)} · {parts.find((p) => p.part_id === c.partId)?.name}</span></span><span className="data">{c.matchPct}%</span>
              {mode === 'propose' && <Button size="sm" onClick={() => accept(row, c.partId)}>Accept</Button>}</div>
          ))}</div>
      )}
      <div className="col"><span className="text-label-caps">Audit</span><AuditList subject={subject} emptyText="No decisions recorded for this line." /></div>
    </>
  )

  const conf = lineConfidence(row, mode, !connected.sap)
  const range = rangePctFor(conf)
  const inp = routingInputOf(row)
  const est = row.unitPrice != null && row.origin === 'dataset' ? estimateModelFor(row.partNumber, inp, {}) : null
  const routing = routingFor(inp)
  const drv = uncertaintyDrivers(row, connected)
  const months = priceAgeMonths(now())
  const opts = est ? sourcingOptions(inp, est.landed, row.certainty, est.landedConfidence) : []

  const costing = (
    <Stub id="cost-model" note="Ranges, drivers and options are derived">
      <div className="col" style={{ gap: 'var(--gap-4)' }}>
        {row.unitPrice == null ? <EmptyState title={mode === 'pending' ? 'Run the surrogate search first' : 'No price for this line'}>{mode === 'pending' ? 'Prices resolve once the line is matched.' : 'A line with no resolved match is not priced.'}</EmptyState> : (<>
          <div className="col" style={{ gap: 4 }}>
            <span className={s.statN} data-testid="line-price">{money(row.unitPrice)}</span>
            <span className="data muted">Range {money(row.unitPrice * (1 - range / 100))} to {money(row.unitPrice * (1 + range / 100))} · ±{range}%</span>
            <div className="row wrap"><MatchQuality quality={{ confidence: { score: conf, why: [`Price source: ${row.priceSource}`, `Range rule: ±${range}% at confidence ${conf}`] } }} />
              <span className="muted">−{confidenceDecay(months)} pts since {`2026-06`}</span></div>
            <span className="muted">{priceSourceLabel(row.priceSource, connected.sap !== false)} · {row.currency}</span>
          </div>
          <div className="col"><span className="text-label-caps">Uncertainty drivers</span>
            {drv.drivers.map((d) => <div key={d.name} className="row" data-driver={d.name}><span style={{ minWidth: 104 }}>{d.name}</span><span className="data" style={{ minWidth: 52 }}>±{d.pct}%</span><span className="muted grow trunc">{d.note}</span></div>)}
            <span className="muted" title="Root-sum-square of the four drivers">Combined ±{drv.combinedPct}% (root-sum-square)</span></div>
        </>)}
        <div className="col"><span className="text-label-caps">Where it is made</span>
          <dl className={s.kv}><dt>Supplier</dt><dd>{row.supplier || '—'}</dd><dt>Region</dt><dd className="data">{row.region || '—'}</dd><dt>Method</dt><dd>{row.method}</dd><dt>Lead time</dt><dd className="data">{row.leadWeeks} wk</dd></dl></div>
        {opts.length > 0 && (
          <div className="col"><span className="text-label-caps">Sourcing options · read-only</span>
            {opts.map((o) => <div key={o.supplierId} className="row"><span className="grow trunc">{o.supplier.name}{o.current && <span className="muted"> · current</span>}</span><span className="data">{money(o.landed)}</span></div>)}
            <Button size="sm" disabled title="Changing suppliers is read-only in the prototype (D-12)">Change suppliers</Button></div>
        )}
        {est && (
          <div className="col"><span className="text-label-caps">Cost model routing</span><span>{routing.modelName}</span>
            <span className="muted">Routing score {routing.models[0]!.score} · {bvocab.resolve('routingStatus', routing.statusRaw).label}</span></div>
        )}
        <div className="row wrap">
          <Link to={`/create/bom/03d-cost?part=${row.partNumber}&line=${row.id}`}><Button size="sm" primary disabled={mode === 'pending'}>Open Cost Estimate</Button></Link>
          <Link to={`/create/bom/03d-cost?part=${row.partNumber}&line=${row.id}&view=sourcing`}><Button size="sm" disabled={mode === 'pending'}>Compare Suppliers</Button></Link>
        </div>
      </div>
    </Stub>
  )

  const summary = (
    <>
      <div className="col"><span className="text-label-caps">At a glance</span>
        <dl className={s.kv}>
          <dt>Assembly</dt><dd>{row.subassembly}</dd><dt>Quantity</dt><dd className="data">{row.quantity} per unit</dd>
          <dt>Lineage</dt><dd>{mode === 'pending' ? '—' : row.provenance}</dd>
          <dt>CAD</dt><dd>{bvocab.resolve('cadFlag', row.hasCad ? 'has-cad' : 'no-cad').label}</dd>
          <dt>Material</dt><dd>{row.material}</dd><dt>Manufacture</dt><dd>{row.method}</dd><dt>Supplier</dt><dd>{row.supplier || '—'}</dd>
        </dl></div>
      <div className="col" data-testid="agent-gate"><span className="text-label-caps">What the agent may do</span>
        <Stub id="autonomy-gate" note="Rule table by data type"><span className="row"><Badge tone={agent.tone} title={agent.description}>{mode === 'pending' ? 'Not searched' : agent.label}</Badge><span className="muted grow">{mode === 'pending' ? '' : agent.description}</span></span></Stub></div>
      <div className="col"><span className="text-label-caps">Program usage · {row.origin === 'dataset' ? `${programsUsing(row.partNumber).length} of ${PROGRAMS.length} programs` : 'new line'}</span>
        {PROGRAMS.map((p) => { const used = row.origin === 'dataset' ? programsUsing(row.partNumber).includes(p) : p === 'PGM-CIV-SI'; return <div key={p} className="row"><span className={used ? '' : 'muted'}>{programById[p]?.name}</span><span className="data muted right">{used ? `${row.quantity}/unit` : 'not used'}</span></div> })}</div>
      <div className="col"><span className="text-label-caps">Linked requirements · {row.requirementIds.length}</span>
        {row.requirementIds.length === 0 ? <span className="muted">None linked to this part.</span> : row.requirementIds.map((id) => (
          <Link key={id} to={REQ_LINKS.trace(id)} className="row"><span className="data">{id}</span><span className="grow trunc">{requirementById[id]?.title}</span></Link>))}</div>
      <div className="col"><span className="text-label-caps">Physical match</span>
        <span>{mode === 'pending' ? 'Not searched yet.' : mode === 'carry' ? 'Identical part already in production.' : row.matchPct != null && row.similarTo ? `Closest: ${row.similarTo.partId} · ${row.matchPct}%` : 'No equivalent on any program.'}</span>
        <button type="button" style={{ background: 'none', border: 0, padding: 0, color: 'var(--accent)', textAlign: 'left' }} onClick={() => onTab('similarity')}>Open similarity detail</button></div>
      <div className="col"><span className="text-label-caps">Cost</span><span className="data">{money(row.unitPrice)}</span><span className="muted">{row.priceSource || '—'}</span>
        <button type="button" style={{ background: 'none', border: 0, padding: 0, color: 'var(--accent)', textAlign: 'left' }} onClick={() => onTab('costing')}>Open costing detail</button></div>
      <div className="col"><span className="text-label-caps">Audit</span><AuditList subject={subject} emptyText="No decisions recorded for this line." /></div>
    </>
  )

  const plm = (
    <>
      <FieldGroups record={plmRecord(row)} />
      <Button disabled title={PLM_DISABLED_TIP}>Open in PLM</Button>
    </>
  )

  return (
    <SidePanel title={row.name} subtitle={`${row.partNumber} · ${row.subassembly}`} badge={<Stub id="matching-engine" note="Simulated match"><MatchQuality quality={quality} /></Stub>}
      onClose={onClose} tabs={[...REVIEW_TABS]} tab={tab} onTab={onTab} defaultWidth={380}>
      <span hidden data-testid="line-panel" data-line={row.id} />
      {tab === 'summary' && summary}
      {tab === 'similarity' && <Stub id="matching-engine" note="Pre-baked scores and candidates"><div className="col" style={{ gap: 'var(--gap-4)' }}>{similar}</div></Stub>}
      {tab === 'costing' && costing}
      {tab === 'plm' && plm}
    </SidePanel>
  )
}
