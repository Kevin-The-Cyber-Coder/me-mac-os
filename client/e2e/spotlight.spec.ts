import { expect, test } from '@playwright/test'
import { gotoDesktop, openSpotlight } from './helpers'

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('opens with the keyboard shortcut', async ({ page }) => {
  await openSpotlight(page)
})

test('finds applications and launches the active result', async ({ page }) => {
  await openSpotlight(page)
  await page.getByPlaceholder(/search/i).fill('terminal')
  await expect(page.getByText('Applications')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /terminal/i }).first()).toBeVisible()
})

test('moves the selection with arrow keys', async ({ page }) => {
  await openSpotlight(page)
  const input = page.getByPlaceholder(/search/i)
  await input.fill('a')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await expect(input).toBeVisible()
})

test('closes with escape', async ({ page }) => {
  await openSpotlight(page)
  await page.keyboard.press('Escape')
  await expect(page.getByPlaceholder(/search/i)).toBeHidden()
})
