import { create } from 'zustand'

/** 3D CAD control bindings (Settings → System). Saved explicitly; conflicts block saving. */
export type Binding = [mouse: string, modifier: string]
export type CadMapping = Record<string, Binding>
export const CAD_PRESETS: Record<'catia' | 'nx', CadMapping> = {
  catia: { Rotate: ['Middle', 'None'], Pan: ['Middle', 'Ctrl'], Zoom: ['Scroll', 'None'], Select: ['Left', 'None'], 'Context Menu': ['Right', 'None'] },
  nx: { Rotate: ['Middle', 'None'], Pan: ['Middle', 'Shift'], Zoom: ['Scroll', 'None'], Select: ['Left', 'None'], 'Context Menu': ['Right', 'None'] },
}
export const DEFAULT_CUSTOM: CadMapping = { Rotate: ['Middle', 'None'], Pan: ['Middle', 'None'], Zoom: ['Scroll', 'None'], Select: ['Left', 'None'], 'Context Menu': ['Right', 'None'] }
export const bindingOf = ([mouse, mod]: Binding): string => (mod === 'None' ? mouse : `${mod} + ${mouse}`)
export const bindingCounts = (m: CadMapping): Record<string, number> => { const n: Record<string, number> = {}; Object.values(m).forEach((b) => { const k = bindingOf(b); n[k] = (n[k] ?? 0) + 1 }); return n }
export const hasConflict = (m: CadMapping): boolean => Object.values(bindingCounts(m)).some((v) => v > 1)

interface CadState { preset: 'catia' | 'nx' | 'custom'; custom: CadMapping; save: (preset: CadState['preset'], custom: CadMapping) => void }
const KEY = 'datum-fe-cad'
const saved = ((): Partial<CadState> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<CadState> } catch { return {} } })()
export const useCadStore = create<CadState>((set) => ({
  preset: saved.preset ?? 'catia', custom: saved.custom ?? DEFAULT_CUSTOM,
  save: (preset, custom) => { set({ preset, custom }); try { localStorage.setItem(KEY, JSON.stringify({ preset, custom })) } catch { /* ignore */ } },
}))
export const activeMapping = (s: Pick<CadState, 'preset' | 'custom'>): CadMapping => (s.preset === 'custom' ? s.custom : CAD_PRESETS[s.preset])
