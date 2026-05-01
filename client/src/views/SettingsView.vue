<template>
  <AppLayout>
    <div class="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto relative">
      <!-- 装饰性渐变 -->
      <div class="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-warm-surface/50 to-transparent dark:from-vault-surface/30 dark:to-transparent pointer-events-none"></div>
      
      <h1 class="text-2xl font-bold text-warm-text dark:text-vault-text mb-6 relative z-10">
        设置
      </h1>

      <!-- 外观设置 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-warm-text dark:text-vault-text mb-4">外观</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div>
              <p class="text-sm font-medium text-warm-text dark:text-vault-text">主题模式</p>
              <p class="text-xs text-warm-text-muted dark:text-vault-muted">选择应用的配色方案</p>
            </div>
            <div class="flex items-center gap-1 bg-warm-hover dark:bg-vault-highlight rounded-lg p-1">
              <button
                v-for="mode in themeModes"
                :key="mode.value"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  appStore.themeMode === mode.value
                    ? 'bg-warm-card dark:bg-vault-surface text-warm-text dark:text-vault-text shadow-sm'
                    : 'text-warm-text-muted dark:text-vault-muted hover:text-warm-text dark:hover:text-vault-text',
                ]"
                @click="appStore.setThemeMode(mode.value)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Git仓库设置 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-warm-text dark:text-vault-text mb-4">Git仓库</h2>
        <div class="space-y-4">
          <!-- GitHub镜像配置 -->
          <div class="p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-medium text-warm-text dark:text-vault-text">GitHub镜像加速</p>
                <p class="text-xs text-warm-text-muted dark:text-vault-muted">使用镜像加速访问GitHub仓库</p>
              </div>
              <button
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  mirrorEnabled ? 'bg-obsidian-600' : 'bg-gray-300 dark:bg-gray-600'
                ]"
                @click="toggleMirror"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    mirrorEnabled ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
            <div v-if="mirrorEnabled" class="mt-3">
              <label class="block text-xs font-medium text-warm-text dark:text-vault-text mb-1">镜像地址</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="mirrorUrl"
                  type="text"
                  placeholder="gh-proxy.com"
                  class="flex-1 px-3 py-2 text-sm rounded-lg border border-warm-border dark:border-vault-border bg-warm-card dark:bg-vault-surface text-warm-text dark:text-vault-text placeholder-warm-text-muted focus:outline-none focus:ring-2 focus:ring-obsidian-500 transition-colors"
                />
                <button
                  class="px-3 py-2 text-sm font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                  @click="saveMirrorConfig"
                >
                  保存
                </button>
              </div>
              <p class="mt-2 text-xs text-warm-text-muted">
                💡 常用镜像: gh-proxy.com, mirror.ghproxy.com, hub.fastgit.xyz
              </p>
            </div>
          </div>

          <!-- 编辑权限设置 -->
          <div class="flex items-center justify-between p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div>
              <p class="text-sm font-medium text-warm-text dark:text-vault-text">允许编辑仓库笔记</p>
              <p class="text-xs text-warm-text-muted dark:text-vault-muted">关闭后，来自Git仓库的笔记将无法编辑</p>
            </div>
            <button
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                appStore.allowEditRepositoryNotes ? 'bg-obsidian-600' : 'bg-gray-300 dark:bg-gray-600'
              ]"
              @click="appStore.setAllowEditRepositoryNotes(!appStore.allowEditRepositoryNotes)"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  appStore.allowEditRepositoryNotes ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>

          <!-- 访问令牌配置 -->
          <div class="p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div class="mb-3">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-warm-text dark:text-vault-text">访问令牌</p>
                <span v-if="tokenConfigured" class="px-1.5 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">已配置</span>
                <span v-else class="px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">未配置</span>
              </div>
              <p class="text-xs text-warm-text-muted dark:text-vault-muted mt-0.5">用于访问私有仓库</p>
            </div>
            <div class="flex items-center gap-2">
              <input v-model="tokenInput" :type="showToken ? 'text' : 'password'" placeholder="ghp_xxxxxxxxxxxx"
                class="flex-1 px-3 py-2 text-sm rounded-lg border border-warm-border dark:border-vault-border bg-warm-card dark:bg-vault-surface text-warm-text dark:text-vault-text font-mono"
                :disabled="savingToken" />
              <button class="p-2 rounded-lg border border-warm-border dark:border-vault-border text-warm-text-muted hover:bg-warm-hover dark:hover:bg-vault-highlight transition-colors"
                @click="showToken = !showToken">
                <svg v-if="!showToken" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              </button>
              <button class="px-3 py-2 text-sm font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                :disabled="savingToken || !tokenInput.trim()" @click="handleSaveToken">
                {{ savingToken ? '保存中...' : '保存' }}
              </button>
              <button v-if="tokenConfigured" class="px-3 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                :disabled="savingToken" @click="handleRemoveToken">
                删除
              </button>
            </div>
            <p v-if="tokenMessage" class="mt-2 text-xs" :class="tokenSuccess ? 'text-green-600' : 'text-red-600'">{{ tokenMessage }}</p>
            <p class="mt-2 text-xs text-warm-text-muted">💡 GitHub: Settings → Developer settings → Personal access tokens</p>
          </div>

          <!-- 远程仓库管理 -->
          <div class="p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-medium text-warm-text dark:text-vault-text">远程仓库</p>
                <p class="text-xs text-warm-text-muted dark:text-vault-muted">每个仓库对应云端的一个文件夹，自动拉取内容</p>
              </div>
              <button
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                @click="showAddRepoModal = true"
              >
                添加仓库
              </button>
            </div>

            <!-- 已添加的仓库列表 -->
            <div v-if="repositories.length > 0" class="space-y-2 mt-4">
              <div
                v-for="repo in repositories"
                :key="repo.id"
                :class="[
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  repo.isActive
                    ? 'border-obsidian-500 bg-obsidian-50 dark:bg-obsidian-900/20'
                    : 'border-warm-border dark:border-vault-border hover:border-warm-active',
                ]"
              >
                <div :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  repo.isActive ? 'bg-obsidian-100 dark:bg-obsidian-800' : 'bg-warm-hover dark:bg-vault-highlight',
                ]">
                  <svg class="w-4 h-4" :class="repo.isActive ? 'text-obsidian-600' : 'text-warm-text-muted'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-warm-text dark:text-vault-text truncate">{{ repo.name }}</p>
                    <span v-if="repo.isActive" class="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full bg-obsidian-100 dark:bg-obsidian-800 text-obsidian-600 dark:text-obsidian-400">
                      使用中
                    </span>
                  </div>
                  <p class="text-xs text-warm-text-muted font-mono truncate">{{ repo.url }}</p>
                  <p class="text-xs text-warm-text-muted">分支: {{ repo.branch }} | 笔记数: {{ repo._count?.notes || 0 }}</p>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    v-if="!repo.isActive"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-obsidian-600 hover:bg-obsidian-100 dark:hover:bg-obsidian-900/30 transition-all duration-200"
                    @click="handleActivateRepo(repo.id)"
                  >
                    激活
                  </button>
                  <button
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    @click="handleSyncRepo(repo.id)"
                  >
                    拉取
                  </button>
                  <button
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    @click="handleDeleteRepo(repo.id)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-warm-text-muted text-sm">
              暂无远程仓库，点击上方按钮添加
            </div>
          </div>
        </div>
      </section>

      <!-- 存储设置 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-warm-text dark:text-vault-text mb-4">存储</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div>
              <p class="text-sm font-medium text-warm-text dark:text-vault-text">默认存储模式</p>
              <p class="text-xs text-warm-text-muted dark:text-vault-muted">Vault: 本地文件系统 | Cloud: 云端数据库</p>
            </div>
            <StorageToggle />
          </div>
        </div>
      </section>

      <!-- Vault 管理 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-warm-text dark:text-vault-text mb-4">Vault 管理</h2>
        <div class="space-y-4">
          <!-- 本地目录（File System API） -->
          <div class="p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-medium text-warm-text dark:text-vault-text">本地目录</p>
                <p class="text-xs text-warm-text-muted dark:text-vault-muted">选择一个本地文件夹，笔记将以 .md 文件保存在你的电脑上</p>
              </div>
              <button
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                @click="handlePickLocalDirectory"
              >
                选择目录
              </button>
            </div>

            <!-- 已连接的本地 Vault 列表 -->
            <div v-if="localVaultStore.vaults.length > 0" class="space-y-2">
              <div
                v-for="vault in localVaultStore.vaults"
                :key="vault.id"
                :class="[
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  vault.id === localVaultStore.activeVaultId
                    ? 'border-obsidian-500 bg-obsidian-50 dark:bg-obsidian-900/20'
                    : 'border-warm-border dark:border-vault-border hover:border-warm-active',
                ]"
              >
                <div :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  vault.id === localVaultStore.activeVaultId ? 'bg-obsidian-100 dark:bg-obsidian-800' : 'bg-warm-hover dark:bg-vault-highlight',
                ]">
                  <svg class="w-4 h-4" :class="vault.id === localVaultStore.activeVaultId ? 'text-obsidian-600' : 'text-warm-text-muted'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-warm-text dark:text-vault-text truncate">{{ vault.name }}</p>
                    <span v-if="vault.id === localVaultStore.activeVaultId" class="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full bg-obsidian-100 dark:bg-obsidian-800 text-obsidian-600 dark:text-obsidian-400">
                      使用中
                    </span>
                  </div>
                  <p class="text-xs text-warm-text-muted font-mono">本地文件系统</p>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    v-if="vault.id !== localVaultStore.activeVaultId"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-obsidian-600 hover:bg-obsidian-100 dark:hover:bg-obsidian-900/30 transition-colors"
                    @click="handleSwitchLocalVault(vault.id)"
                  >
                    切换
                  </button>
                  <button
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    @click="handleRemoveLocalVault(vault.id)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-warm-text-muted text-sm">
              暂未连接本地目录，点击上方按钮选择
            </div>

            <p v-if="!localVaultStore.supported" class="mt-2 text-xs text-red-500">
              ⚠️ 当前浏览器不支持本地文件访问，请使用 Chrome 86+ 或 Edge 86+
            </p>
          </div>
        </div>
      </section>

      <!-- 存储设置 -->
      <section class="mb-8">
        <div class="p-4 rounded-lg bg-warm-surface/80 dark:bg-vault-surface/80 backdrop-blur-sm border border-warm-border-light/50 dark:border-vault-border/50 shadow-sm hover:shadow-md transition-all duration-200">
          <p class="text-sm text-warm-text-secondary dark:text-vault-muted">Ovwebnotes v1.0.0</p>
          <p class="text-xs text-warm-text-muted mt-1">基于 Vue 3 + Vditor + Tailwind CSS 构建</p>
        </div>
      </section>

    </div>
  </AppLayout>

  <!-- 添加仓库模态框 -->
  <div v-if="showAddRepoModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showAddRepoModal = false">
    <div class="bg-warm-card/95 dark:bg-vault-surface/95 backdrop-blur-md rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 border border-warm-border-light/50 dark:border-vault-border/50">
      <h3 class="text-lg font-semibold text-warm-text dark:text-vault-text mb-4">添加远程仓库</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-warm-text dark:text-vault-text mb-1">仓库名称</label>
          <input
            v-model="newRepo.name"
            type="text"
            placeholder="例如: 我的笔记仓库"
            class="w-full px-3 py-2 text-sm rounded-lg border border-warm-border dark:border-vault-border bg-warm-surface dark:bg-vault-surface text-warm-text dark:text-vault-text"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-warm-text dark:text-vault-text mb-1">仓库 URL</label>
          <input
            v-model="newRepo.url"
            type="text"
            placeholder="https://github.com/username/repo.git"
            class="w-full px-3 py-2 text-sm rounded-lg border border-warm-border dark:border-vault-border bg-warm-surface dark:bg-vault-surface text-warm-text dark:text-vault-text font-mono"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-warm-text dark:text-vault-text mb-1">分支</label>
          <input
            v-model="newRepo.branch"
            type="text"
            placeholder="main"
            class="w-full px-3 py-2 text-sm rounded-lg border border-warm-border dark:border-vault-border bg-warm-surface dark:bg-vault-surface text-warm-text dark:text-vault-text"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 mt-6">
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg border border-warm-border dark:border-vault-border text-warm-text dark:text-vault-text hover:bg-warm-hover dark:hover:bg-vault-highlight transition-colors"
          @click="showAddRepoModal = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
          :disabled="!newRepo.name || !newRepo.url || addingRepo"
          @click="handleAddRepo"
        >
          {{ addingRepo ? '添加中...' : '添加' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLocalVaultStore } from '@/stores/localVault'
import AppLayout from '@/components/layout/AppLayout.vue'
import StorageToggle from '@/components/common/StorageToggle.vue'
import * as gitApi from '@/api/git'
import * as repositoriesApi from '@/api/repositories'
import type { RemoteRepository } from '@/api/repositories'

const appStore = useAppStore()
const localVaultStore = useLocalVaultStore()

// GitHub镜像配置
const mirrorEnabled = ref(false)
const mirrorUrl = ref('gh-proxy.com')

const themeModes = [
  { value: 'light' as const, label: '浅色' },
  { value: 'dark' as const, label: '深色' },
  { value: 'system' as const, label: '系统' },
]

// Token
const tokenInput = ref('')
const showToken = ref(false)
const savingToken = ref(false)
const tokenConfigured = ref(false)
const tokenMessage = ref('')
const tokenSuccess = ref(false)

// 仓库管理
const repositories = ref<RemoteRepository[]>([])
const showAddRepoModal = ref(false)
const addingRepo = ref(false)
const newRepo = ref({
  name: '',
  url: '',
  branch: 'main',
})

// ==================== 本地 Vault 操作 ====================

async function handlePickLocalDirectory() {
  try {
    const vault = await localVaultStore.addVault()
    if (vault) {
      await localVaultStore.switchVault(vault.id)
    }
  } catch (err: any) {
    alert(`选择目录失败: ${err.message || '当前浏览器不支持本地文件访问，请使用 Chrome 或 Edge 并通过 https:// 或 localhost 访问'}`)
  }
}

async function handleSwitchLocalVault(id: string) {
  await localVaultStore.switchVault(id)
}

async function handleRemoveLocalVault(id: string) {
  if (!confirm('确定删除此本地目录连接？')) return
  await localVaultStore.removeVault(id)
}

async function handleSaveToken() {
  if (!tokenInput.value.trim()) return
  savingToken.value = true
  tokenMessage.value = ''
  try {
    const res = await gitApi.saveGitToken(tokenInput.value.trim())
    tokenSuccess.value = res.data.data?.success ?? true
    tokenMessage.value = res.data.data?.message || 'Token 已保存'
    tokenConfigured.value = true
    tokenInput.value = ''
  } catch (err: any) {
    tokenSuccess.value = false
    tokenMessage.value = err.response?.data?.message || '保存失败'
  } finally {
    savingToken.value = false
  }
}

async function handleRemoveToken() {
  savingToken.value = true
  tokenMessage.value = ''
  try {
    const res = await gitApi.removeGitToken()
    tokenSuccess.value = res.data.data?.success ?? true
    tokenMessage.value = res.data.data?.message || 'Token 已删除'
    tokenConfigured.value = false
  } catch (err: any) {
    tokenSuccess.value = false
    tokenMessage.value = err.response?.data?.message || '删除失败'
  } finally {
    savingToken.value = false
  }
}

// ==================== 仓库管理操作 ====================

async function loadRepositories() {
  try {
    repositories.value = await repositoriesApi.repositoriesApi.getAll()
  } catch (err) {
    console.error('加载仓库列表失败:', err)
  }
}

async function handleAddRepo() {
  if (!newRepo.value.name || !newRepo.value.url) return
  
  addingRepo.value = true
  try {
    await repositoriesApi.repositoriesApi.create({
      name: newRepo.value.name,
      url: newRepo.value.url,
      branch: newRepo.value.branch || 'main',
    })
    
    await loadRepositories()
    showAddRepoModal.value = false
    newRepo.value = { name: '', url: '', branch: 'main' }
    alert('仓库添加成功！')
  } catch (err: any) {
    console.error('添加仓库失败:', err)
    
    let errorMessage = '添加仓库失败'
    
    // 检查是否是网络超时
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接或稍后重试'
    }
    // 检查是否是504网关超时
    else if (err.response?.status === 504) {
      errorMessage = '服务器响应超时，可能是正在克隆大型仓库，请稍后刷新页面查看'
    }
    // 检查是否是认证相关错误
    else if (err.response?.status === 401 || err.response?.status === 403) {
      errorMessage = '访问被拒绝，请检查仓库权限或配置访问令牌'
    }
    // 检查后端返回的具体错误信息
    else if (err.response?.data?.message) {
      const backendMessage = err.response.data.message
      
      // 认证相关
      if (backendMessage.includes('认证') || backendMessage.includes('token') || backendMessage.includes('令牌')) {
        errorMessage = backendMessage
      }
      // 仓库不存在
      else if (backendMessage.includes('not found') || backendMessage.includes('不存在')) {
        errorMessage = '仓库不存在，请检查仓库URL是否正确'
      }
      // 其他后端错误
      else {
        errorMessage = backendMessage
      }
    }
    // 网络错误
    else if (err.message === 'Network Error') {
      errorMessage = '网络连接失败，请检查网络设置'
    }
    // 其他错误
    else if (err.message) {
      errorMessage = err.message
    }
    
    alert(errorMessage)
  } finally {
    addingRepo.value = false
  }
}

