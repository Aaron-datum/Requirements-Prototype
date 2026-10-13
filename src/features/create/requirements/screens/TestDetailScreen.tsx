import { Link } from 'react-router-dom'
import { SidePanel } from '../../../../components/panels/Panels'
import { Stub } from '../../../../components/stub/Stub'
import { useBreadcrumbs } from '../../../../components/shell/useBreadcrumbs'
import { Badge, Button, EmptyState } from '../../../../components/ui'
import { RFQ_ID } from '../../../../fixtures/civic'
import { runNote, testDetail } from '../../../../fixtures/derive-requirements'
import { useReqActions } from '../actions'
import { ScreenHeader, Stepper, VocabBadge } from '../components/shared'
import { stepHref, useParam, useReqModel } from '../model'
import s from '../req.module.css'

const BACK: Record<string, string> = { '05-mapping': 'Back to Test Mapping', '06c-trace': 'Back to Requirement trace', '06-carryover': 'Back to Carryover Review', '06b-impact': 'Back to Impact map' }

/** Test detail: the single destination for every test reference (mapping candidate card, trace's Associated test, impact map). */
export function TestDetailScreen() {
  const m = useReqModel()
  const act = useReqActions()
  const [testId] = useParam('test')
  const [from] = useParam('from')
  const [backParam] = useParam('back')
  const back = backParam && BACK[backParam] ? backParam : '05-mapping'
  const d = testId ? testDetail(testId, m.rows, m.decisions, m.config.thresholds.testMatchFloor) : null
  const req = from ? m.byId.get(from) : undefined
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: RFQ_ID }, { label: `Test · ${testId ?? ''}` }])

  if (!d) {
    return (
      <div className={s.screen}><Stepper current="" />
        <EmptyState title="Test not found.">No test with the id “{testId ?? ''}” is in the library. <Link to={stepHref(back)}>{BACK[back]}</Link></EmptyState></div>
    )
  }
  const { test, procedure } = d
  const useFor = req && req.chosenTestId !== test.test_id && req.mapping !== 'accepted'
  const library = m.config.tenantLabel ? `${m.config.tenantLabel} test library` : 'Test library'
  return (
    <div className={s.screen}>
      <Stepper current="" />
      <ScreenHeader title={test.name} sub={<span className="data">{test.test_id} · {test.standard}</span>} />
      <div className={s.workspace}>
        <div className={s.scroll}><div className={s.page}>
          <section className={s.list} aria-label="Procedure"><div className={s.listHead}>Procedure</div>
            <dl className={s.kv} style={{ padding: 'var(--gap-3) var(--gap-4)' }}>
              {procedure ? <><dt>Setup</dt><dd style={{ textAlign: 'left' }}>{procedure.setup}</dd><dt>Profile</dt><dd style={{ textAlign: 'left' }}>{procedure.profile}</dd><dt>Samples</dt><dd style={{ textAlign: 'left' }}>{procedure.samples}</dd><dt>Acceptance</dt><dd style={{ textAlign: 'left' }}>{procedure.acceptance}</dd></>
                : <><dt>Method</dt><dd style={{ textAlign: 'left' }}>{test.procedure}</dd></>}
            </dl>
          </section>
          <section className={s.list} aria-label="Run history"><div className={s.listHead}><span className="grow">Run history</span><span className="data">{d.runs.length} runs · {d.programCount} programs</span></div>
            <Stub id="evidence-store" note="Run history from the dataset; no test library is connected">
              {d.runs.length === 0 ? <EmptyState title="Never run. This program would be the first." /> : (
                <table className={s.table}><thead><tr><th>Report</th><th>Date</th><th>Program</th><th>Part</th><th>Result</th></tr></thead><tbody>
                  {d.runs.map(({ run, programName, partId }) => (
                    <tr key={run.run_id} data-testid="run-row"><td className="data">{run.run_id}</td><td className="data">{run.date ?? 'Not yet run'}</td><td>{programName}</td><td className="data">{partId}</td>
                      <td><VocabBadge vocab="testResult" raw={run.result} />{runNote(run) && <span className="muted"> · {runNote(run)}</span>}</td></tr>
                  ))}
                </tbody></table>
              )}
            </Stub>
          </section>
          <section className={s.list} aria-label="Referenced by"><div className={s.listHead}><span className="grow">Referenced by</span><span className="data">{d.referencedBy.length}</span></div>
            {d.referencedBy.map(({ req: r, state }) => (
              <div key={r.req_id} className={s.item} style={{ cursor: 'default' }} data-testid="ref-row">
                <span className={s.cell} style={{ flex: 1 }}><span>{r.title}</span><span className={s.id}>{r.req_id} · {r.part?.name ?? r.linked_part_id} · this RFQ</span></span>
                <VocabBadge vocab="refState" raw={state} />
              </div>
            ))}
          </section>
        </div></div>
        <SidePanel defaultWidth={340} title="Test" subtitle={test.test_id}
          footer={<>
            {useFor && req && <Button primary onClick={() => act.chooseTest(req, test.test_id)}>Use for {req.req_id}</Button>}
            <Link to={stepHref(back, req ? `req=${req.req_id}` : '')}><Button>{BACK[back]}</Button></Link>
          </>}>
          <div className="col"><span className="text-label-caps">Last result</span>
            {d.last ? <><span><VocabBadge vocab="testResult" raw={d.last.result} /></span><span className="data muted">{d.last.run_id} · {d.last.date} · {d.runs.find((x) => x.run.run_id === d.last!.run_id)?.partId}</span></> : <span className="muted">Never run.</span>}
          </div>
          <dl className={s.kv}>
            <dt>Standard</dt><dd>{test.standard}</dd><dt>Lab</dt><dd>{test.lab}</dd>
            <dt>Duration</dt><dd>{procedure ? `${procedure.durationDays} d` : 'unknown'}</dd><dt>Library</dt><dd>{library}</dd>
          </dl>
          {req && <Badge tone="outline">Opened from {req.req_id}{req.chosenTestId === test.test_id ? ', the proposed test' : `, proposed test: ${req.chosenTestId}`}</Badge>}
        </SidePanel>
      </div>
    </div>
  )
}
