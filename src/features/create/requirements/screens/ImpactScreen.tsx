import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SidePanel } from '../../../../components/panels/Panels'
import { Stub } from '../../../../components/stub/Stub'
import { useBreadcrumbs } from '../../../../components/shell/useBreadcrumbs'
import { Badge, Button, EmptyState, Seg } from '../../../../components/ui'
import { RFQ_ID } from '../../../../fixtures/civic'
import { affectedBy, annotate, describeNode, type GraphType, type NodeInfo } from '../../../../fixtures/derive-requirements'
import { DEFAULT_SCENARIO, SCENARIOS } from '../../../../fixtures/extras/requirements/rules'
import { useService } from '../../../../services/context'
import { RecordedNote, useReqActions } from '../actions'
import { ScreenHeader, Section, SeverityBadge, Stepper, VocabBadge } from '../components/shared'
import { useWidth } from '../components/useWidth'
import { stepHref, useParam, useQueryPatch, useReqModel } from '../model'
import s from '../req.module.css'

type Dir = 'both' | 'back' | 'forward'
const DIRS: Array<[Dir, string]> = [['both', 'Both'], ['back', 'Trace Back'], ['forward', 'Trace Forward']]
const KIND: Record<GraphType, string> = { REQ: 'Requirement', DOC: 'Document', PRT: 'Part', TST: 'Test', PLN: 'Plan' }
const BACK_LABEL: Record<string, string> = { '06-carryover': 'Back to Carryover Review', '06c-trace': 'Back to Requirement trace', '03c-trace': 'Back to Event lanes' }
const BH = 52

