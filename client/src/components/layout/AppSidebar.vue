<template>
  <aside
    :class="[
      'w-64 flex-shrink-0 border-r border-gray-200 dark:border-vault-border bg-gray-50 dark:bg-vault-surface transition-all duration-300 overflow-y-auto',
      appStore.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-0 lg:overflow-hidden',
    ]"
  >
    <div class="p-4">
      <!-- 当前存储模式标识 -->
      <div class="flex items-center gap-2 mb-3 px-1">
        <span
          :class="[
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            appStore.isCloudMode
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-obsidian-100 dark:bg-obsidian-900/30 text-obsidian-700 dark:text-obsidian-300',
          ]"
        >
          <svg v-if="appStore.isCloudMode" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          </svg>
          <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {{ appStore.isCloudMode ? 'Cloud 模式' : 'Vault 模式' }}
        </span>
      </div>

      <!-- 新建按钮 -->
      <div class="flex items-center gap-1 mb-4">
        <button
          class="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-colors"
          title="新建笔记"
          @click="handleCreateNote"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          class="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-gray-200 dark:bg-vault-highlight hover:bg-gray-300 dark:hover:bg-vault-border text-gray-700 dark:text-vault-text transition-colors"
          title="新建文件夹"
          @click="handleCreateFolder"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>

      <!-- 分类树 -->
      <div class="space-y-1">
        <div class="text-xs font-semibold text-gray-500 dark:text-vault-muted uppercase tracking-wider mb-2">
          分类
        </div>

        <!-- 文件夹列表 -->
        <FolderTreeItem
          v-for="folder in folders"
          :key="folder.path"
          :folder="folder"
          :selected="notesStore.selectedFolder === folder.path"
          @select="selectFolder(folder.path)"
        />
      </div>

      <!-- 标签过滤 -->
      <div class="mt-6">
        <div class="text-xs font-semibold text-gray-500 dark:text-vault-muted uppercase tracking-wider mb-2">
          标签
        </div>
        <div class="flex flex-wrap gap-1.5">
          <TagBadge
            v-for="tag in notesStore.allTags"
            :key="tag"
            :tag="tag"
            :active="notesStore.selectedTags.includes(tag)"
            @click="toggleTag(tag)"
          />
        </div>
      </div>

      <!-- 数据同步区域 -->
      <div class="mt-6">
        <div class="text-xs font-semibold text-gray-500 dark:text-vault-muted uppercase tracking-wider mb-2">
          数据同步
        </div>
        <div class="space-y-2">
          <!-- 数据同步 -->
          <div class="relative">
            <button
              class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="syncing"
              @click="showSyncMenu = !showSyncMenu"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ syncing ? '处理中...' : '数据同步' }}</span>
              <svg class="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <!-- 下拉菜单 -->
            <div
              v-if="showSyncMenu"
              class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-vault-bg border border-gray-200 dark:border-vault-border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <button
                class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-vault-text hover:bg-gray-50 dark:hover:bg-vault-highlight transition-colors text-left"
                @click="handleSelectFiles"
              >
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                上传文件到云端
              </button>
              <button
                class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-vault-text hover:bg-gray-50 dark:hover:bg-vault-highlight transition-colors text-left border-t border-gray-100 dark:border-vault-border"
                @click="handleSelectFolder"
              >
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                上传文件夹到云端
              </button>
              <button
                class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-vault-text hover:bg-gray-50 dark:hover:bg-vault-highlight transition-colors text-left border-t border-gray-100 dark:border-vault-border"
                @click="handleDownloadNote"
              >
                <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                下载当前笔记
              </button>
            </div>
          </div>
          <!-- 隐藏的文件选择器 -->
          <input ref="uploadFileInput" type="file" accept=".md,.markdown" multiple class="hidden" @change="handleFileUpload" />
          <input ref="uploadFolderInput" type="file" accept=".md,.markdown" multiple class="hidden" webkitdirectory @change="handleFolderUpload" />
          <p v-if="syncMessage" class="text-xs px-1" :class="syncSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ syncMessage }}
          </p>
        </div>
      </div>

      <!-- Vault 切换 -->
      <div class="mt-6">
        <div class="text-xs font-semibold text-gray-500 dark:text-vault-muted uppercase tracking-wider mb-2">
          Vault
        </div>
        <div class="space-y-1">
          <!-- 本地模式：显示 File System Vault -->
          <template v-if="!appStore.isCloudMode">
            <div
              v-if="localVaultStore.activeVault"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-obsidian-100 dark:bg-vault-highlight text-obsidian-700 dark:text-obsidian-300"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span class="truncate">{{ localVaultStore.activeVault.name }}</span>
              <span class="ml-auto text-xs text-green-500">已连接</span>
            </div>
            <p v-else class="text-xs text-gray-400 dark:text-vault-muted px-3">
              未连接本地目录
            </p>
          </template>
          <!-- 云端模式 -->
          <template v-else>
            <p class="text-xs text-gray-400 dark:text-vault-muted px-3">
              云端模式
            </p>
          </template>
        </div>
      </div>

      <!-- Git 状态 -->
      <div class="mt-6">
        <GitStatus />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useNotesStore } from '@/stores/notes'
