import { go, back, useRoute } from '../router'
import { Badge, Btn, KV, PageHead, Result, Severity } from '../components/ui'
import { ACTIVE, progShort, reqById, reqsForTest, runsForTest, testById } from '../data'

export default function TestDetail({ testId }) {
  const { query } = useRoute()
  const t = testById[testId]
  if (!t) return <div className="page"><div className="empty">Test {testId} not found.</div></div>
  const runs = runsForTest(testId)
  const refs = reqsForTest(testId)
  const ctx = reqById[query.from]
  const dated = runs.filter((r) => r.date)
  const last = dated[dated.length - 1]
  const siRun = runs.find((r) => r.program_id === ACTIVE)
  return (
    <div className="page">
      <PageHead title={t.name} sub={<><span className="mono">{t.test_id}</span> · {t.standard} · {t.lab}</>}>
        <Btn onClick={back}>{ctx ? `Back to ${ctx.req_id}` : 'Back'}</Btn>
        {ctx && <Btn primary onClick={() => go('/trace?req=' + ctx.req_id)}>Use for {ctx.req_id}</Btn>}
      </PageHead>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <section className="card col"><span className="caps">Procedure</span><span>{t.procedure}</span><KV rows={[['Standard', t.standard], ['Lab', t.lab], ['Requirements covered', t.req_ids.join(', ')]]} /></section>
        <section className="card col"><span className="caps">Last result</span>
          {last ? <><div className="row"><Result v={last.result === 'Carried' ? 'Pass' : last.result} /><span className="mono">{last.date}</span></div><span className="muted">{progShort(last.program_id)} · {last.run_id}{last.samples ? ` · ${last.samples} samples` : ''}</span><span>{last.notes}</span></> : <span className="muted">Never completed.</span>}
          {ctx && <><hr className="hr" /><span className="caps">Opened from</span><span><span className="mono">{ctx.req_id}</span> · {ctx.requirement_text}</span></>}</section>
      </div>
      <section className="card" style={{ padding: 0 }}>
        <div className="row" style={{ padding: 12 }}><span className="h3">Run history</span><span className="muted">{runs.length} runs · {runs.filter((r) => r.result === 'Pass').length} pass</span></div>
        <table className="tbl"><thead><tr><th>Report</th><th>Date</th><th>Program</th><th className="num">Samples</th><th>Result</th><th>Notes</th></tr></thead><tbody>
          {runs.map((r) => <tr key={r.run_id}><td className="mono">{r.run_id}</td><td className="mono">{r.date || '—'}</td><td>{progShort(r.program_id)}</td><td className="num">{r.samples ?? '—'}</td><td><Result v={r.result} /></td><td className="muted">{r.notes}</td></tr>)}
        </tbody></table>
        {!siRun && <div className="muted" style={{ padding: 12 }}>Never run. This program would be the first.</div>}
      </section>
      <section className="card" style={{ padding: 0 }}>
        <div className="row" style={{ padding: 12 }}><span className="h3">Referenced by</span><Badge>{refs.length}</Badge></div>
        <table className="tbl"><thead><tr><th>Requirement</th><th>State</th><th>Severity</th></tr></thead><tbody>
          {refs.map((r) => <tr key={r.req_id} className="rowhover" onClick={() => go('/trace?req=' + r.req_id)}><td><div>{r.title}</div><div className="mono muted">{r.req_id} · Si</div></td><td>{r.evState}</td><td><Severity v={r.severity} /></td></tr>)}
        </tbody></table>
      </section>
    </div>
  )
}
