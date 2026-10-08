import { useMemo, useState } from 'react'
import { go, useRoute } from '../router'
import EntryShell from '../components/EntryShell'
import { Badge, Btn, PageHead } from '../components/ui'
import Icon from '../components/Icon'
import { ALL_CRIT, CRITERIA, MODES, assemblies, assemblyLabel, searchHref } from '../data/search'
import { partById, progShort } from '../data'
import partsRaw from '../../../datum-requirements-workflow-handoff/data/parts.json'

export default function SearchSource({ mode }) {
  const { query } = useRoute()
  const m = MODES[mode] || MODES.pp
  const dup = query.dup, rev = query.rev
  const [q, setQ] = useState('')
  const [part, setPart] = useState(null)
  const [assy, setAssy] = useState(null)
  const [crit, setCrit] = useState(dup ? ['geometry', 'manufacture_complexity', 'material'] : ALL_CRIT)
  const [file, setFile] = useState(null)
  const [over, setOver] = useState(false)
  const isAssy = mode === 'aa'
  const needsAssy = mode === 'ps'
  const needsPart = mode !== 'aa'

  const parts = useMemo(() => {
    const pool = needsAssy ? (assy ? assy.parts : []) : partsRaw
    const t = q.toLowerCase()
    return pool.filter((p) => !t || (p.part_id + p.name + p.subsystem).toLowerCase().includes(t)).slice(0, 60)
  }, [q, assy, needsAssy])
  const assyList = useMemo(() => assemblies.filter((a) => !q || (a.subassembly + progShort(a.program_id)).toLowerCase().includes(q.toLowerCase())), [q])

  // Prototype: file contents are not parsed. The filename is matched to the closest catalog record.
  const onFile = (f) => {
    if (!f) return
    setFile(f.name)
    const toks = f.name.toLowerCase().replace(/\.[a-z0-9]+$/, '').split(/[^a-z0-9]+/).filter((t) => t.length > 2)
    const best = [...partsRaw].map((p) => [p, toks.filter((t) => (p.part_id + ' ' + p.name).toLowerCase().includes(t)).length]).sort((a, b) => b[1] - a[1])[0]
    if (best && best[1] > 0) { setPart(best[0]); if (isAssy) setQ(best[0].subsystem) }
  }
  const ready = isAssy ? !!assy : needsAssy ? !!(assy && part) : !!part
  const src = isAssy ? assy?.key : needsAssy ? `${assy?.program_id}|${assy?.subassembly}|${part?.part_id}` : part?.part_id
  const run = () => {
    const extra = (dup ? '&min=85' : '') + (rev ? '&fam=1' : '')
    go(searchHref({ mode, src, crit }) + extra)
  }
  const heading = dup ? 'Find duplicates' : rev ? 'Find revisions' : m.title

  return (
    <EntryShell active={dup ? 'Find Duplicates' : rev ? 'Find Revisions' : isAssy ? 'Assembly Search' : 'Part Search'}>
      <div className="page" style={{ maxWidth: 1000 }}>
        <PageHead title={heading} sub={<><Badge tone="info">{m.label}</Badge> {dup ? 'Parts that are geometric and material duplicates of the source part, differing only in PLM metadata.' : rev ? 'Other revisions of the same part family.' : m.desc}</>}>
          <Btn onClick={() => go('/search')}>All search types</Btn>
        </PageHead>

        <label className={`dropzone ${over ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files[0]) }}>
          <Icon n="upload" size={20} /><b>Drop a CAD file here, or click to browse</b>
          <span className="muted small">STEP · SLDPRT · IGES · PRT</span>
          <input type="file" hidden accept=".step,.stp,.sldprt,.sldasm,.igs,.iges,.prt,.catpart,.catproduct" onChange={(e) => onFile(e.target.files[0])} />
          {file && <span className="mono">{file}{part ? ` → matched ${part.part_id}` : ' → no close name match; pick a record below'}</span>}
          <span className="muted small">Prototype: file contents aren’t parsed — pick the source record below, or name a file after a part (e.g. “turbine-housing.step”).</span>
        </label>

        <section className="card col">
          <div className="row"><span className="h3 grow">{needsAssy ? '1 · Pick the assembly' : isAssy ? 'Pick the source assembly' : 'Pick the source part'}</span>
            <input type="search" placeholder={isAssy || needsAssy ? 'Search assemblies…' : 'Search by name, part number, subsystem…'} value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} aria-label="Search source records" /></div>
          {(isAssy || needsAssy) && (
            <div className="col" style={{ maxHeight: 220, overflowY: 'auto', gap: 0 }}>
              {assyList.map((a) => (
                <button key={a.key} className={`navitem ${assy?.key === a.key ? 'on' : ''}`} onClick={() => { setAssy(a); setPart(null) }}>
                  <Icon n="folder" /><span className="grow">{a.subassembly}</span><Badge tone={a.program_id === 'PGM-CIV-SI' ? 'info' : 'neutral'}>{progShort(a.program_id)}</Badge><span className="count">{a.parts.length} parts</span></button>))}
            </div>)}
          {needsPart && (<>
            {needsAssy && <span className="h3">2 · Pick the part in {assy ? assemblyLabel(assy) : 'the assembly'}</span>}
            <div className="col" style={{ maxHeight: 240, overflowY: 'auto', gap: 0 }}>
              {needsAssy && !assy && <span className="muted">Choose an assembly first.</span>}
              {parts.map((p) => (
                <button key={p.part_id} className={`navitem ${part?.part_id === p.part_id ? 'on' : ''}`} onClick={() => setPart(p)}>
                  <Icon n="box" /><span className="grow">{p.name}</span><span className="mono muted">{p.part_id}</span><span className="muted small">{p.subsystem}</span></button>))}
            </div></>)}
        </section>

        <section className="card col">
          <span className="h3">Match criteria <span className="muted small" style={{ fontWeight: 400 }}>· {crit.length} of {CRITERIA.length} requirements</span></span>
          <div className="row wrap">{CRITERIA.map(([k, l]) => (
            <label key={k} className="row" style={{ gap: 6 }}><input type="checkbox" checked={crit.includes(k)} onChange={(e) => setCrit(e.target.checked ? [...crit, k] : crit.filter((x) => x !== k))} />{l}</label>))}</div>
          <span className="muted small">The same five components as the BOM Similarity tab: geometry is one input among several, not a separate tier.</span>
        </section>

        <div className="row">
          <Btn primary className="lg" disabled={!ready || !crit.length} onClick={run}><Icon n="search" />Run search</Btn>
          {ready && <span className="sec">Source: {isAssy ? assemblyLabel(assy) : needsAssy ? `${part.name} in ${assemblyLabel(assy)}` : `${part.name} · ${part.part_id}`}</span>}
        </div>
      </div>
    </EntryShell>
  )
}
