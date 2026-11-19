import { expect, test } from '@playwright/test'
import { desktopIcon, gotoDesktop } from './helpers'

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('opens and focuses a window', async ({ page }) => {
  await desktopIcon(page, 'Gallery').dblclick()
  const window = page.getByRole('dialog')
  await expect(window).toBeVisible()
  await expect(window.getByRole('heading', { name: /gallery/i }).first()).toBeVisible()
})

test('minimizes a window from its traffic light', async ({ page }) => {
  await desktopIcon(page, 'Contact').dblclick()
  const window = page.getByRole('dialog')
  await window.getByRole('button', { name: /minimize/i }).click()
  await expect(window).toBeHidden()
})

test('closes a window from its traffic light', async ({ page }) => {
  await desktopIcon(page, 'Skills').dblclick()
  const window = page.getByRole('dialog')
  await expect(window).toBeVisible()
  await window.getByRole('button', { name: /close/i }).click()
  await expect(window).toBeHidden()
})

test('keeps the desktop usable after closing every window', async ({ page }) => {
  await desktopIcon(page, 'Services').dblclick()
  await page.getByRole('dialog').getByRole('button', { name: /close/i }).click()
  await expect(desktopIcon(page, 'Services')).toBeVisible()
})