import { useLocalVaultStore } from '@/stores/localVault'
import { useNotes } from '@/composables/useNotes'
import TagBadge from '@/components/common/TagBadge.vue'
import FolderTreeItem from '@/components/common/FolderTreeItem.vue'
import GitStatus from '@/components/git/GitStatus.vue'
import * as notesApi from '@/api/notes'
import type { FolderNode } from '@/types'

const appStore = useAppStore()
const notesStore = useNotesStore()
const localVaultStore = useLocalVaultStore()
const { addNote } = useNotes()

const syncing = ref(false)
const syncMessage = ref('')
const syncSuccess = ref(false)
const uploadFileInput = ref<HTMLInputElement | null>(null)
const uploadFolderInput = ref<HTMLInputElement | null>(null)
const showSyncMenu = ref(false)


// 从笔记中提取文件夹结构
const localSubDirs = ref<string[]>([])

// 加载本地子目录（包括空文件夹）
async function loadLocalSubDirs() {
  if (!appStore.isCloudMode && localVaultStore.activeVault) {
    try {
      const handle = localVaultStore.activeVault.handle
      const dirs: string[] = []
      async function walk(dirHandle: FileSystemDirectoryHandle, prefix: string) {
        for await (const entry of (dirHandle as any).values()) {
          if (entry.kind === 'directory') {
            const dirPath = prefix ? `${prefix}/${entry.name}` : entry.name
            dirs.push(dirPath)
            await walk(entry, dirPath)
          }
        }
      }
      await walk(handle, '')
      localSubDirs.value = dirs
    } catch {
      localSubDirs.value = []
    }
  } else {
    localSubDirs.value = []
  }
}

const folders = computed(() => {
  const folderMap = new Map<string, FolderNode>()

  // 从笔记中提取有笔记的文件夹
  notesStore.notes.forEach((note) => {
    const path = note.folderPath || '/'
    if (path === '/' || !path) return
    const cleanPath = path.startsWith('/') ? path.substring(1) : path
    // 跳过隐藏文件夹（以 . 开头）
    const topFolder = cleanPath.split('/')[0]
    if (topFolder.startsWith('.')) return
    if (!folderMap.has(cleanPath)) {
      const parts = cleanPath.split('/')
      const name = parts[parts.length - 1] || cleanPath
      folderMap.set(cleanPath, { name, path: '/' + cleanPath, children: [], noteCount: 0 })
    }
    folderMap.get(cleanPath)!.noteCount++
  })

  // 本地模式下，补充空文件夹（仅顶级）
  if (!appStore.isCloudMode) {
    localSubDirs.value.forEach((dir) => {
      // 只添加顶级文件夹（不含子路径），跳过隐藏文件夹
      if (dir.includes('/')) return
      if (dir.startsWith('.')) return
      if (!folderMap.has(dir)) {
        const parts = dir.split('/')
        const name = parts[parts.length - 1] || dir
        folderMap.set(dir, { name, path: '/' + dir, children: [], noteCount: 0 })
      }
    })
  }

  // 只返回顶级文件夹
  return Array.from(folderMap.values())
    .filter((f) => {
      const cleanPath = f.path.startsWith('/') ? f.path.substring(1) : f.path
      return !cleanPath.includes('/')
    })
    .sort((a, b) => a.path.localeCompare(b.path))
})

function selectFolder(path: string) {
  notesStore.selectedFolder = path
}

// 本地模式切换或 vault 变化时，重新扫描目录结构
watch(
  () => [localVaultStore.activeVault, appStore.isCloudMode],
  () => { loadLocalSubDirs() },
  { immediate: true },
)

function toggleTag(tag: string) {
  const index = notesStore.selectedTags.indexOf(tag)
  if (index === -1) {
    notesStore.selectedTags.push(tag)
  } else {
    notesStore.selectedTags.splice(index, 1)
  }
}