/** 06b Impact map: blast radius of one node. Hand-built SVG: typed nodes, solid and dashed edges, hop rings. */
export function ImpactScreen() {
  const m = useReqModel()
  const impact = useService('impact')
  const act = useReqActions()
  const [reqParam] = useParam('req')
  const patch = useQueryPatch()
  const [hopsParam, setHops] = useParam('hops')
  const [dirParam, setDir] = useParam('dir')
  const [scParam, setScenario] = useParam('scenario')
  const [nodeParam, setNode] = useParam('node')
  const [ret] = useParam('ret')
  const { ref, width } = useWidth()

  const anchor = m.byId.get(reqParam ?? '') ?? m.rows.find((r) => r.dangerous) ?? m.rows[0]!
  const hops: 1 | 2 = hopsParam === '1' ? 1 : 2
  const dir: Dir = dirParam === 'back' || dirParam === 'forward' ? dirParam : 'both'
  const scenario = SCENARIOS.find((x) => x.id === scParam) ?? SCENARIOS.find((x) => x.id === DEFAULT_SCENARIO)!
  const backStep = ret && BACK_LABEL[ret] ? ret : '06c-trace'
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: RFQ_ID }, { label: `Impact map · ${anchor.req_id}` }])

  const graph = impact.neighbors(anchor.req_id, hops, dir)
  const ann = useMemo(() => annotate(anchor.req_id, graph.edges), [anchor.req_id, graph.edges])
  const hood = useMemo(() => ({ nodes: graph.nodes.map((n) => ({ id: n.id, type: n.type })), edges: [], hop: ann.hop, side: ann.side }), [graph.nodes, ann])
  const affected = useMemo(() => affectedBy(scenario.id, anchor, hood, m.rows), [scenario.id, anchor, hood, m.rows])
  const flagFor = (id: string) => affected.find((a) => a.id === id)?.flag
  const reReview = affected.filter((a) => a.flag === 're-review')
  const pending = reReview.filter((a) => !m.decisions.flags[a.id])
  const programs = new Set(affected.flatMap((a) => a.programs))
  const info = useMemo(() => Object.fromEntries(graph.nodes.map((n) => [n.id, describeNode(n.id, m.rows)])), [graph.nodes, m.rows])
  const selId = graph.nodes.some((n) => n.id === nodeParam) ? nodeParam! : anchor.req_id
  const sel = info[selId]!

  // columns: back hop 2, back hop 1, anchor, forward hop 1, forward hop 2, then compacted to the ones in use
  const colOf = (id: string): number => (id === anchor.req_id ? 2 : ann.side[id] === 'back' ? 2 - (ann.hop[id] ?? 1) : 2 + (ann.hop[id] ?? 1))
  const used = [...new Set(graph.nodes.map((n) => colOf(n.id)))].sort((a, b) => a - b)
  const bw = 132
  const minW = used.length * (bw + 18) + 24
  const W = Math.max(width - 2, minW)
  const colX = (c: number) => 12 + bw / 2 + (used.indexOf(c) * (W - 24 - bw)) / Math.max(1, used.length - 1)
  const byCol = used.map((c) => graph.nodes.filter((n) => colOf(n.id) === c).sort((a, b) => a.id.localeCompare(b.id)))
  const H = Math.max(360, Math.max(...byCol.map((c) => c.length)) * (BH + 22) + 40)
  const pos: Record<string, { x: number; y: number }> = {}
  byCol.forEach((nodes, ci) => nodes.forEach((n, i) => { pos[n.id] = { x: colX(used[ci]!), y: ((i + 1) * H) / (nodes.length + 1) } }))
  const ax = pos[anchor.req_id]!.x
  const chars = Math.floor((bw - 16) / 7.4)
  const clip = (t: string) => (t.length > chars ? `${t.slice(0, chars - 1)}…` : t)
  const rings = ([1, 2] as const).filter((h) => h <= hops && graph.nodes.some((n) => ann.hop[n.id] === h))

  const flagAll = () => act.flagForReReview(anchor.req_id, pending.map((a) => a.id), scenario.id, scenario.label)

  return (
    <div className={s.screen}>
      <Stepper current="06b-impact" />
      <ScreenHeader title="Impact map" sub={<span className="data">{anchor.req_id} · {graph.nodes.length - 1} linked records</span>}
        actions={<>
          <span className="secondary">Hop depth</span><Seg value={String(hops)} onChange={(v) => setHops(v)} label="Hop depth" options={[['1', '1'], ['2', '2']]} />
          <span className="secondary">Direction</span><Seg value={dir} onChange={(v) => setDir(v)} label="Direction" options={DIRS} />
        </>} />
      <div className={s.workspace}>
        <div className={s.scroll}><div className={s.page}>
          <div className="row secondary" style={{ justifyContent: 'center' }}><span className="text-label-caps">Upstream ← → Downstream</span></div>
          <Stub id="impact-graph" note="Adjacency built from dataset links, 1 or 2 hops">
            <div className={s.svgWrap} ref={ref} data-testid="impact-svg-wrap">
              <svg width={W} height={H} role="img" aria-label={`Dependency graph around ${anchor.req_id}`} data-testid="impact-svg">
                {rings.map((h) => {
                  const xs = graph.nodes.filter((n) => ann.hop[n.id] === h).map((n) => Math.abs(pos[n.id]!.x - ax))
                  const rx = Math.max(...xs) + bw / 2 + 10
                  return <ellipse key={h} cx={ax} cy={H / 2} rx={rx} ry={H / 2 - 6} fill="none" stroke="var(--border-default)" strokeDasharray="3 5" />
                })}
                {graph.edges.map((e, i) => {
                  const a = pos[e.from], b = pos[e.to]
                  if (!a || !b) return null
                  const dx = b.x - a.x
                  const x1 = a.x + (dx > 0 ? bw / 2 : dx < 0 ? -bw / 2 : 0), x2 = b.x + (dx > 0 ? -bw / 2 : dx < 0 ? bw / 2 : 0)
                  return (
                    <g key={i} data-edge={e.kind}>
                      <line x1={x1} y1={a.y} x2={x2} y2={b.y} stroke="var(--fg-muted)" strokeWidth={1.4} strokeDasharray={e.kind === 'donates-evidence' ? '6 4' : undefined} />
                      {e.label && <title>{e.label}</title>}
                    </g>
                  )
                })}
                {graph.nodes.map((n) => {
                  const p = pos[n.id]!
                  const i: NodeInfo = info[n.id]!
                  const flag = flagFor(n.id)
                  const warn = flag === 're-review' || n.needsReview
                  const on = n.id === selId
                  return (
                    <g key={n.id} transform={`translate(${p.x - bw / 2},${p.y - BH / 2})`} tabIndex={0} role="button" aria-label={`${KIND[n.type]} ${i.label}${warn ? ', needs re-review' : ''}`} aria-pressed={on} data-node={n.id} data-type={n.type}
                      onClick={() => setNode(n.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setNode(n.id)} style={{ cursor: 'pointer' }}>
                      <rect width={bw} height={BH} rx={5} fill="var(--bg-card)" stroke={on ? 'var(--border-selected)' : warn ? 'var(--status-warn-fg)' : 'var(--border-strong)'} strokeWidth={on || warn ? 2 : 1} strokeDasharray={n.id === anchor.req_id ? undefined : undefined} />
                      {warn && <rect width={4} height={BH} rx={2} fill="var(--status-warn-fg)" />}
                      <text x={10} y={19} style={{ font: 'var(--fw-medium) var(--text-badge) var(--font-data)', fill: 'var(--fg-secondary)' }}>{n.type}{warn ? (n.needsReview && !flag ? ' · Flagged' : ' · Re-review') : flag === 'check' ? ' · Check' : ''}</text>
                      <text x={10} y={39} style={{ font: 'var(--text-small) var(--font-ui)', fill: 'var(--fg-primary)' }}>{clip(n.type === 'REQ' || n.type === 'PRT' || n.type === 'TST' ? n.id.replace(/^[A-Z]{3}:/, '') : i.label)}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </Stub>
          <div className={s.legend} data-testid="impact-legend">
            <span><i className={s.swatchSolid} />Depends on, blocks if it fails</span><span><i className={s.swatchDash} />Donates evidence</span>
            <span><i className={s.swatchWarn} />Needs re-review (also marked in text)</span>
            {(Object.keys(KIND) as GraphType[]).map((k) => <span key={k}><b className="data">{k}</b> {KIND[k]}</span>)}
          </div>
        </div></div>
        <SidePanel defaultWidth={360} title={<>Impact of <span className="data">{anchor.req_id}</span> · <span className="data">{anchor.linked_part_id}</span></>}
          subtitle={undefined} badge={<SeverityBadge value={anchor.severity} />}
          footer={<>
            <Button primary disabled={pending.length === 0} onClick={flagAll}>{pending.length === 0 && reReview.length > 0 ? 'Flagged for re-review' : `Flag ${pending.length} for Re-review`}</Button>
            <Link to={stepHref(backStep, `req=${anchor.req_id}`)}><Button>{BACK_LABEL[backStep]}</Button></Link>
          </>}>
          <span className="secondary">{anchor.title}</span>
          <Section title="If this changes">
            {SCENARIOS.map((x) => (
              <label key={x.id} className={`${s.card} ${s.pick} ${x.id === scenario.id ? s.cardSel : ''}`}>
                <input type="radio" name="scenario" checked={x.id === scenario.id} onChange={() => setScenario(x.id)} />
                <span className="col" style={{ gap: 0 }}><span className={s.strong}>{x.label}</span><span className="muted">{x.note}</span></span>
              </label>
            ))}
          </Section>
          <div className={s.tiles3}>
            <div className={s.tile}><span className="text-label-caps">Re-review</span><span className={s.stat} data-testid="count-rereview">{reReview.length}</span></div>
            <div className={s.tile}><span className="text-label-caps">Check</span><span className={s.stat} data-testid="count-check">{affected.length - reReview.length}</span></div>
            <div className={s.tile}><span className="text-label-caps">Programs</span><span className={s.stat} data-testid="count-programs">{programs.size}</span></div>
          </div>
          <Section title="Affected downstream">
            {affected.length === 0 && <EmptyState title="Nothing moves for this change here.">Widen the hop depth or switch the scenario.</EmptyState>}
            {affected.map((a) => {
              const i = info[a.id]
              return (
                <button key={a.id} type="button" className={`${s.card} ${a.id === selId ? s.cardSel : ''}`} style={{ textAlign: 'left', font: 'inherit', fontWeight: 400, color: 'inherit' }} onClick={() => setNode(a.id)} data-testid="affected-row">
                  <span className="row"><span className={`${s.strong} grow`}>{i?.label}</span><VocabBadge vocab="impactFlag" raw={a.flag} />{m.decisions.flags[a.id] && <Badge tone="neutral">Flagged</Badge>}</span>
                  <span className={s.id}>{a.id} · {i?.programs.join(', ')}</span>
                  <span className="secondary">{a.reason}</span>
                </button>
              )
            })}
          </Section>
          <Section title="Selected">
            <div className={s.card}>
              <span className={s.strong}>{sel.label}</span><span className="muted">{KIND[sel.type]} · {sel.sub}</span>
              {sel.type === 'REQ' && sel.id !== anchor.req_id && <button type="button" className="link" onClick={() => patch({ req: sel.id, node: null })} style={{ background: 'none', border: 0, padding: 0, color: 'var(--accent)', textAlign: 'left' }}>Re-center on {sel.id}</button>}
              {sel.type === 'TST' && sel.id.startsWith('TST:DV-') && <Link to={stepHref('test', `test=${sel.id.slice(4)}&from=${anchor.req_id}&back=06b-impact`)}>View Test</Link>}
            </div>
          </Section>
          <span className="muted">Flags are recorded in the audit trail only. No owner is notified in the prototype.</span>
          <RecordedNote />
        </SidePanel>
      </div>
    </div>
  )
}
