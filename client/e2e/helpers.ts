import { expect, type Page } from '@playwright/test'

export const DESKTOP_ORDER = [
  'Music',
  'Gallery',
  'About Me',
  'System Settings',
  'ARENA AI',
  'Projects',
  'Trash',
  'Contact',
  'Skills',
  'GitHub',
  'Services',
  'Terminal',
  'Journal',
]

export async function gotoDesktop(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })
  await page.goto('/')
  await expect(page.getByRole('banner')).toBeVisible()
  await page.waitForLoadState('networkidle').catch(() => undefined)
}

export function desktopIcon(page: Page, label: string) {
  return page.locator(`button[aria-label^="${label} —"]`)
}

export async function openDesktopApp(page: Page, label: string) {
  await desktopIcon(page, label).dblclick()
  await expect(page.getByRole('heading', { name: new RegExp(label, 'i') }).first()).toBeVisible()
}

export async function openSpotlight(page: Page) {
  await page.keyboard.press('Control+k')
  await expect(page.getByPlaceholder(/search/i)).toBeVisible()
}
