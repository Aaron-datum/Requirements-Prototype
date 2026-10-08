import Icon from '../components/Icon'
import { useState } from 'react'
import { go } from '../router'
import { useStore } from '../store'
import { Badge, Btn, DrivenBy, Owner, PageHead, Seg, Severity, SourceTag, Stamp, TextStatus } from '../components/ui'
import { AUTO_ACCEPT_AT, SCOPE, requirements } from '../data'

const Conf = ({ v }) => (v == null ? <span className="mono muted" title="No score: the driving geometry is new">n/a</span> : <span className="mono">{v}%</span>)

export default function Mapping() {
  const { state, decide, decideMany } = useStore()
  const [sel, setSel] = useState(null)
  const [filter, setFilter] = useState('All')
  const [thr, setThr] = useState(85)
  const review = requirements.filter((r) => !r.autoAccept)
  const auto = requirements.filter((r) => r.autoAccept)
  const rows = review.filter((r) => filter === 'All' || r.text_status === filter)
  const dec = (r) => state.mapping[r.req_id]
  const reviewed = review.filter(dec).length
  const eligible = review.filter((r) => !dec(r) && r.matchConf != null && r.matchConf >= thr)
  const q = sel && requirements.find((r) => r.req_id === sel)
  const tgt = (r) => `${r.req_id} → ${r.proposedTest.test_id}`

  return (
    <div className="stage">
      <div className="fill">
        <div className="col" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-default)' }}>
          <PageHead title="Review requirement → test mapping" sub={<>New and changed requirements with no surrogate evidence · <b>{review.length}</b> requirements · OEM DVP template and Adient test library · {SCOPE.rfq} · due {SCOPE.due}</>}>
            <span className="row"><span className="muted">Accept all ≥</span>
              <select value={thr} onChange={(e) => setThr(+e.target.value)} aria-label="Confidence threshold">{[75, 80, 85, 90].map((t) => <option key={t} value={t}>{t}%</option>)}</select>
              <Btn disabled={!eligible.length} onClick={() => decideMany('mapping', eligible.map((r) => r.req_id), 'accepted', `Accepted ${eligible.length} mappings ≥ ${thr}%`, SCOPE.rfq)}>Accept All ({eligible.length})</Btn></span>
            <Btn primary onClick={() => go('/carryover')}>Continue to Carryover Review</Btn>
          </PageHead>
          <div className="row wrap">
            <Seg value={filter} onChange={setFilter} options={[['All', `All ${review.length}`], ['New', `Text · New ${review.filter((r) => r.text_status === 'New').length}`], ['Changed', `Changed ${review.filter((r) => r.text_status === 'Changed').length}`], ['Unchanged', `Unchanged ${review.filter((r) => r.text_status === 'Unchanged').length}`]]} />
            <span className="muted"><b>{auto.length}</b> mapped at ≥ {AUTO_ACCEPT_AT}% with unchanged text and driver — accepted automatically</span>
            <span className="right muted">Reviewed <b className="mono">{reviewed}/{review.length}</b></span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="tbl"><thead><tr><th>Requirement</th><th>Source</th><th>Text</th><th>Driven by</th><th>BOM line</th><th>Proposed test</th><th className="num">Conf.</th><th>Severity</th><th>Owner</th><th>Decision</th></tr></thead><tbody>
            {rows.map((r) => (
              <tr key={r.req_id} className={`rowhover ${sel === r.req_id ? 'picked' : ''} ${r.dangerous ? 'danger' : ''}`} onClick={() => setSel(r.req_id)}>
                <td><div>{r.title}</div><div className="mono muted">{r.req_id}</div></td>
                <td><SourceTag v={r.source_type} /> <span className="muted">{r.citation.split(' / ')[0]}</span></td>
                <td><TextStatus v={r.text_status} /></td>
                <td><DrivenBy status={r.driven_by_status} conf={r.driven_by_confidence} /></td>
                <td className="mono">{r.linked_part_id}</td>
                <td><div>{r.proposedTest.name}</div><div className="mono muted">{r.proposedTest.test_id}</div></td>
                <td className="num"><Conf v={r.matchConf} /></td>
                <td><Severity v={r.severity} /></td><td><Owner v={r.owner} /></td>
                <td onClick={(e) => e.stopPropagation()}>
                  {dec(r) ? <span className="row"><Badge tone={dec(r) === 'accepted' ? 'pass' : 'fail'}>{dec(r) === 'accepted' ? 'Accepted' : 'Rejected'}</Badge>
                    <button className="linkbtn" onClick={() => decide('mapping', r.req_id, undefined, 'Cleared decision', tgt(r))}>Undo</button></span>
                    : <span className="row"><Btn size="sm" primary onClick={() => decide('mapping', r.req_id, 'accepted', 'Accepted mapping', tgt(r))}>Accept</Btn>
                      <Btn size="sm" onClick={() => decide('mapping', r.req_id, 'rejected', 'Rejected mapping', tgt(r))}>Reject</Btn></span>}
                </td>
              </tr>))}
          </tbody></table>
        </div>
      </div>
      {q && (
        <aside className="panel" aria-label="Requirement detail">
          <div className="hd"><div className="grow"><div className="mono muted">{q.req_id}</div><div className="h3">{q.title}</div></div><Btn size="sm" className="ghost" onClick={() => setSel(null)} aria-label="Close panel"><Icon n="x" /></Btn></div>
          <div className="bd">
            <div className="col"><span className="caps">Requirement</span><span>{q.requirement_text}</span>
              <span className="row wrap"><SourceTag v={q.source_type} /><span className="muted">{q.citation}</span><TextStatus v={q.text_status} /></span></div>
            {q.dangerous && <div className="banner fail"><b>Dangerous case.</b> The clause text is unchanged but what it traces to has changed. Review it even though the text looks the same.</div>}
            <div className="col"><span className="caps">BOM line</span><span><span className="mono">{q.linked_part_id}</span> · {q.part.name}</span><span className="muted">{q.bomLine?.provenance}</span></div>
            <div className="col"><span className="caps">Why this test</span>
              <span className="row wrap"><Badge tone="info">AI-inferred</Badge><Conf v={q.matchConf} />{q.ev.link.why_matched.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}</span>
              <span>{q.ev.link.reasoning}</span></div>
            <div className="col"><span className="caps">Candidate tests</span>
              <div className="card tight col"><div className="row"><span className="grow"><b>{q.proposedTest.name}</b><div className="mono muted">{q.proposedTest.test_id} · {q.proposedTest.standard}</div></span><Conf v={q.matchConf} /></div>
                <span className="muted">{q.ev.siRun ? `Si run ${q.ev.siRun.run_id}: ${q.ev.siRun.result}` : 'Never run on Si'}</span>
                <button className="linkbtn" style={{ textAlign: 'left' }} onClick={() => go('/test/' + q.proposedTest.test_id + '?from=' + q.req_id)}>View Test</button></div></div>
            <div className="row"><Stamp audit={state.audit} match={(a) => a.target.startsWith(q.req_id)} /></div>
          </div>
        </aside>
      )}
    </div>
  )
}
