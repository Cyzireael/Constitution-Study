import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, persistTheme, readSavedTheme } from './theme'
import { resolveTheme, THEME_STORAGE_KEY, type ThemeDefinition } from '../themes/config'

interface ThemeContextValue {
  theme: ThemeDefinition
  setTheme: (id: string) => void
  storageError: string
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(readSavedTheme)
  const [storageError, setStorageError] = useState('')

  useLayoutEffect(() => applyTheme(theme), [theme])

  const setTheme = useCallback((id: string) => {
    const next = resolveTheme(id)
    setThemeState(next)
    setStorageError(persistTheme(next) ? '' : '主题已切换，但浏览器无法保存设置；下次打开可能恢复默认。')
  }, [])

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        setThemeState(readSavedTheme())
        setStorageError('')
      }
    }
    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])

  const value = useMemo(() => ({ theme, setTheme, storageError }), [theme, setTheme, storageError])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
