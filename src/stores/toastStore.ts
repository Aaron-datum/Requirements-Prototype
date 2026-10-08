import { create } from 'zustand'

/** Toasts are success-only feedback. The audit entry is the record. Errors are rendered inline by the screen. */
export interface Toast { id: number; message: string }
interface ToastState { toasts: Toast[]; success: (message: string) => void; dismiss: (id: number) => void }
let n = 0
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  success: (message) => {
    const id = ++n
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
export const toastSuccess = (message: string): void => useToastStore.getState().success(message)
