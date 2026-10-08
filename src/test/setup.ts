import '@testing-library/jest-dom/vitest'
// jsdom has no layout; stub what components probe.
if (!window.matchMedia) window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia
