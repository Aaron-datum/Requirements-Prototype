import { expect, test, type Page } from '@playwright/test'
import { DENSITIES, noHorizontalOverflow, setPrefs, THEMES, trackErrors } from './helpers'

/** Tick a row by part number, paging forward until it is visible. */
async function tick(page: Page, pn: string) {
  for (let i = 0; i < 8; i++) {
    const row = page.locator(`tr[data-row-id="${pn}"]`)
    if (await row.count()) { await row.getByRole('checkbox').check(); return }
    await page.getByRole('button', { name: 'Next' }).click()
  }
  throw new Error(`row ${pn} not found`)
}

test.describe('Phase 4: Parts Catalogue', () => {
  test('flow 5: Fasteners, Bolts, filter M16, select two, compare in both forms', async ({ page }) => {
    const errs = trackErrors(page)
    await page.goto('/catalogue')
    await expect(page.getByRole('heading', { name: 'Parts Catalogue' })).toBeVisible()
    await expect(page.getByTestId('drawer-empty')).toBeVisible()
    await expect(page.getByTestId('tile-bearings')).toContainText(/opens the same browse flow/i)
    await page.getByTestId('tile-fasteners').click()
    await expect(page.getByTestId('breadcrumbs')).toContainText('Fasteners')
    await page.getByTestId('tile-bolts').click()
    await expect(page.getByTestId('bolts-tiles')).toBeVisible()
    await expect(page.locator('table')).toHaveCount(0)
    await page.getByTestId('filter-sidebar').getByRole('button', { name: /^M16/ }).click()
    await expect(page.getByTestId('results-header')).toContainText('M16 Bolts · 36 results · sorted by length')
    await expect(page.getByTestId('breadcrumbs')).toContainText('M16')
    await tick(page, 'SH-M16-110-88')
    await tick(page, 'HX-M16-120-A2')
    await expect(page.getByTestId('compare-btn')).toBeEnabled()
    await page.getByTestId('compare-btn').click()
    await expect(page.getByTestId('compare-dual')).toBeVisible()
    await expect(page.getByTestId('diff-summary')).toHaveText(/9 of 15 fields differ/)
    await expect(page.getByTestId('breadcrumbs')).toContainText('Compare')
    await page.getByRole('group', { name: 'Compare form' }).getByRole('button', { name: 'Attribute table' }).click()
    const table = page.getByTestId('compare-table')
    await expect(table.locator('tr[data-field="length"]')).toHaveAttribute('data-state', 'differs')
    await expect(table.locator('tr[data-field="shank"]')).toHaveAttribute('data-state', 'match')
    await page.getByRole('button', { name: 'Differences Only' }).click()
    await expect(table.locator('tr[data-state="match"]')).toHaveCount(0)
    await expect(table.locator('tr[data-admin]')).toHaveCount(0)
    await expect(page.getByTestId('diff-summary')).toHaveText(/9 of 15/)
    await page.getByRole('button', { name: '+ Add part' }).click()
    await page.getByRole('dialog').getByRole('button').nth(2).click()
    await expect(page.getByRole('heading', { name: 'Compare 3 Parts' })).toBeVisible()
    await page.goBack()
    expect(errs).toEqual([])
  })

  test('decision action only inside a workflow context; no decision action when browsing', async ({ page }) => {
    const f = encodeURIComponent(JSON.stringify({ f: { pn: { query: 'HX-M16-120-A2' } } }))
    await page.goto('/catalogue/bolts?t_catalogue=' + f)
    await page.locator('tr[data-row-id="HX-M16-120-A2"]').click()
    await expect(page.getByTestId('part-drawer')).toHaveAttribute('data-part', 'HX-M16-120-A2')
    await expect(page.getByTestId('decision-action')).toHaveCount(0)
    await expect(page.getByTestId('part-drawer').locator('..')).toBeVisible()
    await expect(page.getByRole('button', { name: /Open .* in PLM/ })).toBeDisabled()
    await expect(page.getByTestId('search-on').first()).toHaveAttribute('target', '_blank')

    await page.goto('/catalogue/bolts?ctx=' + encodeURIComponent('catalogue-use:p-civic-si') + '&ret=' + encodeURIComponent('/projects') + '&t_catalogue=' + f)
    await page.locator('tr[data-row-id="HX-M16-120-A2"]').click()
    const btn = page.getByTestId('side-panel').getByRole('button', { name: /^Use This Part/ })
    await expect(btn).toBeVisible()
    await expect(page.getByTestId('search-on').first()).toHaveAttribute('href', /ctx=catalogue-use/)
    await btn.click()
    await expect(page).toHaveURL(/\/projects/)
    await expect(page.getByRole('status').getByText(/Use This Part: HX-M16-120-A2/)).toBeVisible()
  })

  test('filters make the tree respond, Back restores state, hidden selection does not arm Compare', async ({ page }) => {
    await page.goto('/catalogue/bolts-m16')
    const side = page.getByTestId('filter-sidebar')
    await expect(page.getByTestId('tree-node-bolts-m16')).toHaveAttribute('data-count', '36')
    await expect(page.getByTestId('tree-node-bolts-m6')).toHaveAttribute('data-count', '10')
    await side.getByRole('checkbox', { name: /^Hex/ }).check({ force: true })
    await expect(page.getByTestId('tree-node-bearings')).toHaveAttribute('data-dimmed', 'true')
    await expect(page.getByTestId('tree-node-screws')).toHaveAttribute('data-dimmed', 'true')
    await expect(page.getByTestId('tree-node-bolts-m16')).toHaveAttribute('data-count', '13')
    await tick(page, 'HX-M16-120-A2')
    await tick(page, 'HX-M16-130-A2')
    await expect(page.getByTestId('compare-btn')).toBeEnabled()
    await page.locator('th', { hasText: 'Length' }).click()
    await page.getByTestId('compare-btn').click()
    await expect(page.getByTestId('compare-view')).toBeVisible()
    await page.goBack()
    await expect(page.getByTestId('results-header')).toContainText('sorted by length')
    await expect(page.locator('th', { hasText: 'Length' })).toHaveAttribute('aria-sort', 'ascending')
    await expect(page.getByTestId('compare-btn')).toBeEnabled()
    // Filter the selected rows away: Compare disarms and says why.
    await side.getByRole('checkbox', { name: /^Hex/ }).uncheck({ force: true })
    await side.getByRole('checkbox', { name: /^Socket head/ }).check({ force: true })
    await expect(page.getByTestId('compare-btn')).toBeDisabled()
    await expect(page.getByTestId('compare-hint')).toContainText('hidden by filters')
  })

  test('free text parses a spec query; clearing all returns to tiles; empty state clears', async ({ page }) => {
    await page.goto('/catalogue')
    await page.getByRole('textbox', { name: 'Search Catalogue' }).fill('M16 hex stainless')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    const pills = page.getByRole('toolbar', { name: 'Applied filters' })
    await expect(pills).toContainText('Thread Size: M16')
    await expect(pills).toContainText('Head Type: Hex')
    await expect(pills).toContainText('Grade: A2-70')
    await expect(pills).toContainText('Grade: A4-80')
    await page.getByRole('button', { name: 'Clear all', exact: true }).first().click()
    await expect(page.getByTestId('bolts-tiles')).toBeVisible()
    await page.goto('/catalogue/bolts')
    await page.getByRole('textbox', { name: 'Search Bolts' }).fill('zzz-none')
    await page.keyboard.press('Enter')
    await expect(page.getByText('No bolts match these filters')).toBeVisible()
    await page.getByRole('button', { name: /Clear all filters/i }).click()
    await expect(page.getByTestId('bolts-tiles')).toBeVisible()
  })

  test('export CSV downloads the filtered rows and Save View toasts', async ({ page }) => {
    await page.goto('/catalogue/bolts-m16')
    await expect(page.getByTestId('results-header')).toContainText('36 results')
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()])
    expect(dl.suggestedFilename()).toBe('bolts.csv')
    await page.getByRole('button', { name: 'Save View' }).click()
    await expect(page.getByRole('status').getByText(/View saved/)).toBeVisible()
  })

  for (const [density, n] of [['compact', 15], ['default', 10], ['comfy', 8]] as const) {
    test(`rows per page follow density: ${density} shows ${n}`, async ({ page }) => {
      await setPrefs(page, { density })
      await page.goto('/catalogue/bolts-m16')
      await expect(page.locator('tbody tr[data-row-id]')).toHaveCount(n)
    })
  }

  for (const theme of THEMES) for (const density of DENSITIES) {
    test(`renders in ${theme} / ${density}`, async ({ page }) => {
      const errs = trackErrors(page)
      await setPrefs(page, { theme, density })
      for (const url of ['/catalogue', '/catalogue/bolts-m16', '/catalogue/compare?a=HX-M16-120-A2&b=SH-M16-110-88&form=table']) {
        await page.goto(url)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.locator('main h1').first()).toBeVisible()
        expect(await noHorizontalOverflow(page)).toBe(true)
      }
      expect(errs).toEqual([])
    })
  }

  test('compare with fewer than two parts is guarded', async ({ page }) => {
    await page.goto('/catalogue/compare?a=HX-M16-120-A2')
    await expect(page.getByText('Select at least two parts to compare')).toBeVisible()
  })
})
