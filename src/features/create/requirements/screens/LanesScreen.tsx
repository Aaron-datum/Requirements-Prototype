import { ChevronLeft, ChevronRight, Network } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SidePanel } from '../../../../components/panels/Panels'
import { useBreadcrumbs } from '../../../../components/shell/useBreadcrumbs'
import { Badge, Button, EmptyState, IconButton, Seg } from '../../../../components/ui'
import { RFQ_ID, programShort } from '../../../../fixtures/civic'
import { laneEdges, laneEventsFor, type LaneEvent } from '../../../../fixtures/derive-requirements'
import { LANES } from '../../../../fixtures/extras/requirements/rules'
import { ConformancePill, ScreenHeader, Section, SourceTag, Stepper, VocabBadge } from '../components/shared'
import { useWidth } from '../components/useWidth'
import { stepHref, useParam, useQueryPatch, useReqModel } from '../model'
import s from '../req.module.css'

const LANE_NAME = { DOC: 'Source', PRT: 'Part', TST: 'Test' } as const
const NW = 172, NH = 72, LABEL_W = 84, LANE_H = 108, TOP = 34, STEP = 118

/** 03c Event lanes: DOC, PRT and TST lanes from the earliest program to this RFQ, driven by carryover_events.json through the derive layer. */
export function LanesScreen() {
  const m = useReqModel()
  const [reqParam] = useParam('req')
  const [show] = useParam('show')
  const [evParam, setEv] = useParam('event')
  const [ret] = useParam('ret')
  const patch = useQueryPatch()
  const { ref, width } = useWidth()
  const r = m.byId.get(reqParam ?? '') ?? m.byId.get('REC-20001') ?? m.rows[0]!
  const changesOnly = show === 'changes'
  const all = useMemo(() => laneEventsFor(r), [r])
  const events = changesOnly ? all.filter((e) => e.warn) : all
  const sel: LaneEvent | undefined = events.find((e) => e.id === evParam) ?? events[events.length - 1]
  const idx = sel ? events.indexOf(sel) : -1
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Create' }, { label: RFQ_ID }, { label: `Traceability · ${r.req_id}` }])

  // Place events left to right in time order: at least STEP apart, and never overlapping the previous event in the same lane.
  const pos: Record<string, { x: number; y: number }> = {}
  const lastInLane: Record<string, number> = {}
  let prevX = LABEL_W + 8 - STEP
  events.forEach((e) => {
    const x = Math.max(prevX + STEP, (lastInLane[e.lane] ?? -1e9) + NW + 10)
    pos[e.id] = { x, y: TOP + LANE_H * LANES.indexOf(e.lane) + (LANE_H - NH) / 2 }
    lastInLane[e.lane] = x
    prevX = x
  })
  const needed = Math.max(...events.map((e) => pos[e.id]!.x + NW), LABEL_W) + 16
  const spread = events.length > 1 && needed < width - 2 ? (width - 2 - needed) / (events.length - 1) : 0
  events.forEach((e, i) => { pos[e.id]!.x += spread * i })
  const W = Math.max(width - 2, needed)
  const H = TOP + LANE_H * LANES.length + 8
  const edges = laneEdges(events)
  const programs = new Set(all.map((e) => e.programId)).size
  const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t)
  const ordered = [...m.rows].sort((a, b) => (b.chain.length > 0 ? 1 : 0) - (a.chain.length > 0 ? 1 : 0) || a.req_id.localeCompare(b.req_id))
  const step = (d: number) => { const n = events[idx + d]; if (n) setEv(n.id) }

  return (
    <div className={s.screen}>
      <Stepper current="03c-trace" />
      <ScreenHeader title="Traceability" sub={<span className="data">{r.req_id} · {all.length} events · {programs} programs</span>}
        actions={<>
          <label className="secondary" htmlFor="lane-req">Requirement</label>
          <select id="lane-req" className={s.select} value={r.req_id} onChange={(e) => patch({ req: e.target.value, event: null })}>
            {ordered.map((x) => <option key={x.req_id} value={x.req_id}>{x.req_id} · {x.title}{x.chain.length ? '' : ' (no history)'}</option>)}
          </select>
          <span className="secondary">Show</span>
          <Seg value={changesOnly ? 'changes' : 'all'} onChange={(v) => patch({ show: v === 'all' ? null : v, event: null })} label="Show" options={[['all', 'All events'], ['changes', 'Changes only']]} />
          <IconButton label="Previous event" disabled={idx <= 0} onClick={() => step(-1)}><ChevronLeft size={14} /></IconButton>
          <IconButton label="Next event" disabled={idx < 0 || idx >= events.length - 1} onClick={() => step(1)}><ChevronRight size={14} /></IconButton>
        </>} />
      <div className={s.workspace}>
        <div className={s.scroll}><div className={s.page}>
          {all.length === 0 ? (
            <EmptyState title="No carryover history for this requirement.">It is new to this program, so there are no earlier events to show. Pick another requirement.</EmptyState>
          ) : (
            <div className={s.svgWrap} ref={ref} data-testid="lanes-wrap">
              <svg width={W} height={H} role="img" aria-label={`Event lanes for ${r.req_id}`} data-testid="lanes">
                <text x={LABEL_W + 8} y={20} style={{ font: 'var(--fw-medium) var(--text-badge) var(--font-ui)', fill: 'var(--fg-muted)', letterSpacing: '.4px' }}>EARLIER ← → THIS RFQ</text>
                {LANES.map((l, i) => (
                  <g key={l}>
                    <line x1={0} x2={W} y1={TOP + LANE_H * i} y2={TOP + LANE_H * i} stroke="var(--border-default)" />
                    <text x={10} y={TOP + LANE_H * i + LANE_H / 2 + 5} style={{ font: 'var(--fw-medium) var(--text-badge) var(--font-ui)', fill: 'var(--fg-muted)', letterSpacing: '.4px' }}>{LANE_NAME[l].toUpperCase()}</text>
                  </g>
                ))}
                {edges.map((e) => {
                  const a = pos[e.from]!, b = pos[e.to]!
                  return <line key={`${e.from}-${e.to}`} data-edge={e.sameProgram ? 'same-program' : 'cross-program'} x1={a.x + NW} y1={a.y + NH / 2} x2={b.x} y2={b.y + NH / 2} stroke="var(--fg-muted)" strokeWidth={1.5} strokeDasharray={e.sameProgram ? undefined : '6 4'} />
                })}
                {events.map((e) => {
                  const p = pos[e.id]!
                  const on = sel?.id === e.id
                  return (
                    <g key={e.id} transform={`translate(${p.x},${p.y})`} tabIndex={0} role="button" aria-pressed={on} aria-label={`${e.lane} ${e.date} ${e.title} ${e.program}${e.warn ? `, ${e.warn}` : ''}`} data-event={e.id}
                      onClick={() => setEv(e.id)} onKeyDown={(k) => (k.key === 'Enter' || k.key === ' ') && setEv(e.id)} style={{ cursor: 'pointer' }}>
                      <rect width={NW} height={NH} rx={5} fill={e.warn ? 'var(--status-warn-bg)' : 'var(--bg-card)'} stroke={on ? 'var(--border-selected)' : e.warn ? 'var(--status-warn-fg)' : 'var(--border-strong)'} strokeWidth={on || e.warn ? 2 : 1} />
                      <text x={10} y={20} style={{ font: 'var(--fw-medium) var(--text-badge) var(--font-data)', fill: e.warn ? 'var(--status-warn-fg)' : 'var(--fg-secondary)' }}>{e.lane} {e.date.slice(0, 7)}</text>
                      {e.warn && <text x={NW - 10} y={20} textAnchor="end" style={{ font: 'var(--fw-medium) var(--text-badge) var(--font-ui)', fill: 'var(--status-warn-fg)' }}>{e.warn}</text>}
                      <text x={10} y={42} style={{ font: 'var(--fw-medium) var(--text-small) var(--font-ui)', fill: 'var(--fg-primary)' }}>{clip(e.title, 20)}</text>
                      <text x={10} y={62} style={{ font: 'var(--text-small) var(--font-ui)', fill: 'var(--fg-secondary)' }}>{e.program}{e.thisRfq ? ' · this RFQ' : ''}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )}
          {changesOnly && events.length === 0 && all.length > 0 && <EmptyState title="No changes in this requirement's history." />}
          <div className={s.legend}><span><i className={s.swatchSolid} />Same program</span><span><i className={s.swatchDash} />Carried across programs</span><span><i className={s.swatchWarn} />Changed or unmet (also marked in text)</span></div>
        </div></div>
        <SidePanel defaultWidth={360} title={<><span className="data">{r.req_id}</span> · <span className="data">{r.linked_part_id}</span></>} subtitle={r.title}
          footer={<>
            <Link to={stepHref('06b-impact', `req=${r.req_id}&ret=03c-trace`)}><Button><Network size={14} aria-hidden /> Impact Map</Button></Link>
            <Link to={ret && ret.startsWith('/') ? ret : stepHref('06c-trace', `req=${r.req_id}`)}><Button>{ret && ret.startsWith('/') ? 'Back to Compare parts' : 'Back to Requirement trace'}</Button></Link>
          </>}>
          <span>{r.requirement_text}</span>
          <div className="row wrap"><SourceTag r={r} /><span className="data muted">{r.citation}</span></div>
          <Section title="Selected event">
            {sel ? (
              <div className={s.card} data-testid="selected-event">
                <span className="data muted">{sel.lane} · {sel.date} · {programShort(sel.programId)}{sel.thisRfq ? ' · this RFQ' : ''}</span>
                <span className={s.strong}>{sel.title}{sel.warn && <> <VocabBadge vocab="laneWarn" raw={sel.warn} /></>}</span>
                <span className="secondary">{sel.detail}</span>
                <span className="muted">Event {idx + 1} of {events.length}</span>
              </div>
            ) : <span className="muted">No event selected.</span>}
          </Section>
          <div className={s.tiles3} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className={s.tile}><span className="text-label-caps">Status</span><span><ConformancePill raw={r.conformance} /></span></div>
            <div className={s.tile}><span className="text-label-caps">Events</span><span className={s.stat} data-testid="stat-events">{all.length}</span></div>
            <div className={s.tile}><span className="text-label-caps">Programs</span><span className={s.stat} data-testid="stat-programs">{programs}</span></div>
            <div className={s.tile}><span className="text-label-caps">Changes</span><span className={s.stat} data-testid="stat-changes">{all.filter((e) => e.warn).length}</span></div>
          </div>
          <Badge tone="outline">Driven by carryover_events.json through the derive layer</Badge>
        </SidePanel>
      </div>
    </div>
  )
}
