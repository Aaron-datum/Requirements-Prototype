import { Network, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApprovalButton, AuditList } from '../../../../components/audit/Audit'
import { SidePanel } from '../../../../components/panels/Panels'
import { MatchQuality } from '../../../../components/quality/MatchQuality'
import { Stub } from '../../../../components/stub/Stub'
import { useBreadcrumbs } from '../../../../components/shell/useBreadcrumbs'
import { Badge, Button, LinkButton, SearchBox } from '../../../../components/ui'
import { RFQ_ID } from '../../../../fixtures/civic'
import {
  allEvidenceRecords, chainHops, evidenceCandidates, evidenceTrail, lineage, splitByFloor, undeterminedReason, type EvidenceCandidate, type ReqView,
} from '../../../../fixtures/derive-requirements'
import type { EvidenceCandidateRow } from '../../../../fixtures/extras/requirements/types'
import { useService } from '../../../../services/context'
import { evidenceStore } from '../../../../services/stubs/evidence'
import { RecordedNote, useReqActions } from '../actions'
import { BomLineSection } from '../components/panelParts'
import { ClauseSection, ConfidencePair, ConformancePill, ScreenHeader, Section, SeverityBadge, Stepper, TextBadge, VocabBadge } from '../components/shared'
import { stepHref, useParam, useReqModel, type ReqModel } from '../model'
import { useReqVocab } from '../vocab'
import s from '../req.module.css'

const outcomeRaw = (r: ReqView): string | null => (r.carryDecision ? (r.carryDecision.kind === 'gap' ? 'gap' : `linked:${r.carryDecision.provenance ?? 'computed'}`) : null)

/** 06 Carryover review: triage the flagged requirements, decide each. Linking evidence is single-requirement (D-15). */
export function CarryoverScreen() {
  const m = useReqModel()
  const [sel, setSel] = useParam('req')
  const { config, stats, summary } = m
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: RFQ_ID }, { label: 'Carryover review' }])
  const flagged = m.rows.filter((r) => r.bucket != null)
  const und = flagged.filter((r) => r.bucket === 'undetermined')
  const ee = flagged.filter((r) => r.bucket === 'evaluated-elsewhere')
  const selected = flagged.find((r) => r.req_id === sel) ?? null
  const seg = [
    { n: stats.undetermined, cls: s.segWarn }, { n: stats.evaluatedElsewhere, cls: s.segInfo }, { n: stats.linked, cls: s.segPass }, { n: stats.gap, cls: s.segFail },
  ]
  const nextOpen = flagged.find((r) => r.openCarry && r.req_id !== selected?.req_id)

  return (
    <div className={s.screen}>
      <Stepper current="06-carryover" counts={{ '05-mapping': m.rows.filter((r) => r.needsMapping && r.mapping === 'proposed').length, '06-carryover': stats.needDecision }} />
      <ScreenHeader title="Carryover review" sub={<>Civic Si 1.5T · {RFQ_ID} · {m.rows.length} in scope</>}
        actions={<Link to={stepHref('06c-trace')}><Button>View full requirements table</Button></Link>} />
      <div className={s.workspace}>
        <div className={s.scroll}><div className={s.page}>
          <div className="row wrap" style={{ gap: 'var(--gap-4)', alignItems: 'center' }}>
            <div className="col" style={{ gap: 0 }}>
              <span className="text-label-caps">Need a decision</span>
              <span><span className={s.stat} data-testid="need-decision">{stats.needDecision}</span> <span className="secondary">of {stats.flagged} flagged requirements</span></span>
            </div>
            <div className="col grow" style={{ minWidth: 260 }}>
              <div className={s.bar} role="img" aria-label="Flagged requirements by outcome">{seg.map((x, i) => x.n > 0 && <i key={i} className={x.cls} style={{ width: `${(x.n / Math.max(1, stats.flagged)) * 100}%` }} />)}</div>
              <div className="row wrap secondary" style={{ gap: 'var(--gap-4)' }}>
                <span>Undetermined · needs evidence <b className="data">{stats.undetermined}</b></span>
                <span>Evaluated Elsewhere · awaiting sign-off <b className="data">{stats.evaluatedElsewhere}</b></span>
                <span>Evidence linked <b className="data">{stats.linked}</b></span><span>Moved to Gap <b className="data">{stats.gap}</b></span>
              </div>
            </div>
          </div>
          <div className={s.banner} data-testid="carryover-banner">
            <span className="grow">Carryover <b className="data">{summary.carried.length}</b> · Needs review <b className="data">{stats.needDecision}</b></span>
            <Link to={stepHref('07-approve')}><Button primary={stats.needDecision === 0}>{stats.needDecision === 0 ? `Review ${config.planLabel}` : `Defer and Review ${config.planLabel}`}</Button></Link>
          </div>
          <FlagList title="Undetermined · needs evidence" tone="warn" rows={und} sel={selected?.req_id} onSel={setSel} />
          <FlagList title="Evaluated Elsewhere · confirm transfer" tone="info" rows={ee} sel={selected?.req_id} onSel={setSel} />
        </div></div>
        <SidePanel defaultWidth={440} title={selected ? selected.title : 'Flagged requirement'} subtitle={selected ? `${selected.req_id} · ${selected.citation}` : undefined}
          badge={selected ? <ConformancePill raw={selected.conformance} /> : undefined} onClose={selected ? () => setSel(null) : undefined}
          empty={selected ? undefined : <>Select a flagged requirement to review the evidence and decide.</>}>
          {selected && <ResolutionPanel key={selected.req_id} r={selected} m={m} next={nextOpen ? () => setSel(nextOpen.req_id) : undefined} />}
        </SidePanel>
      </div>
    </div>
  )
}

