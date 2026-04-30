<template>
  <div class="flex flex-col h-screen overflow-hidden bg-white dark:bg-vault-bg">
    <AppHeader />
    <div class="flex flex-1 overflow-hidden relative">
      <!-- 移动端遮罩 -->
      <div
        v-if="appStore.sidebarOpen"
        class="fixed inset-0 bg-black/50 z-20 lg:hidden"
        @click="appStore.setSidebarOpen(false)"
      />

      <!-- 左侧边栏 -->
      <AppSidebar />

      <!-- 主内容区 -->
      <main class="flex-1 flex overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const appStore = useAppStore()
</script>
