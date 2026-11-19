import { expect, test } from '@playwright/test'
import { gotoDesktop } from './helpers'

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('renders the curated dock without duplicate system apps', async ({ page }) => {
  const dock = page.getByRole('navigation', { name: 'Dock' })
  await expect(dock).toBeVisible()
  await expect(dock.getByRole('button', { name: 'System Settings' })).toHaveCount(1)
  await expect(dock.getByRole('button', { name: 'Trash' })).toHaveCount(1)
})

test('shows familiar app destinations', async ({ page }) => {
  const dock = page.getByRole('navigation', { name: 'Dock' })
  for (const label of ['Finder', 'Gallery', 'Projects', 'Journal', 'Contact', 'Music', 'ARENA AI', 'Terminal', 'GitHub']) {
    await expect(dock.getByRole('button', { name: label })).toBeVisible()
  }
})

test('launches an app from the dock', async ({ page }) => {
  await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: 'Terminal' }).click()
  await expect(page.getByRole('heading', { name: /terminal/i }).first()).toBeVisible()
})

test('keeps system settings at the end of the app row and trash after the divider', async ({ page }) => {
  const dock = page.getByRole('navigation', { name: 'Dock' })
  const settings = await dock.getByRole('button', { name: 'System Settings' }).boundingBox()
  const trash = await dock.getByRole('button', { name: 'Trash' }).boundingBox()
  expect(settings && trash).toBeTruthy()
  expect(trash!.x).toBeGreaterThan(settings!.x)
  expect(Math.abs(trash!.y - settings!.y)).toBeLessThan(12)
})