function FlagList({ title, tone, rows, sel, onSel }: { title: string; tone: 'warn' | 'info'; rows: ReqView[]; sel?: string; onSel: (id: string) => void }) {
  const open = rows.filter((r) => r.openCarry).length
  return (
    <section className={s.list} aria-label={title}>
      <div className={s.listHead}><span className="grow">{title}</span><Badge tone={tone}>{open} open of {rows.length}</Badge></div>
      {rows.length === 0 && <div className="muted" style={{ padding: 'var(--gap-4)' }}>Nothing flagged here.</div>}
      {rows.map((r) => {
        const out = outcomeRaw(r)
        return (
          <button key={r.req_id} type="button" className={`${s.item} ${sel === r.req_id ? s.itemOn : ''}`} onClick={() => onSel(r.req_id)} data-testid="flag-row" data-req={r.req_id} aria-pressed={sel === r.req_id}>
            <span className={s.cell} style={{ flex: 1 }}>
              <span>{r.title}</span>
              <span className="row wrap"><span className={s.id}>{r.req_id} · {r.linked_part_id}</span><ConformancePill raw={r.conformance} />
                {r.openCarry && r.flags.map((f) => <VocabBadge key={f} vocab="carryFlag" raw={f} />)}
                {out && <VocabBadge vocab="carryOutcome" raw={out} dashed={r.carryDecision?.provenance !== 'computed'} />}</span>
              <span className="row wrap secondary"><SeverityBadge value={r.severity} /><span>{r.ownerShort}</span><span className="data muted">due {r.due}</span></span>
            </span>
          </button>
        )
      })}
    </section>
  )
}

function ResolutionPanel({ r, m, next }: { r: ReqView; m: ReqModel; next?: () => void }) {
  const act = useReqActions()
  const out = outcomeRaw(r)
  return (
    <>
      <ClauseSection r={r} />
      <div className="row wrap">
        <TextBadge state={r.text_status} /><Badge tone="outline">Driven by · {r.driven.state}{r.driven.score != null ? ` ${r.driven.score}%` : ' n/a'}</Badge>
        <Link className="right" to={stepHref('06b-impact', `req=${r.req_id}&ret=06-carryover`)}><Button size="sm"><Network size={14} aria-hidden /> Impact Map</Button></Link>
      </div>
      {r.bucket === 'evaluated-elsewhere' ? <TransferSection r={r} m={m} /> : <EvidenceSection r={r} m={m} />}
      <BomLineSection r={r} />
      <Section title="Audit"><AuditList subject={{ type: 'requirement', id: r.req_id }} limit={4} emptyText="No decision yet." /></Section>
      {out && (
        <div className={s.card} data-testid="resolution">
          <span className="row"><VocabBadge vocab="carryOutcome" raw={out} dashed={r.carryDecision?.provenance !== 'computed'} />
            {r.carryDecision?.provenance === 'user-supplied' && <Badge tone="warn" dashed>Asserted, not computed</Badge>}
            <LinkButton className="right" onClick={() => act.undoCarry(r)}>Undo</LinkButton></span>
          <span className="muted">Decided by {r.carryDecision?.by}. This applies to {r.req_id} only.</span>
          {next && <LinkButton onClick={next}>Next flagged</LinkButton>}
        </div>
      )}
      <RecordedNote />
    </>
  )
}

