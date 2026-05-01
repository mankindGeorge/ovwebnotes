import axios from 'axios'

const API_BASE = '/api'

// 创建axios实例，配置超时时间
const apiClient = axios.create({
  timeout: 300000, // 5分钟超时，支持大型仓库克隆
})

export interface RemoteRepository {
  id: string
  name: string
  url: string
  branch: string
  folder: string
  isActive: boolean
  lastSync: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    notes: number
  }
}

export interface CreateRepositoryDto {
  name: string
  url: string
  branch?: string
  folder?: string
}

export interface UpdateRepositoryDto {
  name?: string
  url?: string
  branch?: string
  isActive?: boolean
}

export interface MoveFileDto {
  sourcePath: string
  targetFolder: string
  repositoryId?: string
}

export const repositoriesApi = {
  async getAll(): Promise<RemoteRepository[]> {
    const response = await apiClient.get(`${API_BASE}/repositories`)
    return response.data.data || []
  },

  async getById(id: string): Promise<RemoteRepository> {
    const response = await apiClient.get(`${API_BASE}/repositories/${id}`)
    return response.data.data
  },

  async create(data: CreateRepositoryDto): Promise<RemoteRepository> {
    const response = await apiClient.post(`${API_BASE}/repositories`, data)
    return response.data.data
  },

  async update(id: string, data: UpdateRepositoryDto): Promise<RemoteRepository> {
    const response = await apiClient.put(`${API_BASE}/repositories/${id}`, data)
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE}/repositories/${id}`)
  },

  async activate(id: string): Promise<RemoteRepository> {
    const response = await apiClient.post(`${API_BASE}/repositories/${id}/activate`)
    return response.data.data
  },

  async sync(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${API_BASE}/repositories/${id}/sync`)
    return response.data.data
  },
}

export const filesApi = {
  async move(data: MoveFileDto): Promise<{ success: boolean; newPath: string }> {
    const response = await axios.post(`${API_BASE}/files/move`, data)
    return response.data
  },
}
