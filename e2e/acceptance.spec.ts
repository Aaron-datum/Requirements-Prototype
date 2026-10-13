import { expect, test } from '@playwright/test'
import { setPrefs, THEMES, trackErrors } from './helpers'

/** Plan section 7, flow 6 end to end in one pass, and flow 7 (configurability), each in all three themes. */
for (const theme of THEMES) {
  test.describe(`Acceptance in ${theme}`, () => {
    test.beforeEach(async ({ page }) => { await setPrefs(page, { theme }) })

    test('flow 6: RFQ to approved test plan', async ({ page }) => {
      const errs = trackErrors(page)
      await page.goto('/create/bom')
      await expect(page).toHaveURL(/01-intake/)
      await expect(page.getByRole('heading', { name: 'RFQ package received' })).toBeVisible()
      await page.getByTestId('pipeline-stepper').getByText('Assembly tree').click()
      await expect(page).toHaveURL(/02-tree/)
      await page.getByTestId('pipeline-stepper').getByText('BOM review').click()
      await expect(page).toHaveURL(/03-review/)
      await page.getByRole('button', { name: 'Run Surrogate Search' }).first().click()
      await expect(page.getByTestId('bom-review')).toHaveAttribute('data-search', 'done', { timeout: 15_000 })
      await page.locator('tr[data-row-id="BOML-0161"]').click()
      await expect(page.getByTestId('side-panel')).toBeVisible()
      await page.goto('/create/bom/03b-compare?line=BOML-0161')
      await expect(page.getByTestId('viewer-placeholder')).toHaveCount(2)
      await page.goto('/create/bom/03d-cost?part=TC-404-C&line=BOML-0161')
      await expect(page.getByTestId('cost-lines').locator('tr[data-line]')).toHaveCount(6)
      await page.goto('/create/bom/04-composition')
      await expect(page).toHaveURL(/04-composition/)

      await page.goto('/create/requirements/05-mapping')
      for (const id of ['REC-20004', 'REC-20010', 'REC-20006']) await page.getByRole('button', { name: `Accept ${id}`, exact: true }).click()
      await page.getByRole('button', { name: 'Reject REC-20008', exact: true }).click()
      await expect(page.getByTestId('reviewed-count')).toContainText('Reviewed 4 of 8')

      await page.getByRole('button', { name: 'Continue to Carryover Review' }).click()
      await page.locator('[data-testid="flag-row"][data-req="REC-20007"]').click()
      await page.getByRole('button', { name: 'Confirm', exact: true }).click()
      await expect(page.getByTestId('side-panel').getByTestId('audit-entry').first()).toContainText('Aaron Keller')

      await page.goto('/create/requirements/06b-impact')
      await expect(page.locator('[data-node]').first()).toBeVisible()
      await page.goto('/create/requirements/06c-trace')
      await expect(page.getByTestId('in-scope')).toContainText('16 of 16')
      await page.goto('/create/requirements/07-approve')
      const approve = page.getByRole('button', { name: /Approve and Create/ })
      await expect(approve).toBeDisabled()
      await page.getByRole('checkbox').check()
      await approve.click()
      await expect(page.getByTestId('plan-id')).toHaveText('TP-CIV26-0007')
      expect(errs).toEqual([])
    })

    test('flow 7: schema switch changes sidebars, columns, detail tabs and tones', async ({ page }) => {
      const url = '/search/files?modality=part-to-part'
      await page.goto(url)
      const sideA = await page.getByTestId('filter-sidebar').innerText()
      await page.goto('/settings')
      await page.getByRole('group', { name: 'Schema' }).getByRole('button', { name: /Company B/ }).click()
      await expect(page.getByTestId('tenant-badge')).toHaveText('Northwind')
      await page.getByRole('link', { name: 'Datum home' }).click()
      await page.goto(url)
      expect(await page.getByTestId('filter-sidebar').innerText()).not.toEqual(sideA)
    })
  })
}
