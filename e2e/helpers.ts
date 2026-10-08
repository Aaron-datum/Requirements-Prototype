import type { Page } from '@playwright/test'
export const THEMES = ['white', 'tan', 'dark'] as const
export const DENSITIES = ['compact', 'default', 'comfy'] as const

/** Set theme / density / schema through the persisted preference store, then reload. */
export async function setPrefs(page: Page, prefs: { theme?: string; density?: string; tenantId?: string }) {
  await page.addInitScript((p) => {
    const cur = JSON.parse(localStorage.getItem('datum-fe-prefs') ?? '{}')
    localStorage.setItem('datum-fe-prefs', JSON.stringify({ ...cur, ...p }))
  }, prefs)
}
/** Collects console + page errors so a flow can assert there were none. */
export function trackErrors(page: Page): string[] {
  const errs: string[] = []
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)) })
  return errs
}
/** True when nothing in the document forces a horizontal page scroll. */
export const noHorizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
