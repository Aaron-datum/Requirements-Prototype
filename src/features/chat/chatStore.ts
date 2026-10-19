import { create } from 'zustand'
import type { NlFlow, NlMemory } from '../../domain/types'

/** One conversation per project, kept locally so it survives a reload. */
export interface ChatMessage {
  id: string; role: 'user' | 'assistant'; text: string; at: string
  attachment?: string
  /** Chips for what the assistant did: "Opened BOM review". */
  did?: string[]
  quick?: string[]
}
export interface Thread { messages: ChatMessage[]; flow: NlFlow | null; memory?: NlMemory | null }

const KEY = 'datum-fe-chat'
const load = (): Record<string, Thread> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Thread> } catch { return {} } }
const save = (t: Record<string, Thread>) => { try { localStorage.setItem(KEY, JSON.stringify(t)) } catch { /* storage unavailable */ } }

interface ChatState {
  projectId: string
  open: boolean
  threads: Record<string, Thread>
  setProject: (id: string) => void
  setOpen: (o: boolean) => void
  push: (m: Omit<ChatMessage, 'id' | 'at'> & { at: string }) => void
  setFlow: (f: NlFlow | null) => void
  setMemory: (m: NlMemory | null) => void
  clear: () => void
}
const EMPTY: Thread = { messages: [], flow: null }
export const threadOf = (s: ChatState): Thread => s.threads[s.projectId] ?? EMPTY

let n = 0
export const useChat = create<ChatState>((set, get) => ({
  projectId: 'p-civic-si',
  open: true,
  threads: load(),
  setProject: (projectId) => set({ projectId }),
  setOpen: (open) => set({ open }),
  push: (m) => {
    const cur = threadOf(get())
    const threads = { ...get().threads, [get().projectId]: { ...cur, messages: [...cur.messages, { ...m, id: `m${Date.now()}-${n++}` }].slice(-80) } }
    save(threads); set({ threads })
  },
  setFlow: (flow) => {
    const threads = { ...get().threads, [get().projectId]: { ...threadOf(get()), flow } }
    save(threads); set({ threads })
  },
  setMemory: (memory) => {
    const threads = { ...get().threads, [get().projectId]: { ...threadOf(get()), memory } }
    save(threads); set({ threads })
  },
  clear: () => {
    const threads = { ...get().threads, [get().projectId]: { messages: [], flow: null, memory: null } }
    save(threads); set({ threads })
  },
}))
