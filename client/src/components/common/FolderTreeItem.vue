<template>
  <div>
    <button
      :class="[
        'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors',
        selected
          ? 'bg-obsidian-100 dark:bg-vault-highlight text-obsidian-700 dark:text-obsidian-300'
          : 'hover:bg-gray-100 dark:hover:bg-vault-highlight text-gray-700 dark:text-vault-text',
      ]"
      @click.stop="$emit('select')"
    >
      <!-- 文件夹图标 -->
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>

      <span class="truncate">{{ folder.name }}</span>
      <span class="ml-auto text-xs text-gray-400 flex-shrink-0">{{ folder.noteCount }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { FolderNode } from '@/types'

defineProps<{
  folder: FolderNode
  selected: boolean
}>()

defineEmits<{
  select: []
}>()
</script>
