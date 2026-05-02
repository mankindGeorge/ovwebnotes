<template>
  <div class="space-y-0.5">
    <div
      v-for="item in items"
      :key="item.path"
      class="select-none"
    >
      <div
        :class="[
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group',
          selectedItem === item.path
            ? 'bg-obsidian-100 dark:bg-vault-highlight text-obsidian-800 dark:text-obsidian-200'
            : 'hover:bg-warm-hover dark:hover:bg-vault-surface text-warm-text dark:text-vault-text',
          dragOverItem === item.path && item.type === 'folder' ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 border-dashed' : '',
        ]"
        :style="{ paddingLeft: `${(level || 0) * 12 + 8}px` }"
        :draggable="item.type === 'file'"
        @click="handleClick(item)"
        @dragstart="handleDragStart($event, item)"
        @dragover.prevent="handleDragOver($event, item)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, item)"
        @dragend="handleDragEnd"
      >
        <svg
          v-if="item.type === 'folder'"
          class="w-4 h-4 flex-shrink-0 transition-transform"
          :class="expandedFolders.has(item.path) ? 'rotate-90' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <svg
          v-else
          class="w-4 h-4 flex-shrink-0 text-warm-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-sm truncate flex-1">{{ item.name }}</span>
        <!-- GitHub 图标 - 仅远程仓库根文件夹显示 -->
        <svg
          v-if="item.type === 'folder' && item.isRepository && (level ?? 0) === 0"
          class="w-4 h-4 flex-shrink-0 text-gray-600 dark:text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
          title="来自 GitHub 仓库"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <button
          v-if="item.type === 'file'"
          class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
          title="删除"
          @click.stop="handleDelete(item)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <svg
          v-if="item.type === 'file' && item.is_cloud"
          class="w-4 h-4 flex-shrink-0 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          title="云端存储"
        >
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
        </svg>
      </div>
      <div v-if="item.type === 'folder' && expandedFolders.has(item.path) && item.children">
        <FileTree
          :items="item.children"
          :level="(level || 0) + 1"
          :selected-item="selectedItem"
          :expanded-folders="expandedFolders"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
          @move="$emit('move', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'

export interface FileTreeItem {
  name: string
  path: string
  type: 'folder' | 'file'
  preview?: string
  is_cloud?: boolean
  isRepository?: boolean
  children?: FileTreeItem[]
}

defineProps<{
  items: FileTreeItem[]
  level?: number
  selectedItem?: string
  expandedFolders: Set<string>
}>()

const emit = defineEmits<{
  select: [item: FileTreeItem]
  toggle: [path: string]
  move: [data: { sourcePath: string; targetFolder: string }]
  delete: [item: FileTreeItem]
}>()

const FileTree = defineAsyncComponent(() => import('./FileTree.vue'))

const dragOverItem = ref<string | null>(null)

function handleClick(item: FileTreeItem) {
  if (item.type === 'folder') {
    emit('toggle', item.path)
  } else {
    emit('select', item)
  }
}

function handleDelete(item: FileTreeItem) {
  emit('delete', item)
}

function handleDragStart(event: DragEvent, item: FileTreeItem) {
  if (item.type === 'file') {
    event.dataTransfer?.setData('application/json', JSON.stringify({
      type: item.type,
      path: item.path,
      name: item.name,
    }))
    event.dataTransfer!.effectAllowed = 'move'
  }
}

function handleDragOver(event: DragEvent, item: FileTreeItem) {
  if (item.type === 'folder') {
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'move'
    dragOverItem.value = item.path
  }
}

function handleDragLeave() {
  dragOverItem.value = null
}

function handleDrop(event: DragEvent, target: FileTreeItem) {
  event.preventDefault()
  dragOverItem.value = null
  
  if (target.type === 'folder') {
    const dataStr = event.dataTransfer?.getData('application/json')
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr)
        if (data.type === 'file' && data.path !== target.path) {
          emit('move', {
            sourcePath: data.path,
            targetFolder: target.path,
          })
        }
      } catch (error) {
        console.error('Failed to parse drag data:', error)
      }
    }
  }
}

function handleDragEnd() {
  dragOverItem.value = null
}
</script>
