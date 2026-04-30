<template>
  <AppLayout>
    <!-- 本地 Vault 未连接提示 -->
    <div
      v-if="!appStore.isCloudMode && !localVaultStore.isConnected"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center max-w-md px-4">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-vault-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-700 dark:text-vault-text mb-2">未连接本地目录</h3>
        <p class="text-sm text-gray-500 dark:text-vault-muted mb-4">
          选择一个本地文件夹作为笔记存储目录，笔记将以 .md 文件形式保存在你的电脑上。
        </p>
        <button
          v-if="localVaultStore.supported"
          class="px-4 py-2 bg-obsidian-600 text-white rounded-lg hover:bg-obsidian-700 transition-colors text-sm font-medium"
          @click="handlePickDirectory"
        >
          选择本地目录
        </button>
        <p v-else class="text-sm text-red-500">
          当前浏览器不支持本地文件访问，请使用 Chrome 或 Edge
        </p>
      </div>
    </div>

    <!-- 本地 Vault 权限被拒绝提示 -->
    <div
      v-else-if="!appStore.isCloudMode && localVaultStore.error"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center max-w-md px-4">
        <svg class="w-16 h-16 mx-auto mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-700 dark:text-vault-text mb-2">需要授权访问</h3>
        <p class="text-sm text-gray-500 dark:text-vault-muted mb-4">
          {{ localVaultStore.error }}
        </p>
        <button
          class="px-4 py-2 bg-obsidian-600 text-white rounded-lg hover:bg-obsidian-700 transition-colors text-sm font-medium"
          @click="handleReconnect"
        >
          重新授权
        </button>
      </div>
    </div>

    <!-- 正常内容区 -->
    <template v-else>
      <!-- 笔记列表 -->
      <NoteList :loading="loading" />

      <!-- 编辑区 -->
      <div class="flex-1 overflow-hidden">
        <NoteEditor
          v-if="currentNote"
          :key="getNoteKey(currentNote)"
          v-model="editorContent"
          :note-title="currentNote.title"
          :title-editable="true"
          @update:note-title="handleTitleUpdate"
        />
        <div
          v-else
          class="h-full flex items-center justify-center text-gray-400 dark:text-vault-muted"
        >
          <div class="text-center">
            <svg
              class="w-20 h-20 mx-auto mb-4 opacity-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <p class="text-lg font-medium mb-1">欢迎使用 Ovwebnotes</p>
            <p class="text-sm">从左侧选择一篇笔记，或创建新笔记开始</p>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '@/stores/notes'
import { useAppStore } from '@/stores/app'
import { useLocalVaultStore } from '@/stores/localVault'
import { getNoteIdentifier } from '@/api/notes'
import type { Note, UpdateNoteDTO } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import NoteList from '@/components/notes/NoteList.vue'
import NoteEditor from '@/components/notes/NoteEditor.vue'

const notesStore = useNotesStore()
const appStore = useAppStore()
const localVaultStore = useLocalVaultStore()

const { currentNote, loading } = storeToRefs(notesStore)

const editorContent = ref('')
let saveTimer: ReturnType<typeof setTimeout> | null = null
let isSaving = false
let lastSavedContent = ''

/** 当前是否为本地模式 */
const isLocalMode = () => !appStore.isCloudMode

/** 生成笔记的唯一 key（用于 Vditor 重新挂载） */
function getNoteKey(note: Note): string {
  return `${note.is_cloud ? 'cloud' : 'vault'}:${getNoteIdentifier(note)}`
}

/**
 * 核心：保存笔记
 * Cloud 模式 → 后端 API
 * Local 模式 → File System API
 */
async function saveNote(note: Note, content: string): Promise<boolean> {
  if (!note || isSaving) return false

  isSaving = true
  try {
    if (isLocalMode()) {
      // 本地模式：直接写入文件系统
      await localVaultStore.saveNote(note.filePath, content)
    } else {
      // 云端模式：通过 API 保存
      const data: UpdateNoteDTO = { content }
      await notesStore.updateNote(note, data)
    }
    lastSavedContent = content
    return true
  } catch {
    return false
  } finally {
    isSaving = false
  }
}

