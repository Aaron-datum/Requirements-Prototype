import { Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TENANTS } from '../config/appConfig'
import { Button, Seg } from '../components/ui'
import { useService } from '../services/context'
import { useAppStore } from '../stores/appStore'
import { toastSuccess } from '../stores/toastStore'
import s from '../components/shell/Shell.module.css'

/** Dev toolbar: theme, density, schema (fixture picker), showStubs, latency, Reset. Always available, collapsed by default. */
export function DevToolbar() {
  const [open, setOpen] = useState(false)
  const a = useAppStore()
  const persistence = useService('persistence')
  return (
    <div className={s.dev} data-testid="dev-toolbar">
      {open && (
        <div className={s.devPanel} role="region" aria-label="Dev toolbar">
          <div className="col" style={{ gap: 4 }}><span className="text-label-caps">Theme</span><Seg value={a.theme} onChange={(theme) => a.set({ theme })} label="Theme" options={[['white', 'White'], ['tan', 'Tan'], ['dark', 'Dark']]} /></div>
          <div className="col" style={{ gap: 4 }}><span className="text-label-caps">Density</span><Seg value={a.density} onChange={(density) => a.set({ density })} label="Density" options={[['compact', 'Compact'], ['default', 'Default'], ['comfy', 'Comfy']]} /></div>
          <div className="col" style={{ gap: 4 }}><span className="text-label-caps">Schema (fixture set)</span>
            <Seg value={a.tenantId} onChange={(tenantId) => a.set({ tenantId })} label="Schema" options={Object.values(TENANTS).map((t): [string, string] => [t.id, t.id === 'company-a' ? 'Company A' : 'Company B'])} /></div>
          <div className="col" style={{ gap: 4 }}><span className="text-label-caps">Stubs</span><Seg value={a.showStubs ? 'on' : 'off'} onChange={(v) => a.set({ showStubs: v === 'on' })} label="Show stubs" options={[['off', 'Hidden'], ['on', 'Outlined']]} /></div>
          <div className="col" style={{ gap: 4 }}><span className="text-label-caps">Latency</span><Seg value={String(a.latency)} onChange={(v) => a.set({ latency: Number(v) })} label="Latency" options={[['0', 'None'], ['600', '600 ms'], ['1500', '1.5 s']]} /></div>
          <div className="row"><Button size="sm" onClick={() => { persistence.reset(); toastSuccess('Prototype state reset') }}>Reset state</Button>
            <Link to="/dev/kitchen-sink">Kitchen sink</Link><Link to="/dev/stubs">Stubs</Link></div>
        </div>
      )}
      <Button size="sm" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Dev toolbar"><Wrench size={14} aria-hidden />Dev</Button>
    </div>
  )
}
