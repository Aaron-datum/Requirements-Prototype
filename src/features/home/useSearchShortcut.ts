import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Marks the hero search input so the shortcut can find it. */
export const HERO_SEARCH_ATTR = 'data-hero-search'

/**
 * Global Cmd/Ctrl+K: focus the Home hero search. On other screens it opens Home with `?focus=search`, which focuses the input.
 * Mounted once, in the app shell.
 */
export function useSearchShortcut(): void {
  const nav = useNavigate()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      const el = document.querySelector<HTMLInputElement>(`[${HERO_SEARCH_ATTR}]`)
      if (el) { el.focus(); el.select() } else nav('/?focus=search')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nav])
}
