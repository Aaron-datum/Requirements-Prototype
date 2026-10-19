import { Boxes, Check, ChevronsLeft, ChevronsRight, Copy, FolderOpen, GitBranch, House, LayoutGrid, Layers, MessageSquare, Paperclip, Search, Send, Settings, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Stub } from '../../components/stub/Stub'
import { Button, IconButton } from '../../components/ui'
import { CATALOGUE_SETTINGS } from '../../config/catalogueConfig'
import { useConfig } from '../../config/useConfig'
import type { NlEffect } from '../../domain/types'
import { INTAKE } from '../../fixtures/derive-bom'
import { now } from '../../lib/clock'
import { useService } from '../../services/context'
import { catalogueStub } from '../../services/stubs/catalogue'
import { useProjectStore } from '../../stores/projectStore'
import { compareUrl, filtersFromFacets, mergeFilters, writeTable } from '../catalogue/urlState'
import { useBomStore } from '../create/bom/bomStore'
import { threadOf, useChat, type ChatMessage } from './chatStore'
import { activeTable } from './tableRegistry'
import { snapshotOf } from './snapshot'
import { applyTextFilter, filterHints } from './tableFilter'
import type { FilterState } from '../../components/table/types'
import type { SortState } from '../../components/table/useTableModel'
import s from './Chat.module.css'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const ACCEPT = '.sldasm,.sldprt,.step,.stp,.catpart,.catproduct'
const SUGGESTIONS = ['Create a BOM from an attached assembly', 'Find parts similar to FrameBack_Outer_v8', 'Show M16 hex stainless bolts']

