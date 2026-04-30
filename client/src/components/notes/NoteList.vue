<template>
  <div class="w-72 flex-shrink-0 border-r border-gray-200 dark:border-vault-border bg-white dark:bg-vault-bg overflow-y-auto">
    <div class="p-3">
      <!-- 列表头 -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-500 dark:text-vault-muted uppercase tracking-wider">
          笔记列表
        </h2>
        <span class="text-xs text-gray-400">{{ filteredNotes.length }}</span>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-obsidian-600"></div>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="filteredNotes.length === 0"
        class="text-center py-8 text-gray-400 dark:text-vault-muted"
      >
        <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm">暂无笔记</p>
      </div>

      <!-- 笔记卡片列表 -->
      <div v-else class="space-y-1">
        <NoteCard
          v-for="note in filteredNotes"
          :key="getNoteKey(note)"
          :note="note"
          :active="isActive(note)"
          @click="handleSelectNote(note)"
          @delete="handleDeleteNote(note)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotesStore } from '@/stores/notes'
import { useLocalVaultStore } from '@/stores/localVault'
import { useAppStore } from '@/stores/app'
import { getNoteIdentifier } from '@/api/notes'
import NoteCard from './NoteCard.vue'
import type { Note } from '@/types'

defineProps<{
  loading?: boolean
}>()

const notesStore = useNotesStore()
const localVaultStore = useLocalVaultStore()
const appStore = useAppStore()

const filteredNotes = computed(() => notesStore.filteredNotes)
const currentNote = computed(() => notesStore.currentNote)

function getNoteKey(note: Note): string {
  return `${note.is_cloud ? 'cloud' : 'vault'}:${getNoteIdentifier(note)}`
}

function isActive(note: Note): boolean {
  const current = currentNote.value
  if (!current) return false
  return current.is_cloud === note.is_cloud && getNoteIdentifier(current) === getNoteIdentifier(note)
}

function handleSelectNote(note: Note) {
  notesStore.setCurrentNote(note)
}

async function handleDeleteNote(note: Note) {
  const title = note.title || '未命名笔记'
  if (!confirm(`确定删除笔记「${title}」？`)) return

  try {
    await notesStore.deleteNote(note)
    // 如果删除的是当前选中的笔记，清空编辑器
    if (notesStore.currentNote && getNoteIdentifier(notesStore.currentNote) === getNoteIdentifier(note)
      && notesStore.currentNote.is_cloud === note.is_cloud) {
      notesStore.setCurrentNote(null)
    }
    // 如果是本地模式，刷新本地笔记列表
    if (!appStore.isCloudMode && localVaultStore.activeVault) {
      const { listMarkdownFiles } = await import('@/utils/localFileSystem')
      const notes = await listMarkdownFiles(localVaultStore.activeVault.handle)
      localVaultStore.notes = notes
      const localNotes = notes.map((ln) => ({
        id: ln.path,
        title: ln.name.replace(/\.md$/, ''),
        content: ln.content,
        tags: [],
        is_cloud: false,
        folderPath: ln.path.includes('/') ? '/' + ln.path.substring(0, ln.path.lastIndexOf('/')) : '/',
        filePath: ln.path,
        createdAt: new Date(ln.lastModified).toISOString(),
        updatedAt: new Date(ln.lastModified).toISOString(),
      }))
      notesStore.setNotes(localNotes)
    }
  } catch (err: any) {
    console.error('删除失败:', err)
  }
}
</script>