async function handleActivateRepo(id: string) {
  try {
    await repositoriesApi.repositoriesApi.activate(id)
    await loadRepositories()
  } catch (err: any) {
    alert(`激活仓库失败: ${err.response?.data?.message || err.message}`)
  }
}

async function handleSyncRepo(id: string) {
  try {
    const result = await repositoriesApi.repositoriesApi.sync(id)
    alert(result.message)
    await loadRepositories()
  } catch (err: any) {
    alert(`同步仓库失败: ${err.response?.data?.message || err.message}`)
  }
}

async function handleDeleteRepo(id: string) {
  if (!confirm('确定删除此仓库？相关笔记不会被删除。')) return
  
  try {
    await repositoriesApi.repositoriesApi.delete(id)
    await loadRepositories()
  } catch (err: any) {
    alert(`删除仓库失败: ${err.response?.data?.message || err.message}`)
  }
}

// GitHub镜像配置
function toggleMirror() {
  mirrorEnabled.value = !mirrorEnabled.value
  saveMirrorConfig()
}

async function saveMirrorConfig() {
  try {
    await gitApi.saveMirrorConfig(mirrorEnabled.value, mirrorUrl.value)
    localStorage.setItem('github-mirror-enabled', String(mirrorEnabled.value))
    localStorage.setItem('github-mirror-url', mirrorUrl.value)
    alert('镜像配置已保存')
  } catch (err) {
    console.error('保存镜像配置失败:', err)
    alert('保存镜像配置失败')
  }
}

async function loadMirrorConfig() {
  try {
    const res = await gitApi.getMirrorConfig()
    const config = res.data.data
    mirrorEnabled.value = config.enabled
    mirrorUrl.value = config.url
  } catch (err) {
    console.error('加载镜像配置失败:', err)
    // 如果API失败，从localStorage加载
    const enabled = localStorage.getItem('github-mirror-enabled')
    const url = localStorage.getItem('github-mirror-url')
    
    if (enabled !== null) {
      mirrorEnabled.value = enabled === 'true'
    }
    if (url) {
      mirrorUrl.value = url
    }
  }
}

onMounted(async () => {
  await Promise.allSettled([
    gitApi.hasToken().then((res) => { tokenConfigured.value = res.data.data?.hasToken ?? false }).catch(() => {}),
    loadRepositories(),
    loadMirrorConfig(),
  ])
})
</script>
