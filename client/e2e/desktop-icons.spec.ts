import { expect, test } from '@playwright/test'
import { DESKTOP_ORDER, desktopIcon, gotoDesktop, openDesktopApp } from './helpers'

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page)
})

test('shows all thirteen desktop items with their names', async ({ page }) => {
  for (const label of DESKTOP_ORDER) {
    await expect(desktopIcon(page, label)).toBeVisible()
  }
  await expect(page.locator('button[aria-label$="double click to open"]')).toHaveCount(13)
})

test('arranges the first nine items in three right-aligned columns', async ({ page }) => {
  const boxes = await Promise.all(
    DESKTOP_ORDER.slice(0, 9).map(async (label) => {
      const box = await desktopIcon(page, label).boundingBox()
      expect(box).not.toBeNull()
      return box!
    })
  )

  const columns = new Set(boxes.map((box) => Math.round(box.x)))
  expect(columns.size).toBe(3)

  const rows = new Set(boxes.map((box) => Math.round(box.y)))
  expect(rows.size).toBe(3)
})

test('places Terminal and Journal together on the final row', async ({ page }) => {
  const terminal = await desktopIcon(page, 'Terminal').boundingBox()
  const journal = await desktopIcon(page, 'Journal').boundingBox()
  const services = await desktopIcon(page, 'Services').boundingBox()

  expect(terminal && journal && services).toBeTruthy()
  expect(Math.round(terminal!.y)).toBe(Math.round(journal!.y))
  expect(terminal!.y).toBeGreaterThan(services!.y)
  expect(journal!.x).toBeGreaterThan(terminal!.x)
})

test('opens a folder window on double click', async ({ page }) => {
  await openDesktopApp(page, 'Projects')
  await expect(page.getByRole('heading', { name: 'Projects' }).first()).toBeVisible()
})

test('keeps the desktop icons above the wallpaper', async ({ page }) => {
  const wallpaper = page.locator('.wp-macos').first()
  await expect(wallpaper).toBeVisible()
  const icon = await desktopIcon(page, 'Music').boundingBox()
  expect(icon!.x).toBeGreaterThan(900)
})
