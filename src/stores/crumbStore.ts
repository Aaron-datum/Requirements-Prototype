import { create } from 'zustand'
export interface Crumb { label: string; to?: string }
/** Screens publish their breadcrumb trail with useBreadcrumbs([...]); the strip under the top bar renders it. */
export const useCrumbStore = create<{ crumbs: Crumb[]; set: (c: Crumb[]) => void }>((set) => ({ crumbs: [], set: (crumbs) => set({ crumbs }) }))
