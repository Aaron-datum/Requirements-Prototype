import { Check, CircleAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuditList } from '../../../components/audit/Audit'
import { MatchQuality } from '../../../components/quality/MatchQuality'
import { Stub } from '../../../components/stub/Stub'
import { Badge, Button, Checkbox, EmptyState, Modal, Seg } from '../../../components/ui'
import { useConfig, useVocab } from '../../../config/useConfig'
import {
  estimateModelFor, fanBands, maturityForModel, programShort, routingFor, routingInputOf, sourcingOptions, uncertaintyDrivers, type EstimateModel, type EstimateVariant,
} from '../../../fixtures/derive-bom'
import { MAX_ALTERNATES, modelFamily } from '../../../fixtures/extras/bom/rules'
import { useService } from '../../../services/context'
import { toastSuccess } from '../../../stores/toastStore'
import { money, signedMoney, useBomVocab } from './bomConfig'
import { useBomStore } from './bomStore'
import { useBomRows } from './useBomData'
import s from './bom.module.css'

interface Alt { id: string; group: 'Cost model' | 'Surrogate CAD' | 'Supplier'; label: string; variant: EstimateVariant }

function FanChart({ bands }: { bands: ReturnType<typeof fanBands> }) {
  const w = 320, h = 120, pad = 24
  const max = Math.max(...bands.map((b) => b.high)), min = Math.min(...bands.map((b) => b.low))
  const x = (m: number) => pad + (m / 24) * (w - pad * 2)
  const y = (v: number) => h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2)
  const top = bands.map((b, i) => `${i ? 'L' : 'M'}${x(b.months)},${y(b.high)}`).join(' ')
  const bottom = [...bands].reverse().map((b) => `L${x(b.months)},${y(b.low)}`).join(' ')
  return (
    <svg className={s.fan} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Price over time: the range widens from the current band to plus or minus 15 percent at 24 months" data-testid="fan-chart">
      <path d={`${top} ${bottom} Z`} />
      {bands.map((b) => <g key={b.months}><line x1={x(b.months)} x2={x(b.months)} y1={h - pad} y2={h - pad + 4} /><text x={x(b.months)} y={h - 6} textAnchor="middle">{b.months}m</text></g>)}
      <text x={pad} y={12}>{money(bands[bands.length - 1]!.high, 0)}</text><text x={pad} y={h - pad - 4}>{money(bands[bands.length - 1]!.low, 0)}</text>
    </svg>
  )
}

