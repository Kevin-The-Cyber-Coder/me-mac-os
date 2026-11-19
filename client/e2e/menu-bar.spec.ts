import { expect, test } from '@playwright/test'
import { gotoDesktop } from './helpers'

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('shows the active app name next to the Apple menu', async ({ page }) => {
  const bar = page.getByRole('banner')
  await expect(bar).toBeVisible()
  await expect(bar.getByText('Finder', { exact: true })).toBeVisible()
})

test('shows the native clock format', async ({ page }) => {
  const bar = page.getByRole('banner')
  await expect(bar.getByRole('button', { name: 'Date and time' })).toContainText(/\d{1,2}:\d{2}\s?(AM|PM)/)
})

test('opens the system menu from the Apple logo', async ({ page }) => {
  await page.getByRole('button', { name: 'Apple menu' }).click()
  await expect(page.getByText('About This Mac')).toBeVisible()
  await expect(page.getByText('System Settings…')).toBeVisible()
})

test('opens Spotlight from the status bar', async ({ page }) => {
  await page.getByRole('button', { name: 'Spotlight search' }).click()
  await expect(page.getByPlaceholder(/search/i)).toBeVisible()
})

test('opens Control Center from the status bar', async ({ page }) => {
  await page.getByRole('button', { name: 'Control Center' }).click()
  await expect(page.getByText('Control Center').first()).toBeVisible()
})
