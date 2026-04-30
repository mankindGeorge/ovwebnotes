<template>
  <button
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
    :class="[
      appStore.isCloudMode
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
        : 'bg-obsidian-100 dark:bg-obsidian-900/30 text-obsidian-700 dark:text-obsidian-300 hover:bg-obsidian-200 dark:hover:bg-obsidian-900/50',
    ]"
    @click="appStore.toggleStorageMode"
    :title="appStore.isCloudMode ? '切换到 Vault 存储' : '切换到 Cloud 存储'"
  >
    <!-- Cloud 图标 -->
    <svg
      v-if="appStore.isCloudMode"
      class="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"
      />
    </svg>
    <!-- Vault 图标 -->
    <svg
      v-else
      class="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
    <span class="hidden sm:inline">{{ appStore.isCloudMode ? 'Cloud' : 'Vault' }}</span>
  </button>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>
