import { useState } from 'react'
import { go, useRoute } from '../router'
import { useStore } from '../store'
import EntryShell, { UnlockModal, WORKFLOWS } from '../components/EntryShell'
import { Badge, Btn, PageHead } from '../components/ui'
import Icon from '../components/Icon'

export default function Workflows() {
  const { query } = useRoute()
  const { state } = useStore()
  const [unlock, setUnlock] = useState(false)
  const stub = WORKFLOWS.find((w) => w.id === query.w && !w.to && !w.locked)
  return (
    <EntryShell active={stub?.name || 'Workflows'}>
      <div className="page" style={{ maxWidth: 1000 }}>
        <PageHead title="Create" sub="Run a workflow to produce an analytic output — BOM, warranty report, or replacement list.">
          <Badge tone="info">Pilot · 3 of 6 workflows active</Badge><Btn onClick={() => setUnlock(true)}>Unlock more workflows</Btn>
        </PageHead>
        {stub && <div className="banner warn" role="status"><b>{stub.name}</b> isn’t part of this prototype. The BOM Creation workflow below is the fully built flow.</div>}
        <div className="grid g3">
          {WORKFLOWS.map((w) => (
            <section key={w.id} className="card col" style={{ opacity: w.locked ? 0.8 : 1 }}>
              <div className="row"><span className="lcard" style={{ all: 'unset' }}><span className="ico" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius)', background: 'var(--accent-tint)', color: 'var(--accent)' }}><Icon n={w.icon} size={18} /></span></span>
                <span className="h3 grow">{w.name}</span>{w.locked && <Badge tone="neutral">Locked</Badge>}</div>
              <span className="sec small grow">{w.blurb}</span>
              {w.locked ? (state.requests[w.id] ? <Badge tone="pass">Access requested</Badge> : <Btn onClick={() => setUnlock(true)}>{w.cta}</Btn>)
                : w.to ? <Btn primary onClick={() => go(w.to)}>Start workflow</Btn> : <Btn disabled title="Not part of this prototype">Not in this prototype</Btn>}
            </section>
          ))}
        </div>
      </div>
      {unlock && <UnlockModal onClose={() => setUnlock(false)} />}
    </EntryShell>
  )
}
