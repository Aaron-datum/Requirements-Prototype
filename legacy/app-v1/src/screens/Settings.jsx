import { useState } from 'react'
import { useStore } from '../store'
import { Badge, Btn, PageHead, Seg } from '../components/ui'

// Presets and the default binding set come from the Settings design prototype (System section).
export const CAD_PRESETS = {
  catia: { Rotate: ['Middle', 'None'], Pan: ['Middle', 'Ctrl'], Zoom: ['Scroll', 'None'], Select: ['Left', 'None'], 'Context Menu': ['Right', 'None'] },
  nx: { Rotate: ['Middle', 'None'], Pan: ['Middle', 'Shift'], Zoom: ['Scroll', 'None'], Select: ['Left', 'None'], 'Context Menu': ['Right', 'None'] },
}
const DEFAULT_CUSTOM = { Rotate: ['Middle', 'None'], Pan: ['Middle', 'None'], Zoom: ['Scroll', 'None'], Select: ['Left', 'None'], 'Context Menu': ['Right', 'None'] }
const DENSITY_META = { comfy: 'UI scale 112% · larger text and controls · 48px rows', default: 'UI scale 100% · 10 results / page · 40px rows', compact: 'UI scale 88% · denser text and controls · 32px rows' }

export const bindingOf = ([mouse, mod]) => (mod === 'None' ? mouse : `${mod} + ${mouse}`)
export const activeCad = (prefs) => {
  const c = prefs.cad || { preset: 'catia', custom: DEFAULT_CUSTOM }
  return { preset: c.preset, custom: c.custom || DEFAULT_CUSTOM, map: c.preset === 'custom' ? c.custom || DEFAULT_CUSTOM : CAD_PRESETS[c.preset] }
}
export const cadConflicts = (map) => {
  const n = {}
  Object.values(map).forEach((v) => { const b = bindingOf(v); n[b] = (n[b] || 0) + 1 })
  return n
}

export default function Settings() {
  const { state, set, decide } = useStore()
  const saved = activeCad(state.prefs)
  const [preset, setPreset] = useState(saved.preset)
  const [custom, setCustom] = useState(saved.custom)
  const map = preset === 'custom' ? custom : CAD_PRESETS[preset]
  const counts = cadConflicts(map)
  const conflict = Object.values(counts).some((v) => v > 1)
  const dirty = preset !== saved.preset || (preset === 'custom' && JSON.stringify(custom) !== JSON.stringify(saved.custom))
  const edit = (action, i, v) => setCustom({ ...custom, [action]: custom[action].map((x, j) => (j === i ? v : x)) })
  const save = () => decide('prefs', 'cad', { preset, custom }, 'Saved 3D CAD controls', preset === 'custom' ? 'Custom' : preset.toUpperCase())

  return (
    <div className="settings">
      <div className="wrapw">
        <PageHead title="System" sub="Appearance, table defaults, and 3D CAD navigation controls. Changes apply across the whole app." />

        <section className="setcard">
          <div className="t">Color theme</div>
          <div className="d">Minimum contrast ratios are maintained across all modes.</div>
          <div style={{ marginTop: 12 }}><Seg value={state.theme} onChange={(v) => set('theme', v)} options={[['white', 'White'], ['tan', 'Tan'], ['dark', 'Dark']]} /></div>
        </section>

        <div className="grid g2">
          <section className="setcard">
            <div className="t">Default table view</div>
            <div className="d">Layout when a table opens center stage.</div>
            <div style={{ marginTop: 12 }}><Seg value={state.view} onChange={(v) => set('view', v)} options={[['table', 'Table'], ['thumbnail', 'Thumbnail']]} /></div>
            <div className="mono muted" style={{ marginTop: 12 }}>A table’s own Manage → Layout setting overrides this.</div>
          </section>
          <section className="setcard">
            <div className="t">Info density</div>
            <div className="d">Scales text, controls and spacing across the whole app — pick what suits your eyesight and monitor.</div>
            <div style={{ marginTop: 12 }}><Seg value={state.density} onChange={(v) => set('density', v)} options={[['comfy', 'Comfortable'], ['default', 'Default'], ['compact', 'Compact']]} /></div>
            <div className="mono muted" style={{ marginTop: 12 }}>{DENSITY_META[state.density]}</div>
          </section>
        </div>

        <section className="setcard">
          <div className="row wrap" style={{ alignItems: 'flex-start' }}>
            <div className="grow">
              <div className="t">3D CAD controls</div>
              <div className="d">Mouse + modifier bindings for the CAD viewer. Presets load standard schemes; Custom is fully configurable.</div>
            </div>
            <Seg value={preset} onChange={setPreset} options={[['catia', 'CATIA'], ['nx', 'NX'], ['custom', 'Custom']]} />
          </div>
          {conflict && <div className="banner fail" role="alert" style={{ marginTop: 12 }}><b>Conflict detected</b> — two actions share the same binding. Resolve before saving.</div>}
          <div style={{ marginTop: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div className="cadgrid hd"><div>Action</div><div>Mouse</div><div>Modifier</div><div>Binding</div></div>
            {Object.keys(map).map((a) => {
              const [mouse, mod] = map[a]
              const b = bindingOf(map[a])
              const bad = counts[b] > 1
              return (
                <div className="cadgrid" key={a}>
                  <div>{a}</div>
                  {preset === 'custom' ? (
                    <>
                      <div><select aria-label={`${a} mouse`} value={mouse} onChange={(e) => edit(a, 0, e.target.value)}>{['Left', 'Middle', 'Right', 'Scroll'].map((o) => <option key={o}>{o}</option>)}</select></div>
                      <div><select aria-label={`${a} modifier`} value={mod} onChange={(e) => edit(a, 1, e.target.value)}>{['None', 'Shift', 'Ctrl', 'Alt'].map((o) => <option key={o}>{o}</option>)}</select></div>
                    </>
                  ) : (<><div className="mono">{mouse}</div><div className="mono">{mod}</div></>)}
                  <div><Badge tone={bad ? 'fail' : 'neutral'}>{b}{bad ? ' · conflict' : ''}</Badge></div>
                </div>
              )
            })}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <Btn primary disabled={conflict || !dirty} onClick={save}>Save CAD Controls</Btn>
            <Btn disabled={!dirty} onClick={() => { setPreset(saved.preset); setCustom(saved.custom) }}>Discard Changes</Btn>
            {!dirty && <span className="muted">Saved: {saved.preset === 'custom' ? 'Custom' : saved.preset.toUpperCase()}</span>}
          </div>
        </section>
      </div>
    </div>
  )
}
