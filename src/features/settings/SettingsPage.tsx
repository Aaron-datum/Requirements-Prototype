import { useState } from 'react'
import { useBreadcrumbs } from '../../components/shell/useBreadcrumbs'
import { Badge, Button, Seg } from '../../components/ui'
import { TENANTS } from '../../config/appConfig'
import { useConfig } from '../../config/useConfig'
import { Stub } from '../../components/stub/Stub'
import { useService } from '../../services/context'
import { useAppStore } from '../../stores/appStore'
import { activeMapping, bindingCounts, bindingOf, CAD_PRESETS, hasConflict, useCadStore, type CadMapping } from '../../stores/cadStore'
import { toastSuccess } from '../../stores/toastStore'
import s from './Settings.module.css'

const DENSITY_META = { comfy: 'UI scale 112% · larger text and controls · 8 rows per page', default: 'UI scale 100% · 10 rows per page', compact: 'UI scale 88% · denser text and controls · 15 rows per page' } as const

/** Settings → System: theme, global density (UI scale), schema picker (company A / B), plan label, 3D CAD controls. */
export function SettingsPage() {
  useBreadcrumbs([{ label: 'Home', to: '/' }, { label: 'Settings' }, { label: 'System' }])
  const a = useAppStore()
  const config = useConfig()
  const audit = useService('audit')
  const cad = useCadStore()
  const saved = activeMapping(cad)
  const [preset, setPreset] = useState(cad.preset)
  const [custom, setCustom] = useState<CadMapping>(cad.custom)
  const map: CadMapping = preset === 'custom' ? custom : CAD_PRESETS[preset]
  const counts = bindingCounts(map)
  const conflict = hasConflict(map)
  const dirty = preset !== cad.preset || (preset === 'custom' && JSON.stringify(custom) !== JSON.stringify(cad.custom))
  const save = () => {
    cad.save(preset, custom)
    audit.record({ by: config.currentUser.name, action: 'Saved 3D CAD controls', subject: { type: 'settings', id: 'cad-controls' }, note: preset })
    toastSuccess('3D CAD controls saved')
  }
  void saved
  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <div><h1 className="text-page">System</h1><p className="secondary">Appearance, table defaults, schema and 3D CAD navigation controls. Changes apply across the whole app.</p></div>

        <section className={s.card} aria-label="Color theme"><h2 className="text-section">Color theme</h2><p className="muted">Minimum contrast ratios are maintained across all modes.</p>
          <Seg value={a.theme} onChange={(theme) => a.set({ theme })} label="Color theme" options={[['white', 'White'], ['tan', 'Tan'], ['dark', 'Dark']]} /></section>

        <section className={s.card} aria-label="Info density"><h2 className="text-section">Info density</h2><p className="muted">Scales text, controls and spacing across the whole app, and sets row height in every table. Pick what suits your eyesight and monitor.</p>
          <Seg value={a.density} onChange={(density) => a.set({ density })} label="Info density" options={[['comfy', 'Comfortable'], ['default', 'Default'], ['compact', 'Compact']]} />
          <span className="data muted">{DENSITY_META[a.density]}</span></section>

        <section className={s.card} aria-label="Schema"><h2 className="text-section">Data schema (tenant profile)</h2>
          <p className="muted">Field names, groups, status vocabularies and tones come from configuration. Switching the schema changes filter sidebars, columns, detail tabs and status tones with no code change.</p>
          <Seg value={a.tenantId} onChange={(tenantId) => a.set({ tenantId })} label="Schema" options={Object.values(TENANTS).map((t): [string, string] => [t.id, t.label])} />
          <div className="row wrap"><Badge tone="outline">{config.schema.fields.length} fields</Badge><Badge tone="outline">Requirement table label: {config.requirementTableLabel}</Badge>{config.tenantLabel && <Badge tone="outline">Tenant badge: {config.tenantLabel}</Badge>}</div></section>

        <section className={s.card} aria-label="Plan label"><h2 className="text-section">Plan label</h2><p className="muted">What the approved output is called in the Create workflow.</p>
          <Seg value={a.planLabel} onChange={(planLabel) => a.set({ planLabel })} label="Plan label" options={['Test plan', 'ADV P&R']} /></section>

        <section className={s.card} aria-label="3D CAD controls">
          <div className="row wrap" style={{ alignItems: 'flex-start' }}><div className="grow"><h2 className="text-section">3D CAD controls</h2><p className="muted">Mouse + modifier bindings for the CAD viewer. Presets load standard schemes; Custom is fully configurable. The viewer is a placeholder in the prototype, so these only record your preference.</p></div>
            <Seg value={preset} onChange={setPreset} label="CAD preset" options={[['catia', 'CATIA'], ['nx', 'NX'], ['custom', 'Custom']]} /></div>
          {conflict && <div className={s.conflict} role="alert"><b>Conflict detected.</b> Two actions share the same binding. Resolve before saving.</div>}
          <div className={s.grid}>
            <div className={`${s.cadRow} ${s.cadHead}`}><span>Action</span><span>Mouse</span><span>Modifier</span><span>Binding</span></div>
            {Object.keys(map).map((act) => {
              const [mouse, mod] = map[act]!
              const b = bindingOf(map[act]!)
              const bad = (counts[b] ?? 0) > 1
              const edit = (i: 0 | 1, v: string) => setCustom({ ...custom, [act]: i === 0 ? [v, mod] : [mouse, v] })
              return (
                <div className={s.cadRow} key={act}><span>{act}</span>
                  {preset === 'custom' ? (<>
                    <select className={s.sel} aria-label={`${act} mouse`} value={mouse} onChange={(e) => edit(0, e.target.value)}>{['Left', 'Middle', 'Right', 'Scroll'].map((o) => <option key={o}>{o}</option>)}</select>
                    <select className={s.sel} aria-label={`${act} modifier`} value={mod} onChange={(e) => edit(1, e.target.value)}>{['None', 'Shift', 'Ctrl', 'Alt'].map((o) => <option key={o}>{o}</option>)}</select></>)
                    : (<><span className="data">{mouse}</span><span className="data">{mod}</span></>)}
                  <span><Badge tone={bad ? 'fail' : 'neutral'}>{b}{bad ? ' · conflict' : ''}</Badge></span></div>
              )
            })}
          </div>
          <div className="row"><Stub id="audit-trail" note="Save writes an audit entry" inline><Button primary disabled={conflict || !dirty} onClick={save}>Save CAD Controls</Button></Stub><Button disabled={!dirty} onClick={() => { setPreset(cad.preset); setCustom(cad.custom) }}>Discard Changes</Button>
            {!dirty && <span className="muted">Saved: {cad.preset === 'custom' ? 'Custom' : cad.preset.toUpperCase()}</span>}</div>
        </section>
      </div>
    </div>
  )
}
