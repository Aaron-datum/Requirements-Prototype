import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { SCOPE } from './data'

// App state: every decision a user makes lives in a named "slice" keyed by id, so one generic
// `decide` action covers accept/reject/confirm/link and can be undone by restoring the previous value.
const KEY = 'datum-prototype-v1'
const initial = {
  theme: 'white',
  planLabel: 'Test plan',
  density: 'default', // System settings: default row density for all tables
  view: 'table', // System settings: default table layout ('table' | 'thumbnail')
  prefs: {}, // confirmed-action settings, e.g. prefs.cad
  surrogate: {}, // bom_line_id -> 'confirmed'
  costModel: {}, // part_id -> 'confirmed' | 'overridden'
  sourced: {}, // part_id -> supplier_id
  mapping: {}, // req_id -> 'accepted' | 'rejected'
  carry: {}, // req_id -> { kind: 'linked'|'gap'|'transfer', test_id?, asserted? }
  changed: {}, // req_id -> 'confirmed'   (driven-by "Confirm Changed")
  owners: {}, // req_id -> reassigned owner
  evidence: {}, // req_id -> [{ name, asserted: true, kind: 'upload'|'record' }]
  approval: {}, // 'plan' -> { by, ts }
  audit: [], // newest first
  views: {}, // tableId -> [{ name, ... }]
}

function load() {
  try {
    return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return initial
  }
}

function reducer(s, a) {
  switch (a.type) {
    case 'set':
      return { ...s, [a.key]: a.value }
    case 'decide': {
      const slice = { ...s[a.slice] }
      if (a.value === undefined) delete slice[a.id]
      else slice[a.id] = a.value
      const audit = a.audit ? [a.audit, ...s.audit].slice(0, 200) : s.audit
      return { ...s, [a.slice]: slice, audit }
    }
    case 'audit':
      return { ...s, audit: [a.entry, ...s.audit].slice(0, 200) }
    case 'saveView':
      return { ...s, views: { ...s.views, [a.table]: [...(s.views[a.table] || []).filter((v) => v.name !== a.view.name), a.view] } }
    case 'reset':
      return { ...initial, theme: s.theme }
    default:
      return s
  }
}

const Ctx = createContext(null)
let n = 0

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [toasts, setToasts] = useState([])
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state])
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // The shared "confirmed action": state change + toast + user/timestamp audit record + Undo.
  const decide = useCallback((slice, id, value, label, target, opts = {}) => {
    const prev = stateRef.current[slice][id]
    const entry = { id: ++n + '-' + Date.now(), ts: new Date().toISOString(), user: SCOPE.user, action: label, target }
    dispatch({ type: 'decide', slice, id, value, audit: opts.silent ? null : entry })
    if (opts.silent) return
    const tid = entry.id
    setToasts((t) => [
      ...t,
      {
        id: tid,
        text: `${label} · ${target}`,
        undo: () => {
          dispatch({
            type: 'decide', slice, id, value: prev,
            audit: { id: tid + 'u', ts: new Date().toISOString(), user: SCOPE.user, action: 'Undid: ' + label, target },
          })
          dismiss(tid)
        },
      },
    ])
    setTimeout(() => dismiss(tid), 6000)
  }, [dismiss])

  // One confirmed action over many ids (e.g. "Accept All ≥ 90%"): one toast, one audit record, one Undo.
  const decideMany = useCallback((slice, ids, value, label, target) => {
    const prevs = ids.map((id) => [id, stateRef.current[slice][id]])
    const tid = ++n + '-' + Date.now()
    ids.forEach((id) => dispatch({ type: 'decide', slice, id, value }))
    dispatch({ type: 'audit', entry: { id: tid, ts: new Date().toISOString(), user: SCOPE.user, action: label, target } })
    setToasts((t) => [...t, { id: tid, text: `${label} · ${target}`, undo: () => {
      prevs.forEach(([id, v]) => dispatch({ type: 'decide', slice, id, value: v }))
      dispatch({ type: 'audit', entry: { id: tid + 'u', ts: new Date().toISOString(), user: SCOPE.user, action: 'Undid: ' + label, target } })
      dismiss(tid)
    } }])
    setTimeout(() => dismiss(tid), 6000)
  }, [dismiss])

  const api = useMemo(
    () => ({ state, toasts, dismiss, decide, decideMany, set: (key, value) => dispatch({ type: 'set', key, value }), dispatch }),
    [state, toasts, dismiss, decide, decideMany],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)
