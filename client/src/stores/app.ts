import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StorageMode, ThemeMode } from '@/types'

const THEME_KEY = 'obsidian-notes-theme'
const SIDEBAR_KEY = 'obsidian-notes-sidebar'
const STORAGE_KEY = 'obsidian-notes-storage'

export const useAppStore = defineStore('app', () => {
  // State
  const themeMode = ref<ThemeMode>(
    (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system'
  )
  const sidebarOpen = ref(
    localStorage.getItem(SIDEBAR_KEY) === null ? true : localStorage.getItem(SIDEBAR_KEY) !== 'false'
  )
  const storageMode = ref<StorageMode>(
    (localStorage.getItem(STORAGE_KEY) as StorageMode) || 'vault'
  )
  
  // Git仓库编辑限制开关
  const allowEditRepositoryNotes = ref(
    localStorage.getItem('obsidian-notes-allow-edit-repo') !== 'false'
  )
  
  const systemDark = ref(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )

  const isMobile = ref(
    typeof window !== 'undefined'
      ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window && window.innerWidth < 1024)
      : false
  )

  // Getters
  const isDark = computed(() => {
    if (themeMode.value === 'dark') return true
    if (themeMode.value === 'light') return false
    return systemDark.value
  })

  const isCloudMode = computed(() => storageMode.value === 'cloud')

  // Actions
  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    localStorage.setItem(THEME_KEY, mode)
    applyTheme()
  }

  function toggleTheme() {
    if (themeMode.value === 'light') {
      setThemeMode('dark')
    } else if (themeMode.value === 'dark') {
      setThemeMode('system')
    } else {
      setThemeMode('light')
    }
  }

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
    localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen.value))
  }

  function setSidebarOpen(open: boolean) {
    sidebarOpen.value = open
    localStorage.setItem(SIDEBAR_KEY, String(open))
  }

  function setStorageMode(mode: StorageMode) {
    storageMode.value = mode
    localStorage.setItem(STORAGE_KEY, mode)
  }

  function toggleStorageMode() {
    setStorageMode(storageMode.value === 'vault' ? 'cloud' : 'vault')
  }

  function setAllowEditRepositoryNotes(allow: boolean) {
    allowEditRepositoryNotes.value = allow
    localStorage.setItem('obsidian-notes-allow-edit-repo', String(allow))
  }

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        systemDark.value = e.matches
        if (themeMode.value === 'system') {
          applyTheme()
        }
      })
  }

  return {
    // State
    themeMode,
    sidebarOpen,
    storageMode,
    isMobile,
    allowEditRepositoryNotes,
    // Getters
    isDark,
    isCloudMode,
    // Actions
    setThemeMode,
    toggleTheme,
    applyTheme,
    toggleSidebar,
    setSidebarOpen,
    setStorageMode,
    toggleStorageMode,
    setAllowEditRepositoryNotes,
  }
})
