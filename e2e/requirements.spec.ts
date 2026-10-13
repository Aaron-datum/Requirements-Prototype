import { expect, test } from '@playwright/test'
import { DENSITIES, noHorizontalOverflow, setPrefs, THEMES, trackErrors } from './helpers'

const base = '/create/requirements'

test.describe('Requirements and traceability (flow 6, second half)', () => {
  test('mapping accept 3 reject 1, carryover confirm with audit, impact map controls, trace highlights, approve gate', async ({ page }) => {
    const errs = trackErrors(page)

    // 05: accept 3, reject 1
    await page.goto(`${base}/05-mapping`)
    await expect(page.getByTestId('auto-accepted')).toContainText('8 mapped at ≥ 90% and accepted automatically')
    for (const id of ['REC-20004', 'REC-20010', 'REC-20006']) await page.getByRole('button', { name: `Accept ${id}`, exact: true }).click()
    await page.getByRole('button', { name: 'Reject REC-20008', exact: true }).click()
    await expect(page.getByTestId('reviewed-count')).toContainText('Reviewed 4 of 8')
    await expect(page.locator('tr[data-row-id="REC-20008"]').getByText('Test plan needed')).toBeVisible()
    await expect(page.locator('tr[data-row-id="REC-20004"]').getByText('Accepted', { exact: true })).toBeVisible()
    await expect(page.getByRole('status').getByText(/Rejected: REC-20008/)).toBeVisible()

    // 06: confirm one flagged item and see the audit entry with time and actor
    await page.getByRole('button', { name: 'Continue to Carryover Review' }).click()
    await expect(page).toHaveURL(/06-carryover/)
    await expect(page.getByTestId('need-decision')).toHaveText('6')
    await page.locator('[data-testid="flag-row"][data-req="REC-20007"]').click()
    await expect(page).toHaveURL(/req=REC-20007/)
    await expect(page.getByTestId('interface-warning')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    const panel = page.getByTestId('side-panel')
    await expect(panel.getByText('Confirmed', { exact: true })).toBeVisible()
    const entry = panel.getByTestId('audit-entry').first()
    await expect(entry).toContainText('Aaron Keller')
    await expect(entry).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
    await page.getByRole('button', { name: 'Link Evidence to This Requirement' }).click()
    await expect(page.getByTestId('need-decision')).toHaveText('5')

    // 06b: hop depth and direction
    await page.getByRole('link', { name: /Impact Map/ }).click()
    await expect(page).toHaveURL(/06b-impact/)
    const nodes = page.locator('[data-node]')
    const two = await nodes.count()
    await page.getByRole('group', { name: 'Hop depth' }).getByRole('button', { name: '1', exact: true }).click()
    expect(await nodes.count()).toBeLessThan(two)
    await page.getByRole('group', { name: 'Hop depth' }).getByRole('button', { name: '2', exact: true }).click()
    await page.getByRole('group', { name: 'Direction' }).getByRole('button', { name: 'Trace Back' }).click()
    const back = await nodes.count()
    await page.getByRole('group', { name: 'Direction' }).getByRole('button', { name: 'Trace Forward' }).click()
    const fwd = await nodes.count()
    expect(back).toBeLessThan(two)
    expect(fwd).toBeLessThan(two)
    await expect(page.getByTestId('impact-legend')).toContainText('Donates evidence')
    await page.getByRole('group', { name: 'Direction' }).getByRole('button', { name: 'Both' }).click()
    await page.getByRole('button', { name: /Flag \d+ for Re-review/ }).click()
    await expect(page.getByRole('status').getByText(/flagged for re-review/)).toBeVisible()

    // 06c: three dangerous rows highlighted with nothing selected
    await page.goto(`${base}/06c-trace`)
    await expect(page.getByTestId('in-scope')).toContainText('16 of 16 in scope')
    await expect(page.locator('tr[data-tone="danger"]')).toHaveCount(3)
    await expect(page.locator('tr[aria-selected="true"]')).toHaveCount(0)
    for (const id of ['REC-20001', 'REC-20007', 'REC-20016']) await expect(page.locator(`tr[data-row-id="${id}"]`).getByText('Driver changed')).toBeVisible()
    await expect(page.getByTestId('bottom-drawer')).toBeVisible()

    // 07: gate, plan ID, audit, inert actions
    await page.goto(`${base}/07-approve`)
    const approve = page.getByRole('button', { name: /Approve and Create/ })
    await expect(approve).toBeDisabled()
    // counts came from the decisions: 8 auto + 1 linked carried, 3 accepted routed, the rest open
    await expect(page.getByTestId('tile-carried')).toContainText('9')
    await expect(page.getByTestId('tile-routed')).toContainText('3')
    await expect(page.getByTestId('tile-open')).toContainText('4')
    await expect(page.getByTestId('open-row')).toHaveCount(4)
    await page.getByRole('checkbox').check()
    await expect(approve).toBeEnabled()
    await approve.click()
    await expect(page.getByRole('heading', { name: 'Test plan created' })).toBeVisible()
    await expect(page.getByTestId('plan-id')).toHaveText('TP-CIV26-0007')
    await expect(page.getByTestId('created').getByTestId('audit-entry').first()).toContainText('Aaron Keller')
    await expect(page.getByRole('button', { name: 'Export TDM' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Open in PLM' })).toBeDisabled()
    await expect(page.getByText(/inert in the prototype/)).toBeVisible()
    expect(errs).toEqual([])
  })

  test('Confirm Changed propagates to the requirements that share the interface', async ({ page }) => {
    await page.goto(`${base}/06c-trace?req=REC-20001`)
    await page.getByRole('button', { name: /Confirm Changed · applies to 2/ }).click()
    await expect(page.locator('tr[data-tone="danger"]')).toHaveCount(2)
    await expect(page.getByText(/Confirmed Changed/).first()).toBeVisible()
    await expect(page.locator('tr[data-row-id="REC-20008"]').getByLabel('Confirmed')).toBeVisible()
  })

  test('a candidate test opens Test detail, Use for swaps the proposed test, and the empty evidence state reads as specified', async ({ page }) => {
    await page.goto(`${base}/05-mapping?req=REC-20007`)
    await expect(page.getByText(/AI-inferred/)).toContainText('82%')
    await page.getByTestId('candidate').nth(1).getByRole('link', { name: 'View Test' }).click()
    await expect(page).toHaveURL(/test\?test=DV-TC-210/)
    await expect(page.getByRole('button', { name: 'Use for REC-20007' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Run history' })).toBeVisible()
    await page.getByRole('button', { name: 'Use for REC-20007' }).click()
    await page.getByRole('link', { name: 'Back to Test Mapping' }).click()
    await expect(page.getByText(/AI-inferred/)).toContainText('57%')
    await page.goto(`${base}/06-carryover?req=REC-20013`)
    await expect(page.getByTestId('no-candidates')).toHaveText('Datum found no evidence record above 50%. Search for one you know about, or upload the report.')
  })

  test('event lanes: three lanes from the carryover events, changes only, stepping, no page overflow', async ({ page }) => {
    await page.goto(`${base}/03c-trace?req=REC-20016`)
    await expect(page.getByTestId('lanes')).toBeVisible()
    await expect(page.locator('[data-event]')).toHaveCount(5)
    await expect(page.getByTestId('stat-events')).toHaveText('5')
    await expect(page.getByTestId('stat-programs')).toHaveText('3')
    await expect(page.getByTestId('stat-changes')).toHaveText('2')
    await page.getByRole('button', { name: 'Changes only' }).click()
    await expect(page.locator('[data-event]')).toHaveCount(2)
    await page.getByRole('button', { name: 'All events' }).click()
    await page.getByRole('button', { name: 'Previous event' }).click()
    await expect(page.getByTestId('selected-event')).toContainText('Event 4 of 5')
    expect(await noHorizontalOverflow(page)).toBe(true)
    await page.getByRole('button', { name: /Impact Map/ }).click()
    await expect(page).toHaveURL(/06b-impact\?req=REC-20016/)
  })

  for (const theme of THEMES) for (const density of DENSITIES) {
    test(`trace renders in ${theme} / ${density}`, async ({ page }) => {
      const errs = trackErrors(page)
      await setPrefs(page, { theme, density })
      await page.goto(`${base}/06c-trace?req=REC-20007`)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('tr[data-tone="danger"]')).toHaveCount(3)
      await expect(page.getByTestId('side-panel')).toContainText('REC-20007')
      expect(await noHorizontalOverflow(page)).toBe(true)
      expect(errs).toEqual([])
    })
  }
})