/** Slim icon rail: the click fallback for everything the chat can do. */
export function ChatRail({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const items: Array<[string, string, typeof Search]> = [
    ['/', 'Home', House], ['/search/files?modality=part-to-part', 'Part Search', Search], ['/search/files?modality=assembly-to-assembly', 'Assembly Search', Boxes],
    ['/search/files?modality=part-to-part&mode=duplicates', 'Find Duplicates', Copy], ['/search/files?modality=part-to-part&mode=revisions', 'Find Revisions', GitBranch],
    ['/catalogue', 'Parts Catalogue', LayoutGrid], ['/create/bom', 'BOM Creation', Layers], ['/projects', 'My Projects', FolderOpen],
  ]
  return (
    <nav className={s.rail} aria-label="Navigate" data-testid="chat-rail">
      <IconButton label={open ? 'Hide chat' : 'Show chat'} onClick={onToggle} ghost={false}><MessageSquare size={16} /></IconButton>
      <div className={s.railBody}>
        {items.map(([to, label, Icon]) => <NavLink key={label} to={to} title={label} aria-label={label} className={({ isActive }) => `${s.railItem} ${isActive && to !== '/' ? s.railOn : ''}`}><Icon size={16} /></NavLink>)}
      </div>
      <NavLink to="/settings" title="Settings" aria-label="Settings" className={({ isActive }) => `${s.railItem} ${isActive ? s.railOn : ''}`}><Settings size={16} /></NavLink>
      <IconButton label={open ? 'Collapse chat' : 'Expand chat'} onClick={onToggle} ghost>{open ? <ChevronsLeft size={14} /> : <ChevronsRight size={14} />}</IconButton>
    </nav>
  )
}

export function ChatPanel() {
  const agent = useService('nlAgent')
  const audit = useService('audit')
  const config = useConfig()
  const nav = useNavigate()
  const loc = useLocation()
  const projects = useProjectStore((p) => p.projects)
  const chat = useChat()
  const thread = threadOf(chat)
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  /** What the table looked like before the chat changed it, so "undo" can put it back. */
  const history = useRef<Array<{ id: string; filters: FilterState; sort: SortState | null; group: string; visible: string[] }>>([])
  const remember = () => {
    const t = activeTable(); if (!t) return
    const m = t.model
    history.current.push({ id: t.id, filters: m.filters, sort: m.sort, group: m.group, visible: m.visible })
    history.current.splice(0, Math.max(0, history.current.length - 10))
  }

  // On a project page, the chat follows the project.
  useEffect(() => { const m = /^\/projects\/([^/]+)/.exec(loc.pathname); if (m && projects.some((p) => p.id === m[1])) chat.setProject(m[1]!) }, [loc.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }) }, [thread.messages.length, busy])

  const say = (m: Omit<ChatMessage, 'id' | 'at'>) => chat.push({ ...m, at: now() })

  const lookUp = (q: string): string[] => {
    const parsed = catalogueStub.parse(q)
    // Leftover words ("show me bolts") are chatter; only something shaped like a part number is a search term.
    const text = /[a-z]{1,4}-\d/i.test(parsed.text) ? parsed.text : ''
    const filters = filtersFromFacets(parsed.facets, text)
    const root = CATALOGUE_SETTINGS.dataRootId
    const found = catalogueStub.query(root, parsed.facets, text).rows.length
    const t = activeTable()
    if (t?.id === 'catalogue') t.model.setFilters(mergeFilters({}, filters))
    else nav(`/catalogue/${root}?t_catalogue=${encodeURIComponent(writeTable({ filters }))}`)
    say({ role: 'assistant', text: `${found} part${found === 1 ? '' : 's'} match.`, quick: found > 1 ? ['Compare the first two'] : undefined })
    return ['Searched the Catalogue']
  }

  const run = async (effects: NlEffect[]): Promise<string[]> => {
    const did: string[] = []
    for (const e of effects) {
      if (e.type === 'navigate') { nav(e.to); did.push(e.label) }
      else if (e.type === 'audit') audit.record({ by: config.currentUser.name, action: e.action, subject: e.subject, note: e.note })
      else if (e.type === 'include-reference') useBomStore.getState().setIncluded(INTAKE.referenceBodies.map((b) => b.id), e.on)
      else if (e.type === 'await-bom-search') {
        void (async () => {
          for (let i = 0; i < 400 && useBomStore.getState().search !== 'done'; i++) await sleep(50)
          if (useBomStore.getState().search === 'done') say({ role: 'assistant', text: 'Surrogate search finished. Review the lines in the table, or open composition.', quick: ['Open composition', 'Go to test mapping'] })
        })()
      } else if (e.type === 'clear-filters') { remember(); activeTable()?.model.clearAll(); did.push('Cleared filters') }
      else if (e.type === 'filter') {
        const t = activeTable()
        if (!t) say({ role: 'assistant', text: 'There is no table here to filter.' })
        else if (t.id === 'catalogue') { remember(); did.push(...lookUp(e.text)) }
        else {
          remember()
          const r = applyTextFilter(t, e.text)
          say({ role: 'assistant', text: r.applied.length ? `${r.applied.join('; ')}. ${r.count} of ${r.total} rows.` : `I could not match that to a filter here. Try: ${filterHints(t).join(', ')}.` })
        }
      } else if (e.type === 'catalogue') { remember(); did.push(...lookUp(e.text)) }
      else if (e.type === 'select') {
        const t = activeTable()
        if (!t) continue
        if (e.ids.length === 1 && t.select) t.select(e.ids[0]!)
        else t.onCheck?.(e.ids)
      } else if (e.type === 'sort') { remember(); activeTable()?.model.setSort({ key: e.key, dir: e.dir }) }
      else if (e.type === 'group') { remember(); activeTable()?.model.setGroup(e.key) }
      else if (e.type === 'layout') activeTable()?.model.setLayout(e.value)
      else if (e.type === 'columns') {
        const t = activeTable()
        if (!t) continue
        remember()
        const m = t.model
        if (e.show) { if (!m.fields.includes(e.key)) m.applyFields([...m.fields, e.key]); else if (!m.visible.includes(e.key)) m.setVisible([...m.visible, e.key]) }
        else m.setVisible(m.visible.filter((k: string) => k !== e.key))
      } else if (e.type === 'undo') {
        const t = activeTable(); const h = history.current.pop()
        if (!t || !h || h.id !== t.id) { say({ role: 'assistant', text: 'Nothing to undo here.' }); continue }
        t.model.setFilters(h.filters); t.model.setSort(h.sort); t.model.setGroup(h.group); t.model.setVisible(h.visible)
        did.push('Undid the last change')
      }
      else if (e.type === 'compare') {
        const t = activeTable()
        if (t?.id !== 'catalogue') { say({ role: 'assistant', text: 'Open the Catalogue and filter to the parts first, then ask me to compare.' }); continue }
        const ids = e.ids?.length ? e.ids.slice(0, 6) : (t.model.sorted as unknown[]).slice(0, Math.min(e.count, 6)).map(t.rowId)
        if (ids.length < 2) { say({ role: 'assistant', text: 'There are fewer than two parts to compare. Widen the filters.' }); continue }
        nav(compareUrl({ a: ids[0]!, b: ids[1]!, more: ids.slice(2), form: ids.length > 2 ? 'table' : 'dual', from: loc.pathname + loc.search }, new URLSearchParams()))
        did.push(`Comparing ${ids.length} parts`)
      }
    }
    return did
  }

  const send = async (raw: string) => {
    const t = raw.trim()
    if (!t && !attachment) return
    const att = attachment ?? undefined
    setText(''); setAttachment(null)
    say({ role: 'user', text: t || `Attached ${att}`, attachment: att })
    setBusy(true)
    await sleep(350)
    const table = activeTable()
    const turn = await agent.interpret({ text: t, attachment: att, flow: thread.flow, memory: thread.memory ?? undefined, screen: table ? snapshotOf(table) : undefined, here: { pathname: loc.pathname, search: loc.search, table: table?.id }, projects: projects.map((p) => ({ id: p.id, name: p.name })) })
    say({ role: 'assistant', text: turn.reply, quick: turn.quick })
    const did = await run(turn.effects)
    if (did.length) say({ role: 'assistant', text: did.join(' · '), did })
    chat.setFlow(turn.flow)
    if (turn.memory !== undefined) chat.setMemory(turn.memory)
    setBusy(false)
    input.current?.focus()
  }

  // Quick replies belong to the newest assistant message that has them, as long as the user has not spoken since.
  const quick = useMemo(() => {
    for (let i = thread.messages.length - 1; i >= 0; i--) { const m = thread.messages[i]!; if (m.role === 'user') return undefined; if (m.quick) return m.quick }
    return undefined
  }, [thread.messages])
  const suggestions = useMemo(() => (thread.messages.length ? [] : SUGGESTIONS), [thread.messages.length])

  return (
    <aside className={s.panel} aria-label="Assistant" data-testid="chat-panel">
      <header className={s.head}>
        <select className={s.proj} value={chat.projectId} onChange={(e) => chat.setProject(e.target.value)} aria-label="Project">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Button size="sm" ghost onClick={chat.clear} disabled={!thread.messages.length}>Clear</Button>
      </header>
      <Stub id="nl-agent" note="Phrase matching, not a model">
        <div className={s.log} ref={log} role="log" aria-live="polite" data-testid="chat-log">
          {!thread.messages.length && (
            <div className={s.welcome}>
              <b>What would you like to do?</b>
              <span className="muted">Ask in your own words.</span>
              <div className={s.sugg}>{suggestions.map((q) => <button key={q} type="button" className={s.chipBtn} onClick={() => void send(q)}>{q}</button>)}</div>
            </div>
          )}
          {thread.messages.map((m) => (
            <div key={m.id} className={`${s.msg} ${m.role === 'user' ? s.user : s.bot}`} data-role={m.role}>
              {m.attachment && <span className={s.attach}><Paperclip size={12} aria-hidden />{m.attachment}</span>}
              {m.did ? m.did.map((d) => <span key={d} className={s.did}><Check size={12} aria-hidden />{d}</span>) : <span>{m.text}</span>}
            </div>
          ))}
          {busy && <div className={`${s.msg} ${s.bot} muted`}>Working…</div>}
          {quick && !busy && <div className={s.quick} data-testid="chat-quick">{quick.map((q) => <button key={q} type="button" className={s.chipBtn} onClick={() => void send(q)}>{q}</button>)}</div>}
        </div>
      </Stub>
      <form className={s.composer} onSubmit={(e) => { e.preventDefault(); void send(text) }}>
        {attachment && <span className={s.attach}><Paperclip size={12} aria-hidden />{attachment}<IconButton label="Remove attachment" onClick={() => setAttachment(null)}><X size={12} /></IconButton></span>}
        <textarea ref={input} className={s.input} rows={2} value={text} placeholder="Ask or tell me what to do" aria-label="Message"
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(text) } }} />
        <div className={s.actions}>
          <label className={s.clip} title="Attach CAD"><Paperclip size={16} aria-hidden />
            <input type="file" hidden aria-label="Attach CAD" accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachment(f.name); e.target.value = '' }} /></label>
          <Stub id="audit-trail" inline note="Workflow starts are written to the audit trail"><Button primary size="sm" type="submit" disabled={busy || (!text.trim() && !attachment)}><Send size={14} aria-hidden />Send</Button></Stub>
        </div>
      </form>
    </aside>
  )
}

export function ChatDock() {
  const open = useChat((c) => c.open)
  const setOpen = useChat((c) => c.setOpen)
  return <><ChatRail open={open} onToggle={() => setOpen(!open)} />{open && <ChatPanel />}</>
}