/** 03d Cost estimate: routing, input maturity, six cost lines with trace, sourcing options (read-only) and compare mode. */
export function CostEstimate() {
  const [params, setParams] = useSearchParams()
  const config = useConfig()
  const vocab = useVocab()
  const bvocab = useBomVocab()
  const audit = useService('audit')
  const rows = useBomRows()
  const choiceMap = useBomStore((st) => st.cost)
  const sources = useBomStore((st) => st.sources)
  const setCost = useBomStore((st) => st.setCost)
  const [selLine, setSelLine] = useState(1)
  const [overriding, setOverriding] = useState(false)
  const [overrideTo, setOverrideTo] = useState('')
  const [features, setFeatures] = useState(false)
  const [supSel, setSupSel] = useState<string | null>(null)
  const [alts, setAlts] = useState<string[]>([])
  const [cell, setCell] = useState<{ col: string; line: number } | null>(null)
  const sourcingRef = useRef<HTMLElement | null>(null)

  useEffect(() => { if (useBomStore.getState().search === 'idle') useBomStore.getState().finishSearch() }, [])
  const partNo = params.get('part')
  const row = rows.find((r) => r.partNumber === partNo || r.id === params.get('line')) ?? null
  const view = params.get('view') === 'compare' ? 'compare' : 'estimate'
  useEffect(() => { if (params.get('view') === 'sourcing') sourcingRef.current?.scrollIntoView?.({ block: 'start' }) }, [params, row])

  const inp = useMemo(() => (row ? routingInputOf(row) : null), [row])
  const choice = row ? choiceMap[row.partNumber] : undefined
  const current: EstimateVariant = choice?.current ?? {}
  const routing = useMemo(() => (inp ? routingFor(inp) : null), [inp])
  const est = useMemo(() => (row && inp ? estimateModelFor(row.partNumber, inp, current) : null), [row, inp, current])
  const connected = Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, v !== false]))

  if (!row || !inp || !routing || !est) return <div className={s.page}><EmptyState title="No BOM line selected" action={<Link to="/create/bom/03-review"><Button primary>Back to BOM</Button></Link>}>Open a line in BOM review and choose Open Cost Estimate.</EmptyState></div>

  const partId = row.partNumber
  const modelName = current.model ?? routing.modelName
  const statusRaw = choice?.status === 'confirmed' ? 'Confirmed' : choice?.status === 'overridden' ? 'Overridden' : routing.statusRaw
  const status = bvocab.resolve('routingStatus', statusRaw)
  const quoted = routing.statusRaw === 'Supplier quote on file'
  const modelScore = routing.models.find((m) => m.name === modelName)?.score ?? routing.models[0]!.score
  const line = est.lines[selLine] ?? est.lines[0]!
  const opts = sourcingOptions(inp, est.landed, row.certainty, est.landedConfidence)
  const sup = opts.find((o) => o.supplierId === (supSel ?? opts[0]!.supplierId))!
  const by = config.currentUser.name
  const subject = { type: 'cost-model', id: partId }
  const setView = (v: string) => { const n = new URLSearchParams(params); n.set('view', v); setParams(n, { replace: true }) }

  const confirmModel = () => {
    setCost(partId, { status: 'confirmed' })
    audit.record({ by, action: `Confirmed cost model: ${modelName}`, subject, note: `routing score ${modelScore}` })
    toastSuccess(`Cost model confirmed: ${partId}`)
  }
  const override = () => {
    if (!overrideTo) return
    setCost(partId, { status: 'overridden', current: { ...current, model: overrideTo } })
    audit.record({ by, action: `Overrode cost model: ${modelName} → ${overrideTo}`, subject })
    toastSuccess(`Cost model overridden: ${partId}`)
    setOverriding(false)
  }

  const altDefs: Alt[] = [
    ...routing.models.filter((m) => m.name !== modelName).map((m): Alt => ({ id: `model:${m.name}`, group: 'Cost model', label: `${modelFamily(m.name).label} ${m.score}%`, variant: { model: m.name } })),
    ...row.candidates.filter((c) => c.partId !== (current.surrogatePartId ?? est.basisPartId)).slice(0, 2).map((c): Alt => ({ id: `cad:${c.partId}`, group: 'Surrogate CAD', label: `${c.partId} ${c.matchPct}%`, variant: { surrogatePartId: c.partId } })),
    ...opts.filter((o) => !o.current && o.supplierId !== current.supplierId).map((o): Alt => ({ id: `sup:${o.supplierId}`, group: 'Supplier', label: `${o.supplier.name} (${o.region.slice(0, 2)})`, variant: { supplierId: o.supplierId } })),
  ]
  const chosen = alts.map((id) => altDefs.find((a) => a.id === id)).filter((a): a is Alt => !!a)
  const altEst = chosen.map((a) => ({ a, e: estimateModelFor(partId, inp, { ...current, ...a.variant }) }))
  const makeCurrent = (a: Alt) => { setCost(partId, { current: { ...current, ...a.variant } }); setAlts(alts.filter((x) => x !== a.id)); toastSuccess(`Current estimate: ${a.label}`) }
  const colTrace = cell ? (cell.col === 'current' ? est : altEst.find((x) => x.a.id === cell.col)?.e) : null
  const share = (e: EstimateModel, n: number) => Math.round((n / e.landed) * 100)
  const tag = (raw: string) => bvocab.resolve('traceTag', raw)
  const mat = (raw: string) => bvocab.resolve('inputMaturity', raw)

  return (
    <div className={s.page} data-testid="cost-estimate">
      <div className={s.pageHead}>
        <div className="col" style={{ gap: 4 }}>
          <div className="row wrap"><h1 className="text-page">{row.name} — cost estimate</h1><Badge tone="neutral">{opts.length} suppliers</Badge></div>
          <span className="data muted">{partId} · current supplier {row.supplier} ({row.region}) · {row.currency} · FX 3-mo avg{connected.ecb === false ? ' (feed cached)' : ''}</span>
        </div>
        <div className={s.actions}>
          <Seg value={view} onChange={setView} label="Estimate or compare" options={[['estimate', 'Estimate'], ['compare', `Compare (${chosen.length})`]]} />
          <Link to={`/create/bom/03-review?line=${row.id}&tab=costing`}><Button>Back to BOM</Button></Link>
          <Link to={`/create/bom/03b-compare?line=${row.id}`}><Button>Compare Parts</Button></Link>
          <Button primary disabled title="Changing suppliers is read-only in the prototype (D-12)">Set as Sourced</Button>
        </div>
      </div>

      <Stub id="cost-model" note="Routing, lines and trace are deterministic fixtures">
        <div className={s.grid3}>
          <section className={s.card} aria-label="Cost model routing" data-testid="routing">
            <span className="text-label-caps">Cost model routing</span>
            <b>{modelFamily(modelName).label} <span className="muted" style={{ fontWeight: 400 }}>· {modelName}</span></b>
            <div className="row wrap"><Badge tone="info">Routing score {modelScore}%</Badge><Badge tone={status.tone} icon={choice?.status === 'confirmed' ? <Check size={12} aria-hidden /> : undefined}>{status.label}</Badge></div>
            <span className="muted">Next best: {routing.nextBest} · {routing.models[1]!.score}%</span>
            <div className="row wrap">
              <Button primary disabled={choice?.status === 'confirmed' || quoted} onClick={confirmModel}>Confirm Model</Button>
              <Button disabled={quoted} onClick={() => { setOverriding(!overriding); setOverrideTo(routing.models[1]!.name) }}>Override</Button>
            </div>
            {overriding && (
              <div className="row wrap"><select aria-label="Override model" value={overrideTo} onChange={(e) => setOverrideTo(e.target.value)} style={{ height: 'var(--input-height)', maxWidth: 260, background: 'var(--bg-card)', color: 'var(--fg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)' }}>
                {routing.models.map((m) => <option key={m.name} value={m.name}>{modelFamily(m.name).label} · {m.score}%</option>)}</select>
                <Button size="sm" primary onClick={override}>Apply override</Button></div>)}
            <Stub id="audit-trail" note="In-memory ledger"><AuditList subject={subject} limit={3} emptyText="No routing decision recorded." /></Stub>
          </section>
          <section className={s.card} aria-label="Why this model" data-testid="why-model">
            <span className="text-label-caps">Why this model</span>
            {routing.why.map((w, i) => <div key={i} className="row" style={{ alignItems: 'flex-start' }}><Check size={14} aria-hidden style={{ flex: 'none', marginTop: 3 }} /><span className="grow">{w.note}</span><Badge tone={bvocab.resolve('costTag', w.tag).tone}>{bvocab.resolve('costTag', w.tag).label}</Badge></div>)}
          </section>
          <section className={s.card} style={{ overflowX: 'auto' }} aria-label="Input maturity" data-testid="maturity">
            <span className="text-label-caps">Input maturity · pursuit</span>
            <table className={s.tbl}><thead><tr><th>Input</th>{routing.models.map((m) => <th key={m.name} title={m.name}>{modelFamily(m.name).label}</th>)}</tr></thead><tbody>
              {([['3D CAD', 'cad3d'], ['2D drawing', 'drawing2d'], ['Material spec', 'materialSpec']] as const).map(([label, k]) => (
                <tr key={k}><td>{label}</td>{routing.models.map((m) => { const v = mat(maturityForModel(routing, m.name)[k]); return <td key={m.name}><Badge tone={v.tone}>{v.label}</Badge></td> })}</tr>))}
              <tr><td>Ceiling</td>{routing.models.map((m) => { const mm = maturityForModel(routing, m.name); return <td key={m.name}><Badge tone={vocab.resolve('dataType', mm.ceiling).tone}>{vocab.resolve('dataType', mm.ceiling).label} ≤ {mm.ceilingCap}</Badge></td> })}</tr>
            </tbody></table>
          </section>
        </div>

        {view === 'estimate' ? (
          <div className={s.grid2} style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(300px, 2fr)', alignItems: 'start' }}>
            <section className={s.card} style={{ padding: 0 }} aria-label="Estimate">
              <div style={{ padding: 'var(--gap-4)' }} className="col">
                <div className="row wrap"><span className="text-label-caps grow">Estimate · {est.family.label}{est.basisPartId ? ` · ${est.basisPartId}` : ''}</span><MatchQuality quality={{ dataType: { raw: row.certainty }, confidence: { score: est.landedConfidence, why: [`Range rule: ±${est.rangePct}% at confidence ${est.landedConfidence}`] } }} /></div>
                <div className="row wrap" style={{ alignItems: 'baseline' }}><span className={s.statN} data-testid="landed">{money(est.landed)}</span><span className="data muted" data-testid="range">{money(est.low)} – {money(est.high)} · ±{est.rangePct}%</span></div>
                <div className={s.stack} role="img" aria-label="Share of landed cost by line">{est.lines.map((l, i) => <i key={l.key} data-on={i === selLine} style={{ flex: l.amount }} title={`${l.line} ${share(est, l.amount)}%`} />)}</div>
                {!est.seeded && <span className="muted row"><CircleAlert size={14} aria-hidden />Derived estimate: no routing record is seeded for this part, so lines are allocated from the BOM price.</span>}
                {est.datasetLines && <span className="muted">Re-expressed from the dataset lines: {est.datasetLines}.{est.varianceToBomPct != null ? ` BOM unit price ${money(est.bomUnitPrice)}; the two differ by ${Math.abs(est.varianceToBomPct)}%.` : ''}</span>}
              </div>
              <table className={s.tbl} data-testid="cost-lines"><thead><tr><th>Cost line</th><th className="num" style={{ textAlign: 'right' }}>Cost</th><th className="num" style={{ textAlign: 'right' }}>Share</th><th>Confidence</th></tr></thead><tbody>
                {est.lines.map((l, i) => (
                  <tr key={l.key} data-pick data-line={l.key} tabIndex={0} aria-selected={i === selLine} onClick={() => setSelLine(i)} onKeyDown={(e) => e.key === 'Enter' && setSelLine(i)}>
                    <td>{l.line}</td><td className="num">{money(l.amount)}</td><td className="num">{share(est, l.amount)}%</td><td><MatchQuality quality={{ confidence: { score: l.confidence } }} /></td></tr>))}
                <tr><td><b>Landed cost</b></td><td className="num"><b>{money(est.landed)}</b></td><td className="num">100%</td><td><MatchQuality quality={{ confidence: { score: est.landedConfidence } }} /></td></tr>
              </tbody></table>
            </section>
            <section className={s.card} aria-label="Trace" data-testid="trace">
              <span className="text-label-caps">Trace · current estimate</span>
              <div className="row"><b className="grow">{line.line}</b><span className="data">{money(line.amount)}</span></div>
              <span className="data muted">{line.formula}</span>
              <MatchQuality quality={{ confidence: { score: line.confidence } }} />
              {line.trace.map((t) => (
                <div key={t.name} className="col" style={{ gap: 2, borderTop: '1px solid var(--border-default)', paddingTop: 'var(--gap-2)' }} data-input={t.name}>
                  <div className="row"><span className="grow">{t.name}</span><span className="data">{t.value}</span></div>
                  <div className="row wrap"><span className="muted grow">{t.source} · {t.freshness}</span><Badge tone={tag(t.tag).tone}>{tag(t.tag).label}</Badge>
                    {t.tag === 'CAD features' && <button type="button" style={{ background: 'none', border: 0, color: 'var(--accent)' }} onClick={() => setFeatures(true)}>Open Features</button>}</div>
                </div>))}
              <span className="data muted" data-testid="assumed-count">{line.assumedCount} of {line.trace.length} inputs assumed</span>
              <div className="row wrap"><Button size="sm" onClick={() => setView('compare')}>Compare Alternatives</Button><Button size="sm" disabled title="Not wired in the prototype">Edit Input</Button></div>
            </section>
          </div>
        ) : (
          <section className={s.card} aria-label="Compare estimates" data-testid="compare-mode">
            <div className="row wrap"><h2 className="text-section grow">Compare estimates</h2><span className="muted">Up to {MAX_ALTERNATES} alternates · {chosen.length} chosen</span></div>
            <div className={s.grid3}>
              {(['Cost model', 'Surrogate CAD', 'Supplier'] as const).map((g) => (
                <div key={g} className="col"><span className="text-label-caps">{g}</span>
                  {altDefs.filter((a) => a.group === g).length === 0 && <span className="muted">None available</span>}
                  {altDefs.filter((a) => a.group === g).map((a) => (
                    <Checkbox key={a.id} label={a.label} checked={alts.includes(a.id)} disabled={!alts.includes(a.id) && alts.length >= MAX_ALTERNATES}
                      onChange={(on) => setAlts(on ? [...alts, a.id] : alts.filter((x) => x !== a.id))} />))}
                </div>))}
            </div>
            <div className={s.tableWrap}>
              <table className={s.tbl} data-testid="compare-table"><thead><tr><th>Line</th><th>Current</th>{altEst.map(({ a }) => <th key={a.id}>{a.group}<br /><span style={{ textTransform: 'none' }}>{a.label}</span></th>)}</tr>
                <tr><th /><th><span style={{ textTransform: 'none' }}>{est.family.label} · {est.basisPartId ?? partId}</span></th>{altEst.map(({ a }) => <th key={a.id}><Button size="sm" onClick={() => makeCurrent(a)}>Make Current</Button></th>)}</tr></thead><tbody>
                {est.lines.map((l, i) => (
                  <tr key={l.key}><td>{l.line}</td>
                    <td className="num" data-pick onClick={() => setCell({ col: 'current', line: i })}>{money(l.amount)}</td>
                    {altEst.map(({ a, e }) => { const d = e.lines[i]!.amount - l.amount; return <td key={a.id} className="num" data-pick onClick={() => setCell({ col: a.id, line: i })}>{money(e.lines[i]!.amount)} <span className={d > 0 ? s.up : s.down}>{d === 0 ? '' : signedMoney(Math.round(d * 100) / 100)}</span></td> })}</tr>))}
                <tr><td><b>Landed cost</b></td><td className="num"><b>{money(est.landed)}</b></td>{altEst.map(({ a, e }) => { const d = e.landed - est.landed; return <td key={a.id} className="num"><b>{money(e.landed)}</b> <span className={d > 0 ? s.up : s.down}>{signedMoney(Math.round(d * 100) / 100)}</span></td> })}</tr>
                <tr><td>Confidence</td><td><MatchQuality quality={{ confidence: { score: est.landedConfidence } }} /></td>{altEst.map(({ a, e }) => <td key={a.id}><MatchQuality quality={{ confidence: { score: e.landedConfidence } }} /></td>)}</tr>
              </tbody></table>
            </div>
            {cell && colTrace && (
              <div className="col" data-testid="cell-trace"><span className="text-label-caps">Trace · {colTrace.lines[cell.line]!.line} · {cell.col === 'current' ? 'current' : altEst.find((x) => x.a.id === cell.col)?.a.label}</span>
                {colTrace.lines[cell.line]!.trace.map((t) => <div key={t.name} className="row wrap"><span style={{ minWidth: 140 }}>{t.name}</span><span className="data" style={{ minWidth: 90 }}>{t.value}</span><span className="muted grow">{t.source} · {t.freshness}</span><Badge tone={tag(t.tag).tone}>{tag(t.tag).label}</Badge></div>)}</div>)}
          </section>
        )}

        <section className={s.card} ref={sourcingRef} id="sourcing" aria-label="Sourcing options" data-testid="sourcing">
          <div className="row wrap"><h2 className="text-section">Sourcing options</h2><span className="muted">Other suppliers for this part. Select a row to preview the switch. Read-only.</span></div>
          <div className={s.tableWrap}>
            <table className={s.tbl}><thead><tr><th>Supplier</th><th>Region</th><th className="num" style={{ textAlign: 'right' }}>Landed cost</th><th className="num" style={{ textAlign: 'right' }}>Lead</th><th>Price source</th><th>Certainty</th></tr></thead><tbody>
              {opts.map((o) => (
                <tr key={o.supplierId} data-pick data-supplier={o.supplierId} tabIndex={0} aria-selected={o.supplierId === sup.supplierId} onClick={() => setSupSel(o.supplierId)} onKeyDown={(e) => e.key === 'Enter' && setSupSel(o.supplierId)}>
                  <td>{o.supplier.name}{o.current && <> <Badge tone="outline">current</Badge></>}</td><td className="data">{o.region}</td><td className="num">{money(o.landed)}</td><td className="num">{o.leadWeeks} wk</td><td>{o.priceSource || '—'}</td>
                  <td><MatchQuality quality={{ dataType: { raw: o.certainty }, confidence: { score: o.confidence } }} /></td></tr>))}
            </tbody></table>
          </div>
          <div className={s.grid2}>
            <div className="col" data-testid="switch-preview"><span className="text-label-caps">If you switch to {sup.supplier.name}</span>
              {sup.current ? <span className="muted">Current supplier. No change.</span> : (<>
                <span>{signedMoney(Math.round((sup.landed - est.landed) * 100) / 100)} per unit ({(((sup.landed - est.landed) / est.landed) * 100).toFixed(1)}%), lead {sup.leadWeeks - opts[0]!.leadWeeks >= 0 ? '+' : '−'}{Math.abs(sup.leadWeeks - opts[0]!.leadWeeks)} wk.</span>
                <span className="muted">Cascade: BOM first-order cost {signedMoney(Math.round((sup.landed - est.landed) * row.quantity * 100) / 100)} for {row.quantity} per unit; certainty drops to {vocab.resolve('dataType', sup.certainty).label} at confidence {sup.confidence}.</span></>)}
              <Button size="sm" disabled title="Changing suppliers is read-only in the prototype (D-12)">Set as Sourced</Button></div>
            <div className="col"><span className="text-label-caps">Cost against certainty</span>
              <div className={s.certBars}>{opts.map((o) => (
                <div key={o.supplierId} className={s.barRow} style={{ gridTemplateColumns: 'minmax(90px, 1fr) 2fr 2fr' }}><span className="trunc">{o.supplier.name}</span>
                  <div className={s.bar} role="meter" aria-label={`${o.supplier.name} cost`} aria-valuenow={o.landed} aria-valuemin={0} aria-valuemax={Math.max(...opts.map((x) => x.landed))}><i style={{ width: `${(o.landed / Math.max(...opts.map((x) => x.landed))) * 100}%` }} /></div>
                  <span className="row"><div className={s.bar} style={{ flex: 1 }} role="meter" aria-label={`${o.supplier.name} certainty`} aria-valuenow={o.confidence} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${o.confidence}%` }} /></div><span className="data">{o.confidence}</span></span></div>))}</div></div>
          </div>
          <div className={s.grid2}>
            <div className="col"><span className="text-label-caps">Non-price factors</span>
              <dl className={s.kv}><dt>Lead time</dt><dd className="data">{sup.leadWeeks} wk</dd><dt>Region</dt><dd className="data">{sup.region}</dd><dt>Redundancy</dt><dd>{opts.length - 1} known alternates</dd><dt>Programs using part</dt><dd>{[...new Set(row.origin === 'dataset' ? [programShort('PGM-CIV-SI')] : [])].join(' · ') || 'New'}</dd></dl></div>
            <div className="col" data-testid="fx-panel"><span className="text-label-caps">FX and volatility</span>
              {uncertaintyDrivers(row, connected).drivers.map((d) => <div key={d.name} className="row"><span style={{ minWidth: 104 }}>{d.name}</span><span className="data" style={{ minWidth: 52 }}>±{d.pct}%</span><span className="muted grow trunc">{d.note}</span></div>)}
              <FanChart bands={fanBands(est.landed, est.rangePct)} /></div>
          </div>
        </section>
      </Stub>

      {features && (
        <Modal title={`Detected features · ${line.line}`} onClose={() => setFeatures(false)} footer={<Button onClick={() => setFeatures(false)}>Close</Button>}>
          <ul style={{ margin: 0, paddingLeft: 'var(--gap-4)' }}>{est.features.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="muted">Feature values are illustrative lookups. Real feature recognition comes from the CAD pipeline.</p>
        </Modal>
      )}
    </div>
  )
}
