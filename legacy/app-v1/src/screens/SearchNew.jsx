import { go } from '../router'
import EntryShell from '../components/EntryShell'
import { Btn, PageHead } from '../components/ui'
import Icon from '../components/Icon'
import { MODES } from '../data/search'

export default function SearchNew() {
  return (
    <EntryShell active="Assembly Search" recent>
      <div className="page" style={{ maxWidth: 1000 }}>
        <PageHead title="What are you searching for?" sub="Pick the modality that matches your input file and the kind of result you want. You can refine the view — collapse duplicates, latest-revision only — any time from the Columns tab." />
        <div className="modes">
          {['pp', 'pa', 'aa', 'ps'].map((k) => {
            const m = MODES[k]
            return (
              <button key={k} className="modecard" onClick={() => go('/search/source/' + k)}>
                <span className="caps">{m.label}</span>
                <span className="h3">{m.title}</span>
                <span className="sec small">{m.desc}</span>
                <span className="row" style={{ marginTop: 8 }}><span className="btn primary"><Icon n="upload" />{m.cta}</span><span className="muted small">→ {m.result}</span></span>
              </button>
            )
          })}
        </div>
        <span className="muted small">Prototype: searches run against the Civic 1.5T example dataset (56 Si lines, plus LX and Sport) rather than uploaded CAD geometry.</span>
      </div>
    </EntryShell>
  )
}
