import { useEffect, type ReactNode } from 'react'
import { ConfigProvider } from '../config/useConfig'
import { ServicesProvider } from '../services/context'
import { useAppStore } from '../stores/appStore'

/** Applies theme, density (global UI scale) and the ?showStubs flag to the document, then provides config and services. */
export function Providers({ children }: { children: ReactNode }) {
  const { theme, density } = useAppStore()
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.dataset.scale = density
    root.dataset.density = density
  }, [theme, density])
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('showStubs') === '1') useAppStore.getState().set({ showStubs: true })
  }, [])
  return <ConfigProvider><ServicesProvider>{children}</ServicesProvider></ConfigProvider>
}
