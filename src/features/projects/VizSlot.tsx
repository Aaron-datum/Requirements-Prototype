import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seg, EmptyState } from '../../components/ui'
import { Stub } from '../../components/stub/Stub'
import { useVocab } from '../../config/useConfig'
import { useService } from '../../services/context'
import { FORMS, METRICS, ZOOMS, type ActionRow, type Metric, type VizForm, type VizSeries, type VizContext, type Zoom } from '../../fixtures/derive-projects'
import type { DashboardServicePlus } from '../../services/stubs/dashboard'
import { KindBadge, SeverityBadge, useVocabOrder } from './shared'
import s from './Projects.module.css'

const fmt = (unit: string, v: number): string => (unit.startsWith('USD') ? `$${v.toLocaleString('en-US')}` : String(v))
const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)

function Bars({ series }: { series: VizSeries }) {
  const max = series.kind === 'score' ? series.max ?? 1 : Math.max(1, ...series.rows.map((r) => total(r.values)))
  return (
    <div className={s.bars} role="img" aria-label={`${series.title}. A data table alternative is available in the Table form.`} data-testid="viz-chart">
      {series.rows.map((r) => (
        <div key={r.label} className={s.barRow}>
          <span className="trunc" title={r.label}>{r.label}</span>
          <span className={s.track}>
            {r.values.map((v, i) => v > 0 && (
              <span key={i} className={`${s.fill} ${s[`f_${series.tones[i] ?? 'neutral'}`]}`} style={{ width: `${(v / max) * 100}%` }} title={`${series.keys[i]}: ${fmt(series.unit, v)}`}>{(v / max) > 0.14 ? fmt(series.unit, v) : ''}</span>
            ))}
          </span>
          <span className="data" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{series.kind === 'score' ? <>{fmt(series.unit, r.values[0]!)}{r.note ? <span className="muted"> {r.note}</span> : null}</> : fmt(series.unit, total(r.values))}</span>
        </div>
      ))}
    </div>
  )
}

function Timeline({ series }: { series: VizSeries }) {
  const [lo, hi] = series.range ?? ['', '']
  const t = (d: string) => new Date(d).getTime()
  const pos = (d: string) => (hi === lo ? 50 : ((t(d) - t(lo)) / (t(hi) - t(lo))) * 82)
  return (
    <div className={s.bars} data-testid="viz-chart" role="img" aria-label={`${series.title}. Filled marker: run with a date. Hollow marker at the right: not yet run.`}>
      {series.rows.map((r) => (
        <div key={r.label} className={s.barRow}>
          <span className="trunc" title={r.label}>{r.label}</span>
          <span className={s.track}><span className={`${s.marker} ${r.date ? '' : s.markerOpen}`} style={{ left: `${r.date ? pos(r.date) + 4 : 96}%` }} /></span>
          <span className="data" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{r.date ?? 'not yet run'}<span className="muted"> {r.note}</span></span>
        </div>
      ))}
      <div className={s.axis}><span className="data">{lo}</span><span className="data">{hi}</span><span>not yet run</span></div>
    </div>
  )
}

