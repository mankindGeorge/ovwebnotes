<template>
  <header
    class="h-14 flex items-center justify-between px-4 border-b border-warm-border dark:border-vault-border bg-warm-card/95 dark:bg-vault-surface/95 backdrop-blur-sm relative z-20"
  >
    <!-- 左侧: 菜单按钮 + Logo -->
    <div class="flex items-center gap-3">
      <button
        class="p-1.5 rounded-lg hover:bg-warm-hover dark:hover:bg-vault-highlight transition-colors"
        @click="appStore.toggleSidebar"
        :title="appStore.sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div class="flex items-center gap-2">
        <svg
          class="w-6 h-6 text-obsidian-600 dark:text-obsidian-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
          />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span class="font-semibold text-lg hidden sm:inline">
          Ovwebnotes
        </span>
      </div>
    </div>

    <!-- 中间: 搜索栏 -->
    <div class="flex-1 max-w-md mx-4">
      <SearchBar />
    </div>

    <!-- 右侧: 工具栏 -->
    <div class="flex items-center gap-2">
      <StorageToggle />
      <ThemeToggle />
      <button
        class="p-1.5 rounded-lg hover:bg-warm-hover dark:hover:bg-vault-highlight transition-colors"
        :title="isSettings ? '返回笔记' : '设置'"
        @click="toggleSettings"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import SearchBar from '@/components/common/SearchBar.vue'
import StorageToggle from '@/components/common/StorageToggle.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

const isSettings = computed(() => route.path === '/settings')

function toggleSettings() {
  if (isSettings.value) {
    router.push('/')
  } else {
    router.push('/settings')
  }
}
</script>