async function handleCreateFolder() {
  const name = prompt('请输入文件夹名称')
  if (!name || !name.trim()) return
  const folderName = name.trim()

  if (!appStore.isCloudMode && localVaultStore.isConnected) {
    // 本地模式：在 File System API 中创建目录
    try {
      const handle = localVaultStore.activeVault?.handle
      if (!handle) return
      const { createNote, listMarkdownFiles } = await import('@/utils/localFileSystem')
      // 通过创建一个 .keep 文件来创建目录
      await createNote(handle, '.keep', '', folderName)
      // 刷新笔记列表
      const notes = await listMarkdownFiles(handle)
      localVaultStore.notes = notes
      // 同步到 notesStore
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
    } catch (err: any) {
      console.error('创建文件夹失败:', err)
    }
  } else if (appStore.isCloudMode) {
    // 云端模式：文件夹通过笔记的 folderPath 自动创建，无需额外操作
    // 创建一个占位笔记来建立文件夹
    await addNote({
      title: '未命名笔记',
      content: '',
      folderPath: `/${folderName}`,
      is_cloud: true,
    })
  }
}

async function handleCreateNote() {
  try {
    if (!appStore.isCloudMode && localVaultStore.isConnected) {
      // 本地模式：使用 File System API 创建
      const folder = notesStore.selectedFolder
        ? notesStore.selectedFolder.replace(/^\//, '')
        : ''
      const localNote = await localVaultStore.createNewNote('未命名笔记', '', folder)
      // 转换为 Note 格式并添加到列表
      const note: import('@/types').Note = {
        id: localNote.path,
        title: '未命名笔记',
        content: '',
        tags: [],
        is_cloud: false,
        folderPath: folder ? '/' + folder : '/',
        filePath: localNote.path,
        createdAt: new Date(localNote.lastModified).toISOString(),
        updatedAt: new Date(localNote.lastModified).toISOString(),
      }
      notesStore.notes.unshift(note)
      notesStore.setCurrentNote(note)
    } else {
      // 云端模式：使用 API
      await addNote({
        title: '未命名笔记',
        content: '',
        folderPath: notesStore.selectedFolder || undefined,
        is_cloud: true,
      })
    }
  } catch {
    // 错误已在 store 中处理
  }
}

/** 选择文件上传 */
async function handleSelectFiles() {
  showSyncMenu.value = false

  // 如果本地模式已连接，使用 File System Access API 从挂载目录开始
  if (!appStore.isCloudMode && localVaultStore.activeVault && 'showOpenFilePicker' in window) {
    try {
      const dirHandle = localVaultStore.activeVault.handle
      const fileHandles = await (window as any).showOpenFilePicker({
        multiple: true,
        types: [{
          description: 'Markdown 文件',
          accept: { 'text/markdown': ['.md', '.markdown'] },
        }],
        startIn: dirHandle,
      })
      if (fileHandles.length > 0) {
        await processFileHandles(fileHandles, '')
      }
      return
    } catch (err: any) {
      if (err.name === 'AbortError') return
      // fallback to input
    }
  }

  uploadFileInput.value?.click()
}

/** 选择文件夹上传 */
async function handleSelectFolder() {
  showSyncMenu.value = false

  // 如果本地模式已连接，使用 File System Access API 从挂载目录开始
  if (!appStore.isCloudMode && localVaultStore.activeVault && 'showDirectoryPicker' in window) {
    try {
      const dirHandle = localVaultStore.activeVault.handle
      const pickedDir = await (window as any).showDirectoryPicker({
        startIn: dirHandle,
      })
      await processDirectoryHandle(pickedDir, '')
      return
    } catch (err: any) {
      if (err.name === 'AbortError') return
      // fallback to input
    }
  }

  uploadFolderInput.value?.click()
}

/** 通过 File System Access API 处理文件句柄 */
async function processFileHandles(fileHandles: FileSystemFileHandle[], basePath: string) {
  syncing.value = true
  syncMessage.value = ''
  let successCount = 0
  let failCount = 0

  try {
    for (const fileHandle of fileHandles) {
      try {
        const file = await fileHandle.getFile()
        const content = await file.text()
        const title = file.name.replace(/\.(md|markdown)$/i, '')
        const filePath = basePath ? `${basePath}/${file.name}` : file.name
        const folderPath = basePath ? `/${basePath}` : '/'

        await notesApi.importNote(filePath, { title, content, tags: [], folderPath })
        successCount++
      } catch {
        failCount++
      }
    }

    syncSuccess.value = failCount === 0
    syncMessage.value = failCount === 0
      ? `已上传 ${successCount} 个文件`
      : `上传完成：成功 ${successCount}，失败 ${failCount}`

    if (appStore.isCloudMode) {
      notesStore.fetchNotes({ is_cloud: true })
    }
  } catch (err: any) {
    syncSuccess.value = false
    syncMessage.value = err.message || '上传失败'
  } finally {
    syncing.value = false
  }
}

/** 递归处理目录句柄 */
async function processDirectoryHandle(dirHandle: FileSystemDirectoryHandle, basePath: string) {
  syncing.value = true
  syncMessage.value = ''
  let successCount = 0
  let failCount = 0

  try {
    async function walkDir(handle: FileSystemDirectoryHandle, path: string) {
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file' && entry.name.match(/\.(md|markdown)$/i)) {
          try {
            const file = await entry.getFile()
            const content = await file.text()
            const title = entry.name.replace(/\.(md|markdown)$/i, '')
            const filePath = path ? `${path}/${entry.name}` : entry.name
            const folderPath = path ? `/${path}` : '/'

            await notesApi.importNote(filePath, { title, content, tags: [], folderPath })
            successCount++
          } catch {
            failCount++
          }
        } else if (entry.kind === 'directory') {
          await walkDir(entry, path ? `${path}/${entry.name}` : entry.name)
        }
      }
    }

    await walkDir(dirHandle, basePath)

    syncSuccess.value = failCount === 0
    syncMessage.value = failCount === 0
      ? `已上传 ${successCount} 篇笔记`
      : `上传完成：成功 ${successCount}，失败 ${failCount}`

    if (appStore.isCloudMode) {
      notesStore.fetchNotes({ is_cloud: true })
    }
  } catch (err: any) {
    syncSuccess.value = false
    syncMessage.value = err.message || '上传失败'
  } finally {
    syncing.value = false
  }
}