/** 立即保存（切换笔记/模式/离开前调用），会等待锁释放 */
async function flushSave(note: Note | null, content: string) {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (note && content !== lastSavedContent) {
    while (isSaving) {
      await new Promise((r) => setTimeout(r, 100))
    }
    await saveNote(note, content)
  }
}

// 监听当前笔记变化
watch(
  currentNote,
  async (newNote, oldNote) => {
    if (oldNote) {
      await flushSave(oldNote, editorContent.value)
    }
    if (newNote) {
      editorContent.value = newNote.content
      lastSavedContent = newNote.content
    } else {
      editorContent.value = ''
      lastSavedContent = ''
    }
  }
)

// 监听存储模式切换
watch(
  () => appStore.isCloudMode,
  async () => {
    const note = currentNote.value
    if (note) {
      await flushSave(note, editorContent.value)
    }
    notesStore.setCurrentNote(null)
    editorContent.value = ''
    lastSavedContent = ''

    if (isLocalMode()) {
      // 切换到本地模式：从 File System API 加载笔记
      await loadLocalNotes()
    } else {
      // 切换到云端模式：从 API 加载笔记
      await notesStore.fetchNotes({ is_cloud: true })
      await notesStore.fetchAllTags()
    }
  }
)

// 监听编辑器内容变化，防抖保存
watch(editorContent, (newContent) => {
  const note = currentNote.value
  if (!note) return
  if (newContent === lastSavedContent) return

  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const current = currentNote.value
    if (!current) return
    if (editorContent.value === lastSavedContent) return
    await saveNote(current, editorContent.value)
  }, 1500)
})

async function handleTitleUpdate(title: string) {
  const note = currentNote.value
  if (!note) return
  try {
    if (isLocalMode()) {
      // 本地模式：重命名文件
      if (!localVaultStore.activeVault) return
      const { renameFile } = await import('@/utils/localFileSystem')
      const oldPath = note.filePath
      const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : ''
      const newPath = dir ? `${dir}/${title}.md` : `${title}.md`
      await renameFile(localVaultStore.activeVault.handle, oldPath, newPath)
      // 更新笔记信息
      note.title = title
      note.filePath = newPath
    } else {
      await notesStore.updateNote(note, { title })
    }
  } catch {
    // 静默处理
  }
}

/** 从本地文件系统加载笔记列表 */
async function loadLocalNotes() {
  await localVaultStore.loadNotes()
  // 将本地笔记转换为 Note 格式供 NoteList 使用
  const localNotes: Note[] = localVaultStore.notes.map((ln) => ({
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

/** 选择本地目录 */
async function handlePickDirectory() {
  try {
    const vault = await localVaultStore.addVault()
    if (vault) {
      await localVaultStore.switchVault(vault.id)
      await loadLocalNotes()
    }
  } catch (err: any) {
    alert(`选择目录失败: ${err.message || '当前浏览器不支持本地文件访问，请使用 Chrome 或 Edge 并通过 https:// 或 localhost 访问'}`)
  }
}

/** 重新授权 */
async function handleReconnect() {
  const ok = await localVaultStore.reconnect()
  if (ok) {
    await loadLocalNotes()
  }
}

onMounted(async () => {
  // 初始化本地 Vault
  await localVaultStore.init()

  if (isLocalMode()) {
    // 本地模式
    if (localVaultStore.isConnected) {
      await loadLocalNotes()
    }
  } else {
    // 云端模式
    await Promise.all([
      notesStore.fetchNotes({ is_cloud: true }),
      notesStore.fetchAllTags(),
    ])
  }
})

onBeforeUnmount(async () => {
  const note = currentNote.value
  if (note) {
    await flushSave(note, editorContent.value)
  }
})
</script>
