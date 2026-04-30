<template>
  <button
    class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-vault-highlight transition-colors"
    :title="themeLabel"
    @click="toggleTheme"
  >
    <!-- 太阳 (light) -->
    <svg
      v-if="appStore.themeMode === 'light'"
      class="w-5 h-5 text-amber-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clip-rule="evenodd"
      />
    </svg>
    <!-- 月亮 (dark) -->
    <svg
      v-else-if="appStore.themeMode === 'dark'"
      class="w-5 h-5 text-obsidian-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
    <!-- 系统 (system) -->
    <svg
      v-else
      class="w-5 h-5 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const themeLabel = computed(() => {
  const labels: Record<string, string> = {
    light: '浅色模式',
    dark: '深色模式',
    system: '跟随系统',
  }
  return labels[appStore.themeMode] || '切换主题'
})

function toggleTheme() {
  appStore.toggleTheme()
}
</script>
