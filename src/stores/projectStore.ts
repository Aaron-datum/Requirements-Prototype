import { create } from 'zustand'

/** In-memory projects tree, recents, saved searches and saved views (service: persistence). Save adds here. */
export interface SavedItem { id: string; kind: 'search' | 'view' | 'project-item'; title: string; href?: string; projectId?: string; meta?: Record<string, string | number>; at: string }
export interface Project { id: string; name: string; savedSearches: number; outputs: number; configurations: number }

export interface ProjectState {
  recents: SavedItem[]
  saved: SavedItem[]
  views: SavedItem[]
  projects: Project[]
  addRecent: (i: SavedItem) => void
  add: (kind: 'search' | 'view' | 'project-item', i: SavedItem) => void
  addProject: (name: string) => void
  reset: () => void
}

export const SEED_PROJECTS: Project[] = [
  { id: 'p-civic-si', name: 'Civic Si 1.5T', savedSearches: 4, outputs: 7, configurations: 1 },
  { id: 'p-seat-track', name: 'Seat Track Bracket', savedSearches: 3, outputs: 2, configurations: 0 },
  { id: 'p-bolt-std', name: 'Fastener standardisation', savedSearches: 1, outputs: 0, configurations: 1 },
]
const seed = (): Pick<ProjectState, 'recents' | 'saved' | 'views' | 'projects'> => ({
  recents: [], saved: [], views: [], projects: SEED_PROJECTS.map((p) => ({ ...p })),
})

export const useProjectStore = create<ProjectState>((set) => ({
  ...seed(),
  addRecent: (i) => set((s) => ({ recents: [i, ...s.recents.filter((r) => r.id !== i.id)].slice(0, 12) })),
  add: (kind, i) => set((s) => {
    const projects = s.projects.map((p) => (p.id === i.projectId ? { ...p, savedSearches: p.savedSearches + (kind === 'search' ? 1 : 0), outputs: p.outputs + (kind === 'project-item' ? 1 : 0) } : p))
    return kind === 'view' ? { views: [i, ...s.views], projects } : { saved: [i, ...s.saved], projects }
  }),
  addProject: (name) => set((s) => ({ projects: [...s.projects, { id: `p-${s.projects.length + 1}-${name.toLowerCase().replace(/\W+/g, '-')}`, name, savedSearches: 0, outputs: 0, configurations: 0 }] })),
  reset: () => set(seed()),
}))
