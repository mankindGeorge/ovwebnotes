import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type LocalNote,
  isFileSystemSupported,
  pickDirectory,
  verifyPermission,
  listMarkdownFiles,
  readFile,
  readFilePreview,
  writeFile,
  deleteFile,
  createNote,
  saveDirectoryHandle,
  loadDirectoryHandle,
  removeDirectoryHandle,
} from '@/utils/localFileSystem'

export interface LocalVaultInfo {
  id: string
  name: string
  handle: FileSystemDirectoryHandle
  connected: boolean
}

export const useLocalVaultStore = defineStore('localVault', () => {
  const vaults = ref<LocalVaultInfo[]>([])
  const activeVaultId = ref<string | null>(null)
  const notes = ref<LocalNote[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  const activeVault = computed(() =>
    vaults.value.find((v) => v.id === activeVaultId.value) || null
  )

  const isConnected = computed(() => {
    if (!activeVault.value) return false
    return activeVault.value.connected
  })

  const supported = computed(() => isFileSystemSupported())

  /** 初始化：从 IndexedDB 恢复已保存的目录句柄 */
  async function init() {
    if (initialized.value) return
    if (!isFileSystemSupported()) return

    // 恢复保存的 vault 列表
    const saved = localStorage.getItem('local-vaults')
    if (saved) {
      try {
        const list: { id: string; name: string }[] = JSON.parse(saved)
        for (const item of list) {
          // 检查是否已存在
          if (vaults.value.some((v) => v.id === item.id)) continue
          
          const handle = await loadDirectoryHandle(item.id)
          if (handle) {
            const permitted = await verifyPermission(handle)
            vaults.value.push({
              id: item.id,
              name: item.name,
              handle,
              connected: permitted,
            })
          }
        }
      } catch {
        // 解析失败，忽略
      }
    }

    // 恢复激活的 vault
    const savedActive = localStorage.getItem('local-vault-active')
    if (savedActive && vaults.value.find((v) => v.id === savedActive)) {
      activeVaultId.value = savedActive
    }
    
    initialized.value = true
  }

  /** 添加本地 Vault（弹出目录选择器） */
  async function addVault(name?: string): Promise<LocalVaultInfo | null> {
    const handle = await pickDirectory()
    if (!handle) return null

    const vaultName = name || handle.name

    // 检查是否已存在相同名称的 vault
    const existingVault = vaults.value.find((v) => v.name === vaultName)
    if (existingVault) {
      // 如果已存在，直接切换到该 vault
      await switchVault(existingVault.id)
      return existingVault
    }

    const id = `local-${Date.now()}`

    const info: LocalVaultInfo = {
      id,
      name: vaultName,
      handle,
      connected: true,
    }

    vaults.value.push(info)
    await saveDirectoryHandle(id, handle)
    persistVaultList()

    return info
  }

  /** 切换激活的 Vault */
  async function switchVault(id: string) {
    const vault = vaults.value.find((v) => v.id === id)
    if (!vault) return

    // 验证权限
    const permitted = await verifyPermission(vault.handle)
    vault.connected = permitted

    if (!permitted) {
      error.value = '目录访问权限被拒绝，请重新授权'
      return
    }

    activeVaultId.value = id
    localStorage.setItem('local-vault-active', id)
    error.value = null

    // 加载笔记列表
    await loadNotes()
  }

  /** 断开 Vault（不删除，只是取消激活） */
  function disconnectVault() {
    activeVaultId.value = null
    notes.value = []
    localStorage.removeItem('local-vault-active')
  }

  /** 删除 Vault */
  async function removeVault(id: string) {
    const idx = vaults.value.findIndex((v) => v.id === id)
    if (idx === -1) return

    vaults.value.splice(idx, 1)
    await removeDirectoryHandle(id)
    persistVaultList()

    if (activeVaultId.value === id) {
      activeVaultId.value = null
      notes.value = []
      localStorage.removeItem('local-vault-active')
    }
  }

  /** 加载当前 Vault 的所有笔记 */
  async function loadNotes() {
    if (!activeVault.value || !activeVault.value.connected) {
      notes.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      notes.value = await listMarkdownFiles(activeVault.value.handle)
      loadNotesPreview()
    } catch (err: any) {
      error.value = `加载笔记失败: ${err.message}`
      notes.value = []
    } finally {
      loading.value = false
    }
  }

  /** 后台加载笔记预览内容 */
  async function loadNotesPreview() {
    if (!activeVault.value) return

    const batchSize = 10
    for (let i = 0; i < notes.value.length; i += batchSize) {
      const batch = notes.value.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (note) => {
          try {
            const preview = await readFilePreview(activeVault.value!.handle, note.path, 5)
            const idx = notes.value.findIndex((n) => n.path === note.path)
            if (idx !== -1) {
              notes.value[idx].preview = preview
            }
          } catch {
            // 忽略读取错误
          }
        })
      )
    }
  }

  /** 读取笔记内容 */
  async function readNote(filePath: string): Promise<string> {
    if (!activeVault.value) throw new Error('未连接本地 Vault')
    return readFile(activeVault.value.handle, filePath)
  }

  /** 保存笔记内容 */
  async function saveNote(filePath: string, content: string): Promise<void> {
    if (!activeVault.value) throw new Error('未连接本地 Vault')
    await writeFile(activeVault.value.handle, filePath, content)

    // 更新本地缓存
    const idx = notes.value.findIndex((n) => n.path === filePath)
    if (idx !== -1) {
      notes.value[idx].content = content
      notes.value[idx].lastModified = Date.now()
    }
  }

  /** 创建新笔记 */
  async function createNewNote(
    title: string,
    content: string = '',
    folderPath: string = ''
  ): Promise<LocalNote> {
    if (!activeVault.value) throw new Error('未连接本地 Vault')
    const note = await createNote(activeVault.value.handle, title, content, folderPath)
    notes.value.unshift(note)
    return note
  }

  /** 删除笔记 */
  async function deleteNote(filePath: string): Promise<void> {
    if (!activeVault.value) throw new Error('未连接本地 Vault')
    await deleteFile(activeVault.value.handle, filePath)
    notes.value = notes.value.filter((n) => n.path !== filePath)
  }

  /** 重新验证当前 Vault 的权限 */
  async function reconnect(): Promise<boolean> {
    if (!activeVault.value) return false
    const permitted = await verifyPermission(activeVault.value.handle)
    activeVault.value.connected = permitted
    if (permitted) {
      error.value = null
      await loadNotes()
    }
    return permitted
  }

  /** 持久化 vault 列表到 localStorage */
  function persistVaultList() {
    const list = vaults.value.map((v) => ({ id: v.id, name: v.name }))
    localStorage.setItem('local-vaults', JSON.stringify(list))
  }

  return {
    vaults,
    activeVaultId,
    activeVault,
    notes,
    loading,
    error,
    isConnected,
    supported,
    init,
    addVault,
    switchVault,
    disconnectVault,
    removeVault,
    loadNotes,
    readNote,
    saveNote,
    createNewNote,
    deleteNote,
    reconnect,
  }
})
