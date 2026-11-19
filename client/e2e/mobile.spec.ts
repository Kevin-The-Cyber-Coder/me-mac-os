import { expect, test } from '@playwright/test'
import { gotoDesktop } from './helpers'

test.use({ viewport: { width: 390, height: 844 } })

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('replaces the desktop grid with the mobile home', async ({ page }) => {
  await expect(page.locator('button[aria-label$="double click to open"]')).toHaveCount(0)
})

test('keeps the portfolio reachable on a phone', async ({ page }) => {
  await expect(page.getByText('Music', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible()
})

test('opens a full-screen app from the mobile home', async ({ page }) => {
  await page.getByText('Projects', { exact: true }).first().click()
  await expect(page.getByRole('heading', { name: /projects/i }).first()).toBeVisible()
})
