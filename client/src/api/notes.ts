import apiClient from './index'
import type {
  Note,
  CreateNoteDTO,
  UpdateNoteDTO,
  ApiResponse,
  SearchParams,
} from '@/types'

/** 获取笔记的唯一标识符：云端用 id，本地用 filePath */
export function getNoteIdentifier(note: Note): string {
  return (note.is_cloud ?? false) ? note.id : note.filePath
}

/** 获取笔记列表 */
export function getNotes(params?: SearchParams & { is_cloud?: boolean }) {
  return apiClient.get<ApiResponse<{ notes: Note[]; total: number }>>('/notes', {
    params: { ...params },
  })
}

/** 获取单个笔记 */
export function getNoteById(identifier: string, isCloud: boolean) {
  return apiClient.get<ApiResponse<Note>>(`/notes/${encodeURIComponent(identifier)}`, {
    params: { is_cloud: isCloud },
  })
}

/** 创建笔记 */
export function createNote(data: CreateNoteDTO) {
  return apiClient.post<ApiResponse<Note>>('/notes', data)
}

/** 更新笔记 */
export function updateNote(identifier: string, data: UpdateNoteDTO, isCloud: boolean) {
  return apiClient.put<ApiResponse<Note>>(`/notes/${encodeURIComponent(identifier)}`, {
    ...data,
    is_cloud: isCloud,
  })
}

/** 删除笔记 */
export function deleteNote(identifier: string, isCloud: boolean) {
  return apiClient.delete<ApiResponse<void>>(`/notes/${encodeURIComponent(identifier)}`, {
    params: { is_cloud: isCloud },
  })
}

/** 搜索笔记 */
export function searchNotes(query: string, isCloud = true) {
  return apiClient.get<ApiResponse<Note[]>>('/notes/search', {
    params: { q: query, is_cloud: isCloud },
  })
}

/** 下载：云端笔记 → 本地 Vault */
export function exportNote(id: string) {
  return apiClient.post<ApiResponse<Note>>(`/notes/${id}/export`)
}

/** 上传：本地笔记 → 云端数据库 */
export function importNote(filePath: string, data?: { title: string; content: string; tags: string[]; folderPath: string; filePath?: string }) {
  return apiClient.post<ApiResponse<Note>>(`/notes/${encodeURIComponent(filePath)}/import`, data)
}

/** 获取所有标签 */
export function getAllTags() {
  return apiClient.get<ApiResponse<string[]>>('/notes/tags')
}
