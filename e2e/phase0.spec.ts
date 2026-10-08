import { expect, test } from '@playwright/test'
import { DENSITIES, noHorizontalOverflow, setPrefs, THEMES, trackErrors } from './helpers'

test.describe('Phase 0: foundations and kitchen sink', () => {
  for (const theme of THEMES) for (const density of DENSITIES) {
    test(`kitchen sink renders in ${theme} / ${density}`, async ({ page }) => {
      const errs = trackErrors(page)
      await setPrefs(page, { theme, density })
      await page.goto('/dev/kitchen-sink')
      await expect(page.getByTestId('kitchen-sink')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('html')).toHaveAttribute('data-scale', density)
      await expect(page.getByTestId('ks-match-quality').locator('span', { hasText: /^Geometric duplicate$/ }).last()).toBeVisible()
      await expect(page.getByTestId('ks-table')).toBeVisible()
      expect(await noHorizontalOverflow(page)).toBe(true)
      expect(errs).toEqual([])
    })
  }

  test('shell: top bar, breadcrumb strip, left nav, tenant badge, feedback modal', async ({ page }) => {
    await page.goto('/dev/kitchen-sink')
    await expect(page.getByTestId('tenant-badge')).toHaveText('Adient')
    await expect(page.getByTestId('breadcrumbs')).toContainText('Kitchen sink')
    for (const t of ['Assembly Search', 'Part Search', 'Find Duplicates', 'Find Revisions', 'Parts Catalogue', 'BOM Creation', 'Warranty Analysis', 'Part Replacement', 'Settings']) await expect(page.getByTestId('left-nav').getByText(t, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Feedback' }).click()
    await expect(page.getByRole('dialog', { name: 'Send feedback' })).toBeVisible()
    await expect(page.getByText('Auto-attached context')).toBeVisible()
    await page.getByRole('dialog').getByRole('textbox', { name: 'What happened?' }).fill('Filters feel slow')
    await page.getByRole('button', { name: 'Submit ticket' }).click()
    await expect(page.getByText(/Ticket DATUM-\d+ created/)).toBeVisible()
  })

  test('schema switch changes labels, groups and tones with no reload', async ({ page }) => {
    await page.goto('/dev/kitchen-sink')
    await expect(page.getByTestId('schema-company-a').getByText('Customer Group')).toBeVisible()
    await expect(page.getByTestId('schema-company-b').getByText('Customer Group')).toHaveCount(0)
    await page.goto('/settings')
    await page.getByRole('group', { name: 'Schema' }).getByRole('button', { name: /Company B/ }).click()
    await expect(page.getByTestId('tenant-badge')).toHaveText('Northwind')
  })

  test('confirming "Review required" writes an audit entry and gives a success toast', async ({ page }) => {
    await page.goto('/dev/kitchen-sink')
    const audit = page.getByTestId('ks-audit')
    await expect(audit.getByText('Review required')).toBeVisible()
    await audit.getByRole('button', { name: 'Confirm' }).click()
    await expect(audit.getByText('Confirmed', { exact: true })).toBeVisible()
    await expect(audit.getByTestId('audit-entry')).toContainText('Aaron Keller')
    await expect(page.getByRole('status').getByText(/Confirmed:/)).toBeVisible()
  })

  test('/dev/stubs lists every stub and ?showStubs=1 outlines simulated output', async ({ page }) => {
    await page.goto('/dev/stubs')
    await expect(page.getByTestId('stub-table').locator('tr[data-stub-row]')).toHaveCount(19)
    await page.goto('/dev/kitchen-sink?showStubs=1')
    await expect(page.locator('[data-stub="matching-engine"]').first()).toBeVisible()
  })

  test('density scales the whole UI and tables obey it', async ({ page }) => {
    await page.goto('/dev/kitchen-sink')
    const h = async () => page.getByTestId('ks-table').locator('tbody tr').nth(1).evaluate((e) => e.getBoundingClientRect().height)
    await page.getByRole('button', { name: 'Dev toolbar' }).click()
    await page.getByRole('group', { name: 'Density' }).getByRole('button', { name: 'Comfy' }).click()
    const comfy = await h()
    await page.getByRole('group', { name: 'Density' }).getByRole('button', { name: 'Compact' }).click()
    expect(await h()).toBeLessThan(comfy)
  })
})