/** 读取文件内容 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/** 上传文件到云端 */
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  syncing.value = true
  syncMessage.value = ''
  let successCount = 0
  let failCount = 0

  try {
    for (const file of files) {
      try {
        const content = await readFileContent(file)
        const title = file.name.replace(/\.(md|markdown)$/, '')
        // 从 webkitRelativePath 提取文件夹（如果有）
        const relativePath = (file as any).webkitRelativePath || file.name
        const pathParts = relativePath.split('/')
        const folderPath = pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/'

        await notesApi.importNote(file.name, {
          title,
          content,
          tags: [],
          folderPath,
        })
        successCount++
      } catch {
        failCount++
      }
    }

    syncSuccess.value = failCount === 0
    syncMessage.value = failCount === 0
      ? `已上传 ${successCount} 个文件`
      : `上传完成：成功 ${successCount}，失败 ${failCount}`

    if (appStore.isCloudMode) {
      notesStore.fetchNotes({ is_cloud: true })
    }
  } catch (err: any) {
    syncSuccess.value = false
    syncMessage.value = err.message || '上传失败'
  } finally {
    syncing.value = false
    // 重置 input 以允许重复选择同一文件
    input.value = ''
  }
}

/** 上传文件夹到云端 */
async function handleFolderUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  syncing.value = true
  syncMessage.value = ''
  let successCount = 0
  let failCount = 0

  try {
    for (const file of files) {
      // 只上传 .md 文件
      if (!file.name.match(/\.(md|markdown)$/i)) continue

      try {
        const content = await readFileContent(file)
        const title = file.name.replace(/\.(md|markdown)$/, '')
        const relativePath = (file as any).webkitRelativePath || ''
        const pathParts = relativePath.split('/')
        // webkitRelativePath 格式: "folderName/sub/file.md"，取第一个目录名作为 folderPath
        const folderPath = pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/'

        await notesApi.importNote(relativePath || file.name, {
          title,
          content,
          tags: [],
          folderPath,
        })
        successCount++
      } catch {
        failCount++
      }
    }

    syncSuccess.value = failCount === 0
    syncMessage.value = failCount === 0
      ? `已上传 ${successCount} 篇笔记`
      : `上传完成：成功 ${successCount}，失败 ${failCount}`

    if (appStore.isCloudMode) {
      notesStore.fetchNotes({ is_cloud: true })
    }
  } catch (err: any) {
    syncSuccess.value = false
    syncMessage.value = err.message || '上传失败'
  } finally {
    syncing.value = false
    input.value = ''
  }
}

/** 下载当前笔记（浏览器下载） */
async function handleDownloadNote() {
  const note = notesStore.currentNote
  if (!note) {
    syncMessage.value = '请先选择一篇笔记'
    syncSuccess.value = false
    return
  }

  syncing.value = true
  syncMessage.value = ''
  try {
    let content = note.content || ''
    let title = note.title || '未命名笔记'

    // 如果是云端笔记，先获取最新内容
    if (note.is_cloud) {
      const identifier = notesApi.getNoteIdentifier(note)
      const res = await notesApi.getNoteById(identifier, true)
      content = res.data.data?.content || content
      title = res.data.data?.title || title
    }

    // 使用浏览器下载
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    syncSuccess.value = true
    syncMessage.value = `已下载: ${title}.md`
  } catch (err: any) {
    syncSuccess.value = false
    syncMessage.value = err.response?.data?.message || '下载失败'
  } finally {
    syncing.value = false
  }
}


</script>
