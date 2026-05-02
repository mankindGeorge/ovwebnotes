<template>
  <div class="flex flex-col h-screen overflow-hidden bg-warm-bg dark:bg-vault-bg relative">
    <div class="absolute inset-0 pointer-events-none bg-gradient-to-br from-warm-surface/30 via-transparent to-warm-card/20 dark:from-vault-surface/20 dark:via-transparent dark:to-vault-bg/30"></div>
    <AppHeader />
    <div class="flex flex-1 overflow-hidden relative">
      <div
        v-if="appStore.sidebarOpen && appStore.isMobile"
        class="fixed inset-0 bg-black/50 z-20 pointer-events-auto"
        @click="appStore.setSidebarOpen(false)"
      />

      <AppSidebar />

      <main :class="[
        'flex overflow-hidden',
        appStore.isMobile ? 'flex-1 w-full' : 'flex-1',
      ]">
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
