<template>
  <AppLayout>
    <div class="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-vault-text mb-6">
        设置
      </h1>

      <!-- 外观设置 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-vault-text mb-4">外观</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-vault-surface">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-vault-text">主题模式</p>
              <p class="text-xs text-gray-500 dark:text-vault-muted">选择应用的配色方案</p>
            </div>
            <div class="flex items-center gap-1 bg-gray-200 dark:bg-vault-highlight rounded-lg p-1">
              <button
                v-for="mode in themeModes"
                :key="mode.value"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  appStore.themeMode === mode.value
                    ? 'bg-white dark:bg-vault-surface text-gray-900 dark:text-vault-text shadow-sm'
                    : 'text-gray-500 dark:text-vault-muted hover:text-gray-700 dark:hover:text-vault-text',
                ]"
                @click="appStore.setThemeMode(mode.value)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 存储设置 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-vault-text mb-4">存储</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-vault-surface">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-vault-text">默认存储模式</p>
              <p class="text-xs text-gray-500 dark:text-vault-muted">Vault: 本地文件系统 | Cloud: 云端数据库</p>
            </div>
            <StorageToggle />
          </div>
        </div>
      </section>

      <!-- Vault 管理 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-vault-text mb-4">Vault 管理</h2>
        <div class="space-y-4">
          <!-- 本地目录（File System API） -->
          <div class="p-4 rounded-lg bg-gray-50 dark:bg-vault-surface">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-vault-text">本地目录</p>
                <p class="text-xs text-gray-500 dark:text-vault-muted">选择一个本地文件夹，笔记将以 .md 文件保存在你的电脑上</p>
              </div>
              <button
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-colors"
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
                    : 'border-gray-200 dark:border-vault-border hover:border-gray-300',
                ]"
              >
                <div :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  vault.id === localVaultStore.activeVaultId ? 'bg-obsidian-100 dark:bg-obsidian-800' : 'bg-gray-100 dark:bg-vault-highlight',
                ]">
                  <svg class="w-4 h-4" :class="vault.id === localVaultStore.activeVaultId ? 'text-obsidian-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-gray-900 dark:text-vault-text truncate">{{ vault.name }}</p>
                    <span v-if="vault.id === localVaultStore.activeVaultId" class="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full bg-obsidian-100 dark:bg-obsidian-800 text-obsidian-600 dark:text-obsidian-400">
                      使用中
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 font-mono">本地文件系统</p>
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
            <div v-else class="text-center py-4 text-gray-400 text-sm">
              暂未连接本地目录，点击上方按钮选择
            </div>

            <p v-if="!localVaultStore.supported" class="mt-2 text-xs text-red-500">
              ⚠️ 当前浏览器不支持本地文件访问，请使用 Chrome 86+ 或 Edge 86+
            </p>
          </div>
        </div>
      </section>

      <!-- Git 设置 -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-vault-text mb-4">版本控制</h2>
        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-gray-50 dark:bg-vault-surface">
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-900 dark:text-vault-text">远程仓库地址</p>
              <p class="text-xs text-gray-500 dark:text-vault-muted">绑定 GitHub / GitLab 等远程仓库</p>
            </div>
            <div class="flex items-center gap-2">
              <input v-model="remoteUrl" type="text" placeholder="https://github.com/username/repo.git"
                class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-vault-border bg-white dark:bg-vault-surface text-gray-900 dark:text-vault-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-obsidian-500 transition-colors"
                :disabled="savingRemote" />
              <button class="px-3 py-2 text-sm font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-colors disabled:opacity-50"
                :disabled="savingRemote || !remoteUrl.trim()" @click="handleSaveRemote">
                {{ savingRemote ? '保存中...' : '保存' }}
              </button>
            </div>
            <p v-if="remoteMessage" class="mt-2 text-xs" :class="remoteSuccess ? 'text-green-600' : 'text-red-600'">{{ remoteMessage }}</p>
          </div>

          <div class="p-4 rounded-lg bg-gray-50 dark:bg-vault-surface">
            <div class="mb-3">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 dark:text-vault-text">访问令牌</p>
                <span v-if="tokenConfigured" class="px-1.5 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">已配置</span>
                <span v-else class="px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">未配置</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-vault-muted mt-0.5">用于推送/拉取私有仓库</p>
            </div>
            <div class="flex items-center gap-2">
              <input v-model="tokenInput" :type="showToken ? 'text' : 'password'" placeholder="ghp_xxxxxxxxxxxx"
                class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-vault-border bg-white dark:bg-vault-surface text-gray-900 dark:text-vault-text font-mono"
                :disabled="savingToken" />
              <button class="p-2 rounded-lg border border-gray-200 dark:border-vault-border text-gray-500 hover:bg-gray-100 dark:hover:bg-vault-highlight transition-colors"
                @click="showToken = !showToken">
                <svg v-if="!showToken" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              </button>
              <button class="px-3 py-2 text-sm font-medium rounded-lg bg-obsidian-600 hover:bg-obsidian-700 text-white transition-colors disabled:opacity-50"
                :disabled="savingToken || !tokenInput.trim()" @click="handleSaveToken">
                {{ savingToken ? '保存中...' : '保存' }}
              </button>
              <button v-if="tokenConfigured" class="px-3 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                :disabled="savingToken" @click="handleRemoveToken">
                删除
              </button>
            </div>
            <p v-if="tokenMessage" class="mt-2 text-xs" :class="tokenSuccess ? 'text-green-600' : 'text-red-600'">{{ tokenMessage }}</p>
            <p class="mt-2 text-xs text-gray-400">💡 GitHub: Settings → Developer settings → Personal access tokens</p>
          </div>

          <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-vault-surface">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-vault-text">Git 同步</p>
              <p class="text-xs text-gray-500 dark:text-vault-muted">手动触发与远程仓库的同步</p>
            </div>
            <SyncButton />
          </div>
        </div>
      </section>

      <!-- 关于 -->
      <section>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-vault-text mb-4">关于</h2>
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-vault-surface">
          <p class="text-sm text-gray-600 dark:text-vault-muted">Ovwebnotes v1.0.0</p>
          <p class="text-xs text-gray-400 mt-1">基于 Vue 3 + Vditor + Tailwind CSS 构建</p>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLocalVaultStore } from '@/stores/localVault'
