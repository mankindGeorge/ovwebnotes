import { useAppStore } from '@/stores/app'

export function useTheme() {
  const appStore = useAppStore()

  function initTheme() {
    appStore.applyTheme()
  }

  function toggleTheme() {
    appStore.toggleTheme()
  }

  function setThemeMode(mode: 'light' | 'dark' | 'system') {
    appStore.setThemeMode(mode)
  }

  const isDark = appStore.isDark
  const themeMode = appStore.themeMode

  return {
    isDark,
    themeMode,
    initTheme,
    toggleTheme,
    setThemeMode,
  }
}
