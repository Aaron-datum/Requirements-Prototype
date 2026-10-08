import { useEffect, useState } from 'react'

// Minimal hash router: "#/path/with/:params?query=1".
const parse = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/dashboard'
  const [path, q] = raw.split('?')
  return { path, query: Object.fromEntries(new URLSearchParams(q || '')) }
}
export function useRoute() {
  const [r, setR] = useState(parse)
  useEffect(() => {
    const h = () => setR(parse())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return r
}
export const go = (to) => {
  window.location.hash = to
}
export const back = () => window.history.back()