/** Evaluated Elsewhere: lineage, the trail the answer comes from, why it transfers, transfer confidence, evidence result, interface-change warning. */
function TransferSection({ r, m }: { r: ReqView; m: ReqModel }) {
  const act = useReqActions()
  const evidence = useService('evidence')
  const [computed, setComputed] = useState<EvidenceCandidateRow[] | null>(null)
  useEffect(() => { let live = true; void evidence.candidates(r.req_id).then((c) => live && setComputed(c.filter((x) => x.provenance !== 'confirmed').map((x) => ({ recordId: x.recordId, score: x.score, provenance: x.provenance as EvidenceCandidateRow['provenance'] })))); return () => { live = false } }, [evidence, r.req_id])
  const top = computed ? evidenceCandidates(r.req_id, m.decisions, computed)[0] : undefined
  const trail = evidenceTrail(r)
  const hops = chainHops(r)
  const { approval } = m.config.matchRules
  return (
    <Stub id="evidence-engine" note="Ranked candidates from carryover events">
      <Section title="Lineage"><span data-testid="lineage">{lineage(r).join(' → ')} <span className="muted">(this RFQ)</span></span></Section>
      <Section title="Where the answer comes from">
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--gap-1)' }}>
          {hops.map((h, i) => <li key={i} className="row" style={{ alignItems: 'flex-start' }}><span className="data muted" style={{ width: 104, flex: "none", whiteSpace: "nowrap" }}>{h.date}</span><span>{h.event} · {h.program}{h.warn && <> <Badge tone="warn">{h.warn}</Badge></>}</span></li>)}
        </ol>
      </Section>
      <Section title="Why it transfers">
        <div className="row wrap">{r.link.why_matched.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}</div>
        <span>{r.link.reasoning}</span>
      </Section>
      <Section title="Confidence"><ConfidencePair r={r} /></Section>
      <Section title="Evidence result">
        <span>{trail.source ? `${trail.source.note} (${trail.source.program}, ${trail.source.date})` : 'No earlier result on record.'}</span>
        {top && <span className="muted">Evidence record {top.record.id} · {top.record.metric}</span>}
        {trail.predates && trail.interfaceChange && (
          <div className={s.banner} data-testid="interface-warning">Interface changed on {trail.interfaceChange.date}: {trail.interfaceChange.note} The evidence predates it. Confirm only if the change does not alter the test's validity.</div>
        )}
      </Section>
      <Section title="Review"><ApprovalButton approval={{ status: r.transferConfirmed ? approval.confirmedRaw : approval.pendingRaw, audit: [] }} subject={{ type: 'requirement', id: r.req_id }} label={`transfer for ${r.req_id}`} onConfirmed={() => act.confirmTransfer(r.req_id)} />
        {r.transferConfirmed && <span className="muted">Confirmed by {r.transferConfirmed.by} at {r.transferConfirmed.at.slice(0, 16).replace('T', ' ')}</span>}</Section>
      {!r.carryDecision && (
        <div className="row wrap">
          <Button primary disabled={!top} onClick={() => top && act.linkEvidence(r, top.record.id, top.provenance)}>Link Evidence to This Requirement</Button>
          <Button onClick={() => act.moveToGap(r)}>Move to Gap Instead</Button>
        </div>
      )}
    </Stub>
  )
}

