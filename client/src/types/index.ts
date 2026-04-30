/** 笔记实体 */
export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  is_cloud: boolean
  folderPath: string
  filePath: string
  createdAt: string
  updatedAt: string
}

/** 创建笔记 DTO */
export interface CreateNoteDTO {
  title: string
  content: string
  tags?: string[]
  is_cloud?: boolean
  folderPath?: string
}

/** 更新笔记 DTO */
export interface UpdateNoteDTO {
  title?: string
  content?: string
  tags?: string[]
  is_cloud?: boolean
  folderPath?: string
}

/** Git 状态 */
export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  modified: number
  untracked: number
  lastSync: string | null
  isClean: boolean
}

/** 同步结果 */
export interface SyncResult {
  success: boolean
  message: string
  timestamp: string
}

/** 文件上传结果 */
export interface UploadResult {
  url: string
  filename: string
  size: number
}

/** 分页参数 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** 通用 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** 文件夹节点 */
export interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
  noteCount: number
}

/** 存储模式 */
export type StorageMode = 'vault' | 'cloud'

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 搜索参数 */
export interface SearchParams {
  keyword?: string
  tags?: string[]
  folderPath?: string
  page?: number
  pageSize?: number
}
