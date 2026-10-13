import { expect, test } from '@playwright/test'
import { DENSITIES, noHorizontalOverflow, setPrefs, THEMES, trackErrors } from './helpers'

test.describe('Home and Projects dashboard', () => {
  test('Home: three quick actions, recent strip, hero search submit', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('qa-search')).toContainText('Start a Search')
    await expect(page.getByTestId('qa-workflow')).toContainText('Run a Workflow')
    await expect(page.getByTestId('qa-saved')).toContainText('Saved Searches')
    const recent = page.getByTestId('recent-strip')
    await expect(recent).toContainText('Recent (this session)')
    await expect(recent.getByTestId('recent-item').first()).toContainText(/Pass|Warn|Fail/)
    await expect(page.getByTestId('recent-all')).toHaveAttribute('href', '/projects')
    const input = page.getByPlaceholder('Describe a part, paste a spec, or search saved work...')
    await input.fill('M8 flange')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/search\/files\?q=M8%20flange&modality=part-to-part/)
  })

  test('Cmd/Ctrl+K focuses the hero search, also from another screen', async ({ page }) => {
    await page.goto('/')
    await page.locator('body').click({ position: { x: 700, y: 120 } })
    await page.keyboard.press('Control+k')
    await expect(page.locator('[data-hero-search]')).toBeFocused()
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'My Projects' })).toBeVisible()
    await page.keyboard.press('Control+k')
    await expect(page).toHaveURL(/focus=search/)
    await expect(page.locator('[data-hero-search]')).toBeFocused()
  })

  test('dashboard has five bands and the viz slot switches zoom, metric and form', async ({ page }) => {
    await page.goto('/projects/p-civic-si')
    await expect(page.getByTestId('band-actions')).toBeVisible()
    for (const t of ['box-urgent', 'box-review', 'box-left-off', 'status-bar', 'viz-slot', 'action-table']) await expect(page.getByTestId(t)).toBeVisible()
    await expect(page.getByTestId('breadcrumbs')).toContainText('Civic Si 1.5T')
    const viz = page.getByTestId('viz-slot')
    await expect(viz).toHaveAttribute('data-zoom', 'program')
    await expect(page.getByTestId('viz-title')).toContainText('Certainty by program')
    await viz.getByRole('group', { name: 'Zoom level' }).getByRole('button', { name: 'HW level' }).click()
    await viz.getByRole('group', { name: 'Metric' }).getByRole('button', { name: 'Price' }).click()
    await expect(viz).toHaveAttribute('data-zoom', 'hw')
    await expect(page.getByTestId('viz-title')).toContainText('Price by hw level')
    await viz.getByRole('group', { name: 'Form' }).getByRole('button', { name: 'Table' }).click()
    await expect(page.getByTestId('viz-table')).toBeVisible()
    await viz.getByRole('group', { name: 'Form' }).getByRole('button', { name: 'Action items' }).click()
    await expect(page.getByTestId('viz-actions')).toBeVisible()
    await viz.getByRole('group', { name: 'Zoom level' }).getByRole('button', { name: 'Part' }).click()
    await viz.getByRole('group', { name: 'Metric' }).getByRole('button', { name: 'Timeline' }).click()
    await viz.getByRole('group', { name: 'Form' }).getByRole('button', { name: 'Chart' }).click()
    await expect(page.getByTestId('viz-chart')).toBeVisible()
    await expect(page).toHaveURL(/zoom=part/)
  })

  test('overflow table: every row shows due, impact, severity, owner; filterable', async ({ page }) => {
    await page.goto('/projects/p-civic-si')
    const table = page.getByTestId('action-table')
    const rows = table.locator('tr[data-row-id]')
    const n = await rows.count()
    expect(n).toBeGreaterThan(15)
    const heads = await table.locator('thead th').allTextContents()
    for (const h of ['Severity', 'Owner', 'Due', 'Downstream impact']) expect(heads.join('|').toLowerCase()).toContain(h.toLowerCase())
    for (let i = 0; i < Math.min(n, 12); i++) {
      const cells = await rows.nth(i).locator('td').allTextContents()
      expect(cells.filter((c) => c.trim()).length).toBeGreaterThanOrEqual(5)
      expect(cells.join(' ')).toMatch(/\d{4}-\d{2}-\d{2}/)
    }
    await table.getByPlaceholder(/Search item/).fill('REC-20001')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Dangerous case')
  })

  test('Output overview uses the same shell as Project overview', async ({ page }) => {
    await page.goto('/projects/p-civic-si')
    const bands = ['band-actions', 'status-bar', 'viz-slot', 'action-table']
    const projectCount = await page.getByTestId('action-table').locator('tr[data-row-id]').count()
    await page.getByRole('group', { name: 'Dashboard scope' }).getByRole('button', { name: /BOM/ }).click()
    await expect(page.getByTestId('dashboard')).toHaveAttribute('data-scope', 'output')
    for (const t of bands) await expect(page.getByTestId(t)).toBeVisible()
    expect(await page.getByTestId('action-table').locator('tr[data-row-id]').count()).toBeLessThan(projectCount)
    await page.getByRole('button', { name: 'Show details' }).click()
    await expect(page.getByTestId('inputs-detail')).toContainText('Missing')
  })

  test('project tree pages list outputs and configurations; unknown project is an inline error', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByRole('link', { name: 'Civic Si 1.5T' }).first()).toBeVisible()
    await page.goto('/projects/p-civic-si/outputs')
    await expect(page.getByRole('link', { name: 'Civic Si 1.5T BOM' })).toBeVisible()
    await page.goto('/projects/p-civic-si/configurations')
    await expect(page.getByText('Si twin-scroll configuration')).toBeVisible()
    await page.goto('/projects/nope')
    await expect(page.getByRole('alert')).toContainText('No project')
  })

  for (const theme of THEMES) for (const density of DENSITIES) {
    test(`dashboard renders in ${theme} / ${density}`, async ({ page }) => {
      const errs = trackErrors(page)
      await setPrefs(page, { theme, density })
      await page.goto('/projects/p-civic-si')
      await expect(page.getByTestId('action-table')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      expect(await noHorizontalOverflow(page)).toBe(true)
      expect(errs).toEqual([])
    })
  }
})
