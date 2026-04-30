<template>
  <button
    :class="[
      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200',
      syncing
        ? 'bg-gray-100 dark:bg-vault-highlight text-gray-400 dark:text-vault-muted cursor-wait'
        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
    ]"
    :disabled="syncing"
    @click="handleSync"
    title="强制同步"
  >
    <svg
      :class="['w-3.5 h-3.5', syncing ? 'animate-spin' : '']"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    <span>{{ syncing ? '同步中...' : '同步' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { forceSync } from '@/api/git'

const syncing = ref(false)

async function handleSync() {
  if (syncing.value) return

  syncing.value = true
  try {
    const res = await forceSync()
    const result = res.data.data
    if (result.success) {
      console.log('同步成功:', result.message)
    } else {
      console.warn('同步失败:', result.message)
    }
  } catch (err) {
    console.error('同步请求失败:', err)
  } finally {
    syncing.value = false
  }
}
</script>
