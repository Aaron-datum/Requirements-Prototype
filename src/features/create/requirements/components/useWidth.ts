import { useEffect, useRef, useState } from 'react'

/** Width of an element in px, kept live. Used by the hand-built SVG screens so text stays at its real size and the page scrolls instead of clipping. */
export function useWidth(initial = 760) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth || initial)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || initial))
    ro.observe(el)
    return () => ro.disconnect()
  }, [initial])
  return { ref, width }
}
