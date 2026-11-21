import { resolveTheme, THEME_STORAGE_KEY, type ThemeDefinition } from '../themes/config.ts'

export function readSavedTheme(): ThemeDefinition {
  try {
    return resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return resolveTheme(null)
  }
}

export function applyTheme(theme: ThemeDefinition) {
  document.documentElement.dataset.theme = theme.id
  const browserColor = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-background').trim()
  if (browserColor) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', browserColor)
}

export function persistTheme(theme: ThemeDefinition): boolean {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme.id)
    return true
  } catch {
    return false
  }
}
