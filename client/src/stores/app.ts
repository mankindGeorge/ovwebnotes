import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StorageMode, ThemeMode } from '@/types'

const THEME_KEY = 'obsidian-notes-theme'
const SIDEBAR_KEY = 'obsidian-notes-sidebar'
const STORAGE_KEY = 'obsidian-notes-storage'
const EDIT_REPO_KEY = 'obsidian-notes-allow-edit-repo'
const SETTINGS_VERSION_KEY = 'obsidian-notes-settings-version'
const CURRENT_SETTINGS_VERSION = 2

export const useAppStore = defineStore('app', () => {
  // 设置迁移：确保旧设置被正确处理
  const settingsVersion = parseInt(localStorage.getItem(SETTINGS_VERSION_KEY) || '0')
  if (settingsVersion < 2) {
    // 版本 1 -> 2: 修复 allowEditRepositoryNotes 默认值逻辑
    // 强制重置为默认值 false（不允许编辑仓库笔记）
    localStorage.removeItem(EDIT_REPO_KEY)
    localStorage.setItem(SETTINGS_VERSION_KEY, String(CURRENT_SETTINGS_VERSION))
  }
  
  // State
  const themeMode = ref<ThemeMode>(
    (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system'
  )
  const sidebarOpen = ref(
    localStorage.getItem(SIDEBAR_KEY) === null ? true : localStorage.getItem(SIDEBAR_KEY) !== 'false'
  )
  const storageMode = ref<StorageMode>(
    (localStorage.getItem(STORAGE_KEY) as StorageMode) || 'cloud'
  )
  
  // Git仓库编辑限制开关（默认不允许编辑远程仓库笔记）
  const allowEditRepositoryNotes = ref(
    localStorage.getItem(EDIT_REPO_KEY) === 'true'
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

  function checkMobile() {
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window && window.innerWidth < 1024)
    if (isMobile.value) {
      sidebarOpen.value = false
    }
  }

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
    
    window.addEventListener('resize', checkMobile)
    checkMobile()
  }

  return {
    themeMode,
    sidebarOpen,
    storageMode,
    isMobile,
    allowEditRepositoryNotes,
    isDark,
    isCloudMode,
    setThemeMode,
    toggleTheme,
    applyTheme,
    toggleSidebar,
    setSidebarOpen,
    setStorageMode,
    toggleStorageMode,
    setAllowEditRepositoryNotes,
    checkMobile,
  }
})
