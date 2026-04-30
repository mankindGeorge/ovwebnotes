import apiClient from './index'
import type { ApiResponse, GitStatus, SyncResult } from '@/types'

/** 获取 Git 状态 */
export function getGitStatus() {
  return apiClient.get<ApiResponse<GitStatus>>('/git/status')
}

/** 强制同步 */
export function forceSync() {
  return apiClient.post<ApiResponse<SyncResult>>('/git/sync')
}

/** 手动触发自动同步 */
export function autoSync() {
  return apiClient.post<ApiResponse<SyncResult>>('/git/auto-sync')
}

/** 获取远程仓库地址 */
export function getRemoteUrl() {
  return apiClient.get<ApiResponse<{ url: string | null }>>('/git/remote')
}

/** 设置远程仓库地址 */
export function setRemoteUrl(url: string) {
  return apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/git/remote', { url })
}

/** 检查是否已配置 Token */
export function hasToken() {
  return apiClient.get<ApiResponse<{ hasToken: boolean }>>('/git/token')
}

/** 保存 Git Token */
export function saveGitToken(token: string) {
  return apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/git/token', { token })
}

/** 删除 Git Token */
export function removeGitToken() {
  return apiClient.delete<ApiResponse<{ success: boolean; message: string }>>('/git/token')
}

/** 初始化 Git 仓库 */
export function initGitRepo() {
  return apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/git/init')
}
