import { expect, test } from '@playwright/test'
import { gotoDesktop } from './helpers'

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('opens System Settings from a deep link', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('heading', { name: /system settings/i }).first()).toBeVisible()
})

test('keeps the window title in sync with the route', async ({ page }) => {
  await page.goto('/settings')
  const window = page.getByRole('dialog')
  await expect(window).toBeVisible()
  await expect(window).toContainText('System Settings')
})

test('returns to the desktop when the settings window closes', async ({ page }) => {
  await page.goto('/settings')
  const window = page.getByRole('dialog')
  await window.getByRole('button', { name: /close/i }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('honours the desktop preference migration', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kcp-desktop',
      JSON.stringify({
        state: { iconSize: 'medium', showWidgets: true, dockSize: 52, iconPositions: { music: { x: 10, y: 10 } } },
        version: 1,
      })
    )
  })
  await page.goto('/')
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('kcp-desktop') || '{}'))
  expect(stored.version).toBe(2)
  expect(stored.state.iconSize).toBe('large')
  expect(stored.state.iconPositions).toEqual({})
})