/** Undetermined: reason, ranked candidate evidence, find an evidence record, upload proof. */
function EvidenceSection({ r, m }: { r: ReqView; m: ReqModel }) {
  const act = useReqActions()
  const evidence = useService('evidence')
  const vocab = useReqVocab()
  const floor = m.config.thresholds.evidenceFloor
  const [computed, setComputed] = useState<EvidenceCandidateRow[] | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [showWeak, setShowWeak] = useState(false)
  const [q, setQ] = useState('')
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => { let live = true; void evidence.candidates(r.req_id).then((c) => live && setComputed(c.filter((x) => x.provenance !== 'confirmed').map((x) => ({ recordId: x.recordId, score: x.score, provenance: x.provenance as EvidenceCandidateRow['provenance'] })))); return () => { live = false } }, [evidence, r.req_id])
  const cands = computed ? evidenceCandidates(r.req_id, m.decisions, computed) : []
  const { above, below } = splitByFloor(cands, floor)
  const shown = showWeak ? cands : above
  const found = evidenceStore.search(q).filter((x) => !cands.some((c) => c.record.id === x.id))
  const records = allEvidenceRecords(m.decisions)
  const pick = shown.find((c) => c.record.id === picked)
  const card = (c: EvidenceCandidate) => {
    const asserted = c.provenance === 'user-supplied' && !c.record.verifiedBy
    return (
      <div key={c.record.id} className={`${s.card} ${picked === c.record.id ? s.cardSel : ''} ${c.provenance !== 'computed' ? s.cardDashed : ''}`} data-testid="evidence-candidate">
        <label className={s.pick}>
          <input type="radio" name={`ev-${r.req_id}`} checked={picked === c.record.id} onChange={() => setPicked(c.record.id)} disabled={!!r.carryDecision} aria-label={`Select ${c.record.title}`} />
          <span className="grow col" style={{ gap: 2 }}><span className={s.strong}>{c.record.id} · {c.record.title}</span>
            <span className={s.id}>{c.record.programLabel}{c.record.date ? ` · ${c.record.date}` : ''} · {vocab.label('testResult', c.record.result)} · {c.record.metric}</span></span>
          <MatchQuality quality={{ confidence: c.score != null ? { score: c.score } : undefined, provenance: { origin: c.provenance, verifiedBy: c.record.verifiedBy, verifiedAt: c.record.verifiedAt } }} />
        </label>
        {asserted && <span className="row"><Badge tone="warn" dashed>Asserted, not computed</Badge><LinkButton onClick={() => act.verifyRecord(r.req_id, c.record.id)}>Verify as reviewer</LinkButton></span>}
      </div>
    )
  }
  return (
    <Stub id="evidence-engine" note="Ranked candidates from carryover events">
      <Section title="Reason"><span data-testid="reason">{undeterminedReason(r, floor)}</span></Section>
      <Section title={`Candidate evidence · ranked · ${shown.length}`}>
        {computed == null && <span className="muted">Loading candidates</span>}
        {computed != null && above.length === 0 && <div className="muted" data-testid="no-candidates">Datum found no evidence record above {floor}%. Search for one you know about, or upload the report.</div>}
        <Stub id="evidence-store" note="Eight hard-coded records">{shown.map(card)}</Stub>
        {below.length > 0 && <LinkButton onClick={() => setShowWeak(!showWeak)}>{showWeak ? 'Hide' : 'Show'} {below.length} weaker record{below.length === 1 ? '' : 's'} below {floor}%</LinkButton>}
      </Section>
      <Section title="Find evidence record">
        <Stub id="evidence-store" note="Search over the stored records">
          <SearchBox value={q} onChange={setQ} placeholder="Test ID, part number, program, date" />
          {q.trim() && found.length === 0 && <span className="muted">No record matches “{q}”. {records.length} records searched.</span>}
          {found.map((x) => (
            <div key={x.id} className="row"><span className="grow"><span className={s.strong}>{x.id}</span> <span className="secondary">{x.title}</span></span>
              <Button size="sm" onClick={() => { act.addCandidate(r.req_id, x.id); setQ('') }} aria-label={`Add ${x.id} as candidate`}>Add as Candidate</Button></div>
          ))}
          <div className="row">
            <input ref={file} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { const rec = act.upload(r.req_id, f.name); setPicked(rec.id) } e.target.value = '' }} data-testid="upload-input" />
            <Button onClick={() => file.current?.click()}><Upload size={14} aria-hidden /> Upload Proof</Button>
          </div>
          <span className="muted">Records you add or upload are tagged as asserted, not computed, until a reviewer verifies them.</span>
        </Stub>
      </Section>
      {!r.carryDecision && (
        <div className="row wrap">
          <Button primary disabled={!pick} onClick={() => pick && act.linkEvidence(r, pick.record.id, pick.provenance)}>Link Selected Evidence</Button>
          <Button onClick={() => act.moveToGap(r)}>Move to Gap Instead</Button>
        </div>
      )}
    </Stub>
  )
}
