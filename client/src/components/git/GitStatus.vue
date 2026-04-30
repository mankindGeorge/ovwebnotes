<template>
  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-vault-muted">
    <div
      :class="[
        'w-2 h-2 rounded-full',
        gitStatus?.isClean ? 'bg-green-500' : 'bg-amber-500',
      ]"
      :title="gitStatus?.isClean ? '已同步' : '有未提交的更改'"
    />
    <div class="flex flex-col">
      <span v-if="gitStatus" class="flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {{ gitStatus.branch }}
      </span>
      <span v-if="gitStatus && !gitStatus.isClean" class="text-amber-500">
        {{ gitStatus.modified }} 修改, {{ gitStatus.untracked }} 新增
      </span>
      <span v-if="gitStatus?.lastSync" class="text-gray-400">
        {{ formattedLastSync }}
      </span>
      <span v-if="loading" class="text-gray-400">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { GitStatus } from '@/types'
import { getGitStatus as fetchGitStatus } from '@/api/git'

const gitStatus = ref<GitStatus | null>(null)
const loading = ref(false)

const formattedLastSync = computed(() => {
  if (!gitStatus.value?.lastSync) return ''
  const date = new Date(gitStatus.value.lastSync)
  return `上次同步: ${date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`
})

async function loadStatus() {
  loading.value = true
  try {
    const res = await fetchGitStatus()
    gitStatus.value = res.data.data
  } catch {
    // 静默处理
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStatus()
  // 每 30 秒刷新一次
  setInterval(loadStatus, 30000)
})
</script>
