import { expect, test, type Page } from '@playwright/test'
import { setPrefs, trackErrors } from './helpers'

const say = async (page: Page, text: string) => {
  await page.getByRole('textbox', { name: 'Message' }).fill(text)
  await page.getByRole('button', { name: 'Send' }).click()
}
const lastBot = (page: Page) => page.locator('[data-role="assistant"]').last()

test.describe('Chat navigation', () => {
  test.beforeEach(async ({ page }) => { await setPrefs(page, { navMode: 'chat' }) })

  test('replaces the sidebar with a rail and a chat panel', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('left-nav')).toHaveCount(0)
    await expect(page.getByTestId('chat-rail')).toBeVisible()
    await expect(page.getByTestId('chat-panel')).toBeVisible()
    await page.getByRole('button', { name: 'Collapse chat' }).click()
    await expect(page.getByTestId('chat-panel')).toHaveCount(0)
  })

  test('create a BOM from an attached assembly, walking the workflow', async ({ page }) => {
    const errs = trackErrors(page)
    await page.goto('/')
    await page.getByLabel('Attach CAD').setInputFiles({ name: 'Civic_Si_1.5T_Engine_MY2026.CATProduct', mimeType: 'application/octet-stream', buffer: Buffer.from('x') })
    await say(page, 'make me a bom out of this')
    await expect(page).toHaveURL(/01-intake/)
    await expect(page.getByTestId('chat-log')).toContainText('Which program is this for?')
    await page.getByTestId('chat-quick').getByRole('button', { name: 'Civic Si 1.5T' }).click()
    await expect(page).toHaveURL(/02-tree/)
    await expect(page.getByTestId('chat-log')).toContainText('Include them?')
    await say(page, 'nah leave them out')
    await expect(page.getByTestId('chat-log')).toContainText('match every line')
    await page.getByTestId('chat-quick').getByRole('button', { name: 'Yes, run it' }).click()
    await expect(page).toHaveURL(/03-review/)
    await expect(page.getByTestId('bom-review')).toHaveAttribute('data-search', 'done', { timeout: 20_000 })
    await expect(page.getByTestId('chat-log')).toContainText('Surrogate search finished')
    expect(errs).toEqual([])
  })

  test('without an attachment it asks for one', async ({ page }) => {
    await page.goto('/')
    await say(page, 'create a bill of materials')
    await expect(lastBot(page)).toContainText(/Attach|attach/)
  })

  test('catalogue lookup filters the real table, then compares the first two', async ({ page }) => {
    await page.goto('/')
    await say(page, 'show me M16 hex stainless bolts')
    await expect(page).toHaveURL(/catalogue\/bolts/)
    await expect(page.getByTestId('filter-sidebar')).toContainText('1')
    await page.getByTestId('chat-quick').getByRole('button', { name: 'Compare the first two' }).click()
    await expect(page.getByTestId('compare-view')).toBeVisible()
  })

  test('plain-English filters apply to the table on screen and show in the sidebar', async ({ page }) => {
    await page.goto('/search/results?file=f10&modality=part-to-part')
    const count = page.getByTestId('result-count')
    const before = await count.innerText()
    await say(page, 'only the ones over 90% similarity')
    await expect(page.getByTestId('chat-log')).toContainText(/rows/)
    expect(await count.innerText()).not.toBe(before)
    await say(page, 'clear the filters')
    await expect(count).toHaveText(before)
  })

  test('opens screens by name; threads are per project and survive a reload', async ({ page }) => {
    await page.goto('/')
    await say(page, 'take me to test mapping')
    await expect(page).toHaveURL(/05-mapping/)
    await page.reload()
    await expect(page.getByTestId('chat-log')).toContainText('take me to test mapping')
    await page.getByRole('combobox', { name: 'Project' }).selectOption({ label: 'Seat Track Bracket' })
    await expect(page.getByTestId('chat-log')).not.toContainText('take me to test mapping')
  })

  test('an unrecognised request gets suggestions', async ({ page }) => {
    await page.goto('/')
    await say(page, 'what is the weather')
    await expect(page.getByTestId('chat-quick')).toBeVisible()
  })
})
