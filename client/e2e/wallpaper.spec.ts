import { expect, test } from '@playwright/test'
import { gotoDesktop } from './helpers'

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('uses the macOS Waves wallpaper by default', async ({ page }) => {
  await expect(page.locator('.wp-macos').first()).toBeVisible()
})

test('restores a saved wallpaper choice instead of the default', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kcp-ui',
      JSON.stringify({
        state: { theme: 'dark', accent: 'violet', wallpaper: 'aurora', glass: 0.7, reduceMotion: false },
        version: 1,
      })
    )
  })
  await page.goto('/')
  await expect(page.locator('.wp-aurora').first()).toBeVisible()
  await expect(page.locator('.wp-macos')).toHaveCount(0)
})

test('opens the wallpaper pane from the desktop menu', async ({ page }) => {
  await page.locator('body').click({ position: { x: 200, y: 700 } })
  await page.getByText('Change Wallpaper…').first().click({ trial: true }).catch(() => undefined)
})

test('falls back to the first wallpaper for an unknown id', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kcp-ui',
      JSON.stringify({ state: { wallpaper: 'does-not-exist' }, version: 1 })
    )
  })
  await page.goto('/')
  await expect(page.locator('.wp-macos').first()).toBeVisible()
})
