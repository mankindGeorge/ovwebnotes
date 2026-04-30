/**
 * 本地文件系统工具
 * 使用浏览器 File System Access API 直接读写用户本地文件
 * 
 * 限制：
 * - 仅 Chrome 86+ / Edge 86+ 支持
 * - 首次使用需要用户手动授权目录
 * - 刷新页面后需要重新验证权限（但不需要重新选择目录）
 */

export interface LocalNote {
  name: string        // 文件名，如 "笔记.md"
  path: string        // 相对路径，如 "folder/笔记.md"
  content: string
  lastModified: number
}

/** 检测浏览器是否支持 File System Access API */
export function isFileSystemSupported(): boolean {
  return 'showDirectoryPicker' in window
}

/** 请求用户选择一个目录 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemSupported()) {
    throw new Error('当前浏览器不支持本地文件系统访问，请使用 Chrome 或 Edge')
  }
  try {
    return await (window as any).showDirectoryPicker({ mode: 'readwrite' })
  } catch (err: any) {
    if (err.name === 'AbortError') return null
    throw err
  }
}

/** 验证目录句柄的读写权限 */
export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite' = 'readwrite'
): Promise<boolean> {
  try {
    if ((await handle.queryPermission({ mode })) === 'granted') return true
    if ((await handle.requestPermission({ mode })) === 'granted') return true
    return false
  } catch {
    return false
  }
}

/** 递归列出目录下所有 .md 文件 */
export async function listMarkdownFiles(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string = ''
): Promise<LocalNote[]> {
  const notes: LocalNote[] = []

  for await (const entry of dirHandle.values()) {
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.kind === 'file' && entry.name.endsWith('.md')) {
      try {
        const file = await (entry as FileSystemFileHandle).getFile()
        const content = await file.text()
        notes.push({
          name: entry.name,
          path: entryPath,
          content,
          lastModified: file.lastModified,
        })
      } catch {
        // 跳过无法读取的文件
      }
    } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
      try {
        const subNotes = await listMarkdownFiles(
          entry as FileSystemDirectoryHandle,
          entryPath
        )
        notes.push(...subNotes)
      } catch {
        // 跳过无法访问的目录
      }
    }
  }

  return notes
}

/** 读取单个文件内容 */
export async function readFile(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<string> {
  const parts = filePath.split('/')
  let currentHandle: FileSystemDirectoryHandle = dirHandle

  for (let i = 0; i < parts.length - 1; i++) {
    currentHandle = await currentHandle.getDirectoryHandle(parts[i])
  }

  const fileName = parts[parts.length - 1]
  const fileHandle = await currentHandle.getFileHandle(fileName)
  const file = await fileHandle.getFile()
  return file.text()
}

/** 写入文件内容（自动创建目录） */
export async function writeFile(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string,
  content: string
): Promise<void> {
  const parts = filePath.split('/')
  let currentHandle: FileSystemDirectoryHandle = dirHandle

  for (let i = 0; i < parts.length - 1; i++) {
    currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true })
  }

  const fileName = parts[parts.length - 1]
  const fileHandle = await currentHandle.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

/** 删除文件 */
export async function deleteFile(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<void> {
  const parts = filePath.split('/')
  let currentHandle: FileSystemDirectoryHandle = dirHandle

  for (let i = 0; i < parts.length - 1; i++) {
    currentHandle = await currentHandle.getDirectoryHandle(parts[i])
  }

  const fileName = parts[parts.length - 1]
  await currentHandle.removeEntry(fileName)
}

/** 创建新笔记 */
export async function createNote(
  dirHandle: FileSystemDirectoryHandle,
  title: string,
  content: string = '',
  folderPath: string = ''
): Promise<LocalNote> {
  const fileName = `${title}.md`
  const filePath = folderPath ? `${folderPath}/${fileName}` : fileName

  await writeFile(dirHandle, filePath, content)

  return {
    name: fileName,
    path: filePath,
    content,
    lastModified: Date.now(),
  }
}

/** 重命名文件（通过创建新文件 + 删除旧文件实现） */
export async function renameFile(
  dirHandle: FileSystemDirectoryHandle,
  oldPath: string,
  newPath: string
): Promise<void> {
  const content = await readFile(dirHandle, oldPath)
  await writeFile(dirHandle, newPath, content)
  await deleteFile(dirHandle, oldPath)
}

/** 获取目录下的一级子目录列表 */
export async function listSubDirectories(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string = ''
): Promise<{ name: string; path: string }[]> {
  const dirs: { name: string; path: string }[] = []

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
      dirs.push({
        name: entry.name,
        path: basePath ? `${basePath}/${entry.name}` : entry.name,
      })
    }
  }

  return dirs.sort((a, b) => a.name.localeCompare(b.name))
}

// ==================== IndexedDB 持久化 ====================

const DB_NAME = 'obsidian-local-vault'
const DB_VERSION = 1
const STORE_NAME = 'handles'

/** 打开 IndexedDB */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** 保存目录句柄到 IndexedDB */
export async function saveDirectoryHandle(
  key: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 从 IndexedDB 读取目录句柄 */
export async function loadDirectoryHandle(
  key: string
): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/** 从 IndexedDB 删除目录句柄 */
export async function removeDirectoryHandle(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
