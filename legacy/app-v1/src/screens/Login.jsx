import { useState } from 'react'
import { go } from '../router'
import { useStore } from '../store'
import { Btn } from '../components/ui'
import Icon from '../components/Icon'

export default function Login() {
  const { dispatch } = useStore()
  const [email, setEmail] = useState('')
  const valid = /^\S+@\S+\.\S+$/.test(email)
  const enter = (e) => {
    const addr = valid ? email : 'aaron@datum.co'
    dispatch({ type: 'set', key: 'signedIn', value: true })
    dispatch({ type: 'set', key: 'user', value: { email: addr, name: addr === 'aaron@datum.co' ? 'Aaron Keller' : addr.split('@')[0].split(/[._-]/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ') } })
    go('/home')
  }
  return (
    <div className="loginsplit">
      <section className="loginbrand">
        <img src="./datum-logo-full-transparent.png" alt="Datum" style={{ height: 32, alignSelf: 'flex-start' }} />
        <div style={{ marginTop: 64 }}>
          <h1 style={{ margin: 0, font: '500 34px/42px var(--font-ui)', maxWidth: 440 }}>Search 3D parts against real requirements.</h1>
          <p className="sec" style={{ maxWidth: 440 }}>Datum reads your CAD assemblies, builds reference datums on the geometry, and ranks parts by how well every dimension matches your spec.</p>
        </div>
        <div className="col" style={{ gap: 12, maxWidth: 480 }}>
          {[['Upload assemblies', 'STEP, SolidWorks, IGES, Parasolid. We index every face, edge and feature.'], ['Define datums & tolerances', 'name reference dimensions and set ±% windows on each.'], ['Rank, compare, export', 'pass/warn/fail per cell, BOM-ready output.']].map(([t, d], i) => (
            <div className="step" key={t}><i>{i + 1}</i><span><b>{t}</b> <span className="sec">— {d}</span></span></div>))}
        </div>
        <div className="row card tight" style={{ maxWidth: 480, background: 'var(--bg-card)' }}>
          {['cad-preview-1.png', 'cad-preview-3.png'].map((f) => <img key={f} src={'./' + f} alt="" style={{ width: '50%', height: 120, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border-default)' }} />)}
        </div>
        <div className="mono muted" style={{ marginTop: 'auto', letterSpacing: '.4px' }}>V 1.0 · BUILD 248 · SOC 2 TYPE II</div>
      </section>
      <form className="loginform" onSubmit={(e) => { e.preventDefault(); enter() }}>
        <div style={{ maxWidth: 448 }} className="col">
          <h2 className="h1">Sign in to Datum</h2>
          <p className="sec" style={{ margin: 0 }}>Use your work email. We'll send a one-time link if SSO isn't configured for your domain.</p>
          <label className="col" style={{ gap: 4, marginTop: 16 }}><span className="caps">Work email</span>
            <input type="text" inputMode="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <Btn primary className="lg" type="submit" disabled={email.length > 0 && !valid} style={{ width: '100%' }}><Icon n="next" />Continue</Btn>
          {email.length > 0 && !valid && <span className="small" style={{ color: 'var(--danger)' }}>Enter a valid work email, or leave blank to continue as the demo user.</span>}
          <div className="row muted"><hr className="hr grow" />OR<hr className="hr grow" /></div>
          <div className="row">
            <Btn className="grow lg" type="button" onClick={enter}><Icon n="table" />SSO · SAML</Btn>
            <Btn className="grow lg" type="button" onClick={enter}><Icon n="globe" />Google Workspace</Btn>
          </div>
          <span className="sec small">By signing in, you agree to our <a>Terms of Service</a> and <a>Privacy Policy</a>.</span>
        </div>
        <div className="row small muted" style={{ marginTop: 'auto' }}>© 2026 Datum, Inc.<a className="right">Contact Support</a></div>
      </form>
    </div>
  )
}
