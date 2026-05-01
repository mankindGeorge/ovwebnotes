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
        <svg
          v-if="item.type === 'file' && item.is_cloud"
          class="w-3 h-3 flex-shrink-0 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          title="云端存储"
        >
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
        </svg>
        <span
          v-if="item.type === 'file' && item.preview"
          class="text-xs text-warm-text-muted dark:text-vault-muted truncate max-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {{ item.preview }}
        </span>
      </div>
      <div v-if="item.type === 'folder' && expandedFolders.has(item.path) && item.children">
        <FileTree
          :items="item.children"
          :level="(level || 0) + 1"
          :selected-item="selectedItem"
          :expanded-folders="expandedFolders"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
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
