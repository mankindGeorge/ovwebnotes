<template>
  <div
    :class="[
      'group p-3 rounded-lg cursor-pointer transition-all duration-150 border',
      active
        ? 'bg-obsidian-50 dark:bg-vault-highlight border-obsidian-200 dark:border-obsidian-700'
        : 'hover:bg-gray-50 dark:hover:bg-vault-surface border-transparent',
    ]"
    @click="$emit('click')"
  >
    <!-- 标题 -->
    <h3
      class="text-sm font-medium truncate mb-1"
      :class="active ? 'text-obsidian-800 dark:text-obsidian-200' : 'text-gray-800 dark:text-vault-text'"
    >
      {{ note.title || '未命名笔记' }}
    </h3>

    <!-- 摘要 -->
    <p class="text-xs text-gray-500 dark:text-vault-muted line-clamp-2 mb-2">
      {{ excerpt }}
    </p>

    <!-- 元信息 -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- 标签 -->
      <TagBadge
        v-for="tag in note.tags.slice(0, 3)"
        :key="tag"
        :tag="tag"
        size="sm"
      />
      <span v-if="note.tags.length > 3" class="text-xs text-gray-400">
        +{{ note.tags.length - 3 }}
      </span>

      <!-- 存储模式标识 -->
      <span
        v-if="note.is_cloud"
        class="inline-flex items-center gap-0.5 text-xs text-blue-500"
        title="云端存储"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
        </svg>
      </span>

      <!-- 删除按钮 -->
      <button
        class="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        title="删除笔记"
        @click.stop="$emit('delete')"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <!-- 更新时间 -->
      <span class="text-xs text-gray-400 dark:text-vault-muted">
        {{ formattedTime }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '@/types'
import TagBadge from '@/components/common/TagBadge.vue'

const props = defineProps<{
  note: Note
  active?: boolean
}>()

defineEmits<{
  click: []
  delete: []
}>()

const excerpt = computed(() => {
  const content = props.note.content || ''
  // 移除 markdown 标记
  const plain = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .trim()
  return plain.slice(0, 100) || '暂无内容'
})

const formattedTime = computed(() => {
  const date = new Date(props.note.updatedAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
})
</script>