import AppLayout from '@/components/layout/AppLayout.vue'
import StorageToggle from '@/components/common/StorageToggle.vue'
import SyncButton from '@/components/git/SyncButton.vue'
import * as gitApi from '@/api/git'

const appStore = useAppStore()
const localVaultStore = useLocalVaultStore()

const themeModes = [
  { value: 'light' as const, label: '浅色' },
  { value: 'dark' as const, label: '深色' },
  { value: 'system' as const, label: '系统' },
]

// 远程仓库
const remoteUrl = ref('')
const savingRemote = ref(false)
const remoteMessage = ref('')
const remoteSuccess = ref(false)

// Token
const tokenInput = ref('')
const showToken = ref(false)
const savingToken = ref(false)
const tokenConfigured = ref(false)
const tokenMessage = ref('')
const tokenSuccess = ref(false)

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

async function handleSaveRemote() {
  if (!remoteUrl.value.trim()) return
  savingRemote.value = true
  remoteMessage.value = ''
  try {
    const res = await gitApi.setRemoteUrl(remoteUrl.value.trim())
    remoteSuccess.value = res.data.data?.success ?? true
    remoteMessage.value = res.data.data?.message || '保存成功'
  } catch (err: any) {
    remoteSuccess.value = false
    remoteMessage.value = err.response?.data?.message || '保存失败'
  } finally {
    savingRemote.value = false
  }
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

onMounted(async () => {
  await Promise.allSettled([
    gitApi.getRemoteUrl().then((res) => { remoteUrl.value = res.data.data?.url || '' }).catch(() => {}),
    gitApi.hasToken().then((res) => { tokenConfigured.value = res.data.data?.hasToken ?? false }).catch(() => {}),
  ])
})
</script>
