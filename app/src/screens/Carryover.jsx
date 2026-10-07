import { useRef, useState } from 'react'
import { go, useRoute } from '../router'
import { useStore } from '../store'
import { Badge, Btn, DrivenBy, Meter, Owner, PageHead, Severity, SourceTag, Stamp, TextStatus } from '../components/ui'
import { SCOPE, candidateEvidence, progShort, requirements, tests } from '../data'

export const flagged = requirements.filter((r) => r.flagged)
export const resolution = (st, r) => st.carry[r.req_id]
export const RES_LABEL = { linked: 'Evidence linked', transfer: 'Evidence linked', gap: 'Moved to Gap' }

export default function Carryover() {
  const { query } = useRoute()
  const { state, decide } = useStore()
  const [sel, setSel] = useState(query.req || flagged[0]?.req_id)
  const open = flagged.filter((r) => !state.carry[r.req_id])
  const und = flagged.filter((r) => r.bucket === 'undetermined')
  const ee = flagged.filter((r) => r.bucket === 'evaluated_elsewhere')
  const done = (r) => state.carry[r.req_id]
  const count = (list, f) => list.filter(f).length
  const cur = requirements.find((r) => r.req_id === sel)
  const next = () => { const n = open.find((r) => r.req_id !== sel); if (n) setSel(n.req_id) }

  const Row = ({ r }) => (
    <div className={`card tight row ${sel === r.req_id ? 'sel' : ''}`} style={{ cursor: 'pointer', alignItems: 'flex-start' }} onClick={() => setSel(r.req_id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(r.req_id)}>
      <div className="grow col" style={{ gap: 2 }}>
        <span>{r.title}</span><span className="mono muted">{r.req_id} · {r.linked_part_id}</span>
        <span className="row wrap"><Severity v={r.severity} /><Owner v={r.owner} /><span className="muted">due {SCOPE.due}</span>
          {r.dangerous && <Badge tone="fail">Dangerous case</Badge>}</span>
      </div>
      {done(r) ? <Badge tone={done(r).kind === 'gap' ? 'neutral' : 'pass'}>{RES_LABEL[done(r).kind]}</Badge> : <DrivenBy status={r.driven_by_status} conf={r.driven_by_confidence} />}
    </div>
  )

  return (
    <div className="stage">
      <div className="page">
        <PageHead title="Carryover review" sub={<>Civic Si 1.5T · {SCOPE.rfq} · {requirements.length} in scope</>}>
          <Btn onClick={() => go('/trace')}>View Full Requirements Table</Btn>
          <Btn primary={open.length === 0} onClick={() => go('/approve')}>{open.length === 0 ? `Review ${state.planLabel}` : `Defer and Review ${state.planLabel}`}</Btn>
        </PageHead>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          <div className="card tight"><div className="caps">Need a decision</div><div className="stat">{open.length}<span className="muted" style={{ fontSize: 13 }}> of {flagged.length}</span></div></div>
          <div className="card tight"><div className="caps">Undetermined · needs evidence</div><div className="stat">{count(und, (r) => !done(r))}</div></div>
          <div className="card tight"><div className="caps">Evaluated elsewhere · awaiting sign-off</div><div className="stat">{count(ee, (r) => !done(r))}</div></div>
          <div className="card tight"><div className="caps">Evidence linked</div><div className="stat">{count(flagged, (r) => done(r) && done(r).kind !== 'gap')}</div></div>
          <div className="card tight"><div className="caps">Moved to Gap</div><div className="stat">{count(flagged, (r) => done(r)?.kind === 'gap')}</div></div>
        </div>
        {open.length === 0 && <div className="banner" role="status">Every flagged requirement has a decision. Review what the {state.planLabel.toLowerCase()} will contain.</div>}
        <section className="col"><div className="row"><span className="h3">Undetermined · needs evidence</span><Badge tone="warn">{und.length}</Badge></div>{und.map((r) => <Row key={r.req_id} r={r} />)}</section>
        <section className="col"><div className="row"><span className="h3">Evaluated Elsewhere · confirm transfer</span><Badge tone="info">{ee.length}</Badge></div>{ee.map((r) => <Row key={r.req_id} r={r} />)}</section>
      </div>
      {cur && <Detail key={cur.req_id} r={cur} next={next} hasNext={open.some((r) => r.req_id !== cur.req_id)} />}
    </div>
  )
}

function Detail({ r, next, hasNext }) {
  const { state, decide } = useStore()
  const fileRef = useRef()
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const res = state.carry[r.req_id]
  const extra = state.evidence[r.req_id] || []
  const cands = candidateEvidence(r)
  const strong = cands.filter((c) => c.score >= 50)
  const found = q.length > 1 ? tests.filter((t) => (t.test_id + t.name + t.standard).toLowerCase().includes(q.toLowerCase())).slice(0, 5) : []
  const tgt = (t) => `${r.req_id} ← ${t}`
  const src = r.ev.source

  const link = (t, asserted) => decide('carry', r.req_id, { kind: 'linked', test_id: t, asserted: !!asserted }, asserted ? 'Linked asserted evidence' : 'Linked evidence', tgt(t))
  const addEvidence = (rec) => decide('evidence', r.req_id, [...extra, rec], 'Added candidate (asserted)', `${r.req_id} · ${rec.name}`)

  return (
    <aside className="panel" style={{ width: 440, flexBasis: 440 }} aria-label="Requirement resolution">
      <div className="hd"><div className="grow"><div className="mono muted">{r.req_id} · {r.citation}</div><div className="h3">{r.title}</div></div></div>
      <div className="bd">
        <div className="col"><span>{r.requirement_text}</span>
          <span className="row wrap"><SourceTag v={r.source_type} /><TextStatus v={r.text_status} /><DrivenBy status={r.driven_by_status} conf={r.driven_by_confidence} />
            <Severity v={r.severity} /><Owner v={r.owner} /></span>
          <span className="muted">{r.notes}</span>
          <div className="row"><button className="linkbtn" onClick={() => go('/impact/' + r.req_id)}>Impact Map</button><button className="linkbtn" onClick={() => go('/trace?req=' + r.req_id)}>Open in trace</button></div></div>

        {r.bucket === 'evaluated_elsewhere' && (<>
          <div className="col"><span className="caps">Where the answer comes from</span>
            {src ? <div className="card tight col" style={{ gap: 2 }}><b>{r.ev.test.name}</b><span className="mono muted">{src.run_id} · {src.date} · {progShort(src.program_id)} · {src.result}</span><span className="muted">{src.notes}</span>
              <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => go('/test/' + r.ev.test.test_id + '?from=' + r.req_id)}>View Test</button></div> : <span className="muted">No prior run on record.</span>}</div>
          <div className="col"><span className="caps">Why it transfers</span><div className="row wrap">{r.ev.link.why_matched.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}</div><span>{r.ev.link.reasoning}</span></div>
          <div className="col"><span className="caps">Transfer confidence</span><div className="row"><Meter pct={r.matchConf} /><span className="mono">{r.matchConf}%</span></div></div>
          <div className="col"><span className="caps">Evidence result</span><span>{src ? `${src.result} on ${progShort(src.program_id)}` : '—'}</span>
            <div className="banner warn">Driven-by changed ({r.driven_by_confidence}% transfer). Confirm only if the interface change does not alter this test's validity.</div></div>
        </>)}

        {r.bucket === 'undetermined' && (<>
          {r.evState === 'Open' && <div className="banner warn">{r.ev.siRun?.result} on Si — no result yet. {r.driven_by_confidence == null ? 'No transfer score exists: the driving geometry is new.' : `Transfer confidence only ${r.driven_by_confidence}%.`}</div>}
          <div className="col"><span className="caps">Candidate evidence · ranked · {cands.length + extra.length}</span>
            {[...cands, ...extra.map((e) => ({ test: { test_id: e.name, name: e.name, standard: e.kind }, score: null, prov: 'Asserted' }))].map((c) => {
              const id = c.test.test_id
              return (
                <label key={id} className={`card tight row ${picked === id ? 'sel' : ''}`} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="cand" checked={picked === id} onChange={() => setPicked(id)} />
                  <span className="grow"><b>{c.test.name}</b><br /><span className="mono muted">{c.test.test_id !== c.test.name && c.test.test_id + ' · '}{c.test.standard}</span></span>
                  <span className="col" style={{ alignItems: 'flex-end', gap: 2 }}><span className="mono">{c.score == null ? '—' : c.score + '%'}</span>
                    <Badge tone={c.prov === 'Computed' ? 'info' : 'asserted'}>{c.prov === 'Computed' ? 'Computed' : 'Asserted'}</Badge></span>
                </label>)
            })}
            {strong.length === 0 && <span className="muted">Datum found no evidence record above 50%. Search for one you know about, or upload the report.</span>}</div>
          <div className="col"><span className="caps">Find evidence record</span>
            <input type="search" placeholder="Test ID, name, or standard…" value={q} onChange={(e) => setQ(e.target.value)} />
            {found.map((t) => (<div key={t.test_id} className="row"><span className="grow">{t.name} <span className="mono muted">{t.test_id}</span></span>
              <Btn size="sm" onClick={() => { addEvidence({ name: t.test_id + ' · ' + t.name, kind: 'record' }); setQ('') }}>Add as Candidate</Btn></div>))}
            {q.length > 1 && !found.length && <span className="muted">No evidence records match “{q}”. Upload the report instead.</span>}
            <div className="row"><input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files[0]; if (f) addEvidence({ name: f.name, kind: 'upload' }); e.target.value = '' }} />
              <Btn onClick={() => fileRef.current.click()}>Upload Proof</Btn></div>
            <span className="muted">Records you add or upload are tagged as asserted, not computed, until a reviewer verifies them.</span></div>
        </>)}

        <hr className="hr" />
        {res ? (
          <div className="col"><div className="row"><Badge tone={res.kind === 'gap' ? 'neutral' : 'pass'}>{RES_LABEL[res.kind]}</Badge>{res.asserted && <Badge tone="asserted">Asserted</Badge>}
            <Btn size="sm" onClick={() => decide('carry', r.req_id, undefined, 'Reopened', r.req_id)}>Undo</Btn></div>
            <Stamp audit={state.audit} match={(a) => a.target.startsWith(r.req_id) && a.action !== 'Added candidate (asserted)'} />
            {hasNext && <Btn onClick={next}>Next Flagged</Btn>}</div>
        ) : (
          <div className="row wrap">
            {r.bucket === 'evaluated_elsewhere'
              ? <Btn primary onClick={() => link(r.ev.test.test_id)}>Confirm Transfer</Btn>
              : <Btn primary disabled={!picked} onClick={() => { const e = extra.find((x) => x.name === picked); link(e ? e.name : picked, !!e || picked !== r.ev.test.test_id && false) }}>Link Selected Evidence</Btn>}
            <Btn onClick={() => decide('carry', r.req_id, { kind: 'gap' }, 'Moved to Gap', r.req_id)}>Move to Gap Instead</Btn>
          </div>
        )}
      </div>
    </aside>
  )
}