function VizTable({ series }: { series: VizSeries }) {
  return (
    <div className={s.vizScroll}>
      <table className={s.vtable} data-testid="viz-table">
        <caption className="sr-only">{series.title}</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            {series.kind === 'stacked' && <>{series.keys.map((k) => <th key={k} scope="col" className={s.num}>{k}</th>)}<th scope="col" className={s.num}>Total</th></>}
            {series.kind === 'score' && <><th scope="col" className={s.num}>{series.keys[0]}</th><th scope="col">Detail</th></>}
            {series.kind === 'timeline' && <><th scope="col">Run date</th><th scope="col">Result</th></>}
          </tr>
        </thead>
        <tbody>
          {series.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" style={{ fontWeight: 400 }}>{r.label}</th>
              {series.kind === 'stacked' && <>{r.values.map((v, i) => <td key={i} className={`${s.num} data`}>{fmt(series.unit, v)}</td>)}<td className={`${s.num} data`}>{fmt(series.unit, total(r.values))}</td></>}
              {series.kind === 'score' && <><td className={`${s.num} data`}>{fmt(series.unit, r.values[0]!)}</td><td>{r.note}</td></>}
              {series.kind === 'timeline' && <><td className="data">{r.date ?? 'not yet run'}</td><td>{r.note}</td></>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Band 4: the data-visualisation row as a DYNAMIC slot. Three boxes cycle together: the controls (zoom level x metric x form),
 * the visualisation they select, and a legend with the unit and totals. Hand-built CSS bars; colour is never the only signal
 * (values in the bars, text legend, a data table form). State lives in the URL (zoom, metric, form) so any combination deep-links.
 */
export function VizSlot({ rows, hasData, outputGroup }: { rows: ActionRow[]; hasData: boolean; outputGroup?: string }) {
  const dash = useService('dashboard') as DashboardServicePlus
  const { resolve } = useVocab()
  const certaintyOrder = useVocabOrder('dataType')
  const resultOrder = useVocabOrder('testResult')
  const [params, setParams] = useSearchParams()

  const inOutput = outputGroup != null
  const zooms = ZOOMS.filter(([z]) => !inOutput || z !== 'program')
  const metrics = METRICS.filter(([m]) => !inOutput || (outputGroup === 'tests' ? m === 'timeline' : m !== 'timeline'))
  const pick = <T extends string>(key: string, opts: Array<[T, string]>, dflt: T): T => { const v = params.get(key); return (opts.find(([o]) => o === v)?.[0] ?? dflt) }
  const zoom = pick<Zoom>('zoom', zooms, inOutput ? 'hw' : 'program')
  const metric = pick<Metric>('metric', metrics, metrics[0]![0])
  const form = pick<VizForm>('form', FORMS, 'chart')
  const set = (k: string, v: string) => setParams((prev) => { const n = new URLSearchParams(prev); n.set(k, v); return n }, { replace: true })

  const cx = useMemo<VizContext>(() => ({
    certaintyOrder, resultOrder,
    label: (id, raw) => resolve(id, raw).label,
    tone: (id, raw) => resolve(id, raw).tone,
  }), [certaintyOrder, resultOrder, resolve])
  const series = useMemo(() => (hasData ? dash.aggregate(zoom, metric, cx) : null), [dash, hasData, zoom, metric, cx])
  const groups = useMemo(() => (form === 'actions' ? dash.vizActions(zoom, metric, rows) : []), [dash, form, zoom, metric, rows])

  return (
    <Stub id="dashboard-services" note="Aggregation across program, part and HW level over the Civic dataset">
      <div className={s.viz} data-testid="viz-slot" data-zoom={zoom} data-metric={metric} data-form={form}>
        <section className={`${s.box} ${s.ctrl}`} aria-label="Visualisation controls">
          <div className={s.ctrlGroup}><span className="text-label-caps">Zoom level</span><div className={s.seg2}><Seg<Zoom> label="Zoom level" value={zoom} options={zooms} onChange={(v) => set('zoom', v)} /></div></div>
          <div className={s.ctrlGroup}><span className="text-label-caps">Metric</span><div className={s.seg2}><Seg<Metric> label="Metric" value={metric} options={metrics} onChange={(v) => set('metric', v)} /></div></div>
          <div className={s.ctrlGroup}><span className="text-label-caps">Form</span><div className={s.seg2}><Seg<VizForm> label="Form" value={form} options={FORMS} onChange={(v) => set('form', v)} /></div></div>
        </section>

        <section className={`${s.box} ${s.vizMain}`} aria-label="Visualisation">
          {!series ? <EmptyState title="No program data for this project yet">Run a workflow to see results here.</EmptyState> : (
            <>
              <div className={s.vizTitle} data-testid="viz-title">{series.title}</div>
              {form === 'chart' && (series.kind === 'timeline' ? <Timeline series={series} /> : <Bars series={series} />)}
              {form === 'table' && <VizTable series={series} />}
              {form === 'actions' && (
                <div className={s.vizScroll} data-testid="viz-actions">
                  {groups.length === 0 && <div className="muted">No open action items for this metric.</div>}
                  {groups.map((g) => (
                    <div key={g.group}>
                      <div className={s.vizActGroup}>{g.group}</div>
                      <ul className={s.vizAct}>{g.items.map((it) => <li key={it.id} className={s.boxItem}><SeverityBadge raw={it.severity} /><span className={s.boxItemMain}><Link to={it.to}>{it.title}</Link><span className="muted">{it.status}</span></span><KindBadge raw={it.kind} /></li>)}</ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className={s.box} aria-label="Legend">
          <span className="text-label-caps">Legend</span>
          {series ? (
            <div className={s.legend}>
              {series.keys.map((k, i) => (
                <div key={k} className={s.legendRow}><span className={`${s.sw} ${s[`f_${series.tones[i] ?? 'neutral'}`]}`} aria-hidden /><span>{k}</span>{series.kind === 'stacked' && <span className="data">{fmt(series.unit, total(series.rows.map((r) => r.values[i] ?? 0)))}</span>}</div>
              ))}
              <span className="muted">Unit: {series.unit}</span>
              <span className="muted">Same numbers in Table. Next steps in Action items.</span>
            </div>
          ) : <span className="muted">Nothing to plot.</span>}
        </section>
      </div>
    </Stub>
  )
}
