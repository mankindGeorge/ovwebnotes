<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useLocalVaultStore } from '@/stores/localVault'
import { useAppStore } from '@/stores/app'
import { useNotesStore } from '@/stores/notes'
import * as gitApi from '@/api/git'

const { initTheme } = useTheme()
const localVaultStore = useLocalVaultStore()
const appStore = useAppStore()
const notesStore = useNotesStore()

onMounted(async () => {
  initTheme()
  await localVaultStore.init()
  
  // 自动拉取git仓库内容
  if (appStore.isCloudMode) {
    try {
      await gitApi.autoSync()
      // 拉取后刷新笔记列表
      await notesStore.fetchNotes({ is_cloud: true })
    } catch (error) {
      console.warn('自动拉取失败:', error)
    }
  }
})
</script>
