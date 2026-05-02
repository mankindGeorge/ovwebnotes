<template>
  <div class="flex flex-col h-full">
    <!-- 编辑器工具栏 -->
    <div
      v-if="!readonly"
      class="flex items-center justify-between px-4 py-2 border-b border-warm-border dark:border-vault-border"
    >
      <input
        v-if="titleEditable"
        v-model="noteTitle"
        class="text-lg font-semibold bg-transparent border-none outline-none text-warm-text dark:text-vault-text flex-1"
        placeholder="输入标题..."
        @blur="handleTitleBlur"
        @keydown.enter="handleTitleBlur"
      />
      <div class="flex items-center gap-2">
        <button
          v-if="showDeleteButton"
          class="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          title="删除笔记"
          @click="handleDelete"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <SyncButton />
      </div>
    </div>

    <!-- Vditor 编辑器容器 -->
    <div ref="vditorRef" class="flex-1 overflow-hidden" />

    <!-- 空状态 -->
    <div
      v-if="!modelValue && readonly"
      class="flex-1 flex items-center justify-center text-warm-text-muted dark:text-vault-muted"
    >
      <div class="text-center">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <p class="text-sm">选择或创建一篇笔记开始编辑</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { useAppStore } from '@/stores/app'
import SyncButton from '@/components/git/SyncButton.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    readonly?: boolean
    titleEditable?: boolean
    noteTitle?: string
    showDeleteButton?: boolean
  }>(),
  {
    modelValue: '',
    readonly: false,
    titleEditable: false,
    noteTitle: '',
    showDeleteButton: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:noteTitle': [value: string]
  'delete': []
  'navigate': [path: string]
}>()

const appStore = useAppStore()
const vditorRef = ref<HTMLElement>()
let vditorInstance: Vditor | null = null
let vditorReady = false

const noteTitle = ref(props.noteTitle)

watch(
  () => props.noteTitle,
  (val) => {
    noteTitle.value = val
  }
)

function handleTitleBlur() {
  emit('update:noteTitle', noteTitle.value)
}

function handleDelete() {
  emit('delete')
}

function initVditor() {
  if (!vditorRef.value || vditorInstance) return

  const isDark = appStore.isDark

  vditorInstance = new Vditor(vditorRef.value, {
    height: '100%',
    mode: 'wysiwyg',
    theme: isDark ? 'dark' : 'classic',
    icon: 'ant',
    customWysiwygToolbar: () => {},
    toolbar: [
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'line',
      'quote',
      'list',
      'ordered-list',
      'check',
      '|',
      'code',
      'inline-code',
      'table',
      'link',
      'upload',
      '|',
      'undo',
      'redo',
      '|',
      'edit-mode',
      'outline',
      'preview',
      {
        name: 'more',
        toolbar: [
          'both',
          'code-theme',
          'content-theme',
          'export',
          'fullscreen',
        ],
      },
    ],
    toolbarConfig: {
      pin: true,
      hide: props.readonly,
    },
    counter: {
      enable: true,
    },
    cache: {
      enable: false,
    },
    preview: {
      theme: {
        current: isDark ? 'dark' : 'light',
      },
      markdown: {
        toc: true,
        mark: true,
        footnotes: true,
      },
      hljs: {
        style: isDark ? 'dracula' : 'github',
        lineNumber: true,
      },
      math: {
        engine: 'KaTeX',
      },
    },
    upload: {
      accept: 'image/*',
      url: `${import.meta.env.VITE_API_BASE_URL}/files/upload`,
      fieldName: 'file',
      success: (_editor: any, msg: string) => {
        // 上传成功后自动插入图片
        try {
          const data = JSON.parse(msg)
          if (data.code === 0 && data.data?.url) {
            vditorInstance?.insertValue(`![${data.data.filename}](${data.data.url})`)
          }
        } catch {
          console.error('解析上传响应失败')
        }
      },
    },
    placeholder: '开始写作...',
    input: (value: string) => {
      if (!isInternalUpdate && vditorReady) {
        emit('update:modelValue', value)
      }
    },
    after: () => {
      vditorReady = true
      if (props.modelValue) {
        vditorInstance?.setValue(props.modelValue)
      }
      // 添加内部链接点击事件
      setupLinkHandler()
    },
  })
}

// 处理内部链接点击
function setupLinkHandler() {
  if (!vditorRef.value) return
  
  // 使用捕获阶段确保在 Vditor 处理之前拦截
  vditorRef.value.addEventListener('click', handleLinkClick, true)
}

function handleLinkClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const link = target.closest('a')
  
  if (!link) return
  
  const href = link.getAttribute('href')
  if (!href) return
  
  // 检查是否是内部 .md 文件链接（排除 http/https 外部链接）
  if ((href.endsWith('.md') || href.includes('.md#')) && !href.startsWith('http')) {
    // 阻止所有默认行为
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    
    // 提取文件路径（去掉 # 锚点）
    const [path, anchor] = href.split('#')
    emit('navigate', path)
    
    // 如果有锚点，滚动到对应位置
    if (anchor && vditorInstance) {
      setTimeout(() => {
        const element = vditorRef.value?.querySelector(`#${anchor}`)
        element?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }
}

let isInternalUpdate = false

// 监听外部 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (!vditorReady || !vditorInstance) return
    if (vditorInstance.getValue() !== newVal) {
      isInternalUpdate = true
      vditorInstance.setValue(newVal || '')
      nextTick(() => { isInternalUpdate = false })
    }
  }
)

// 监听暗黑模式变化
watch(
  () => appStore.isDark,
  (isDark) => {
    if (vditorInstance) {
      const theme = isDark ? 'dark' : 'classic'
      vditorInstance.setTheme(theme, isDark ? 'dark' : 'light', isDark ? 'dracula' : 'github')
    }
  }
)

onMounted(() => {
  nextTick(() => {
    if (props.modelValue || !props.readonly) {
      initVditor()
    }
  })
})

onBeforeUnmount(() => {
  vditorReady = false
  // 移除链接点击事件监听
  if (vditorRef.value) {
    vditorRef.value.removeEventListener('click', handleLinkClick)
  }
  if (vditorInstance) {
    try {
      vditorInstance.destroy()
    } catch {
      // 忽略销毁时的错误
    }
    vditorInstance = null
  }
})
</script>

<style>
/* Vditor 暗黑模式适配 */
.dark .vditor {
  --border-color: #3b3b5c;
  --toolbar-background-color: #282840;
  --panel-background-color: #282840;
  --textarea-background-color: #1e1e2e;
}

.vditor {
  border: none !important;
  border-radius: 0 !important;
}

.vditor-toolbar {
  border-bottom: 1px solid #e5e7eb !important;
  padding: 4px 8px !important;
}

.dark .vditor-toolbar {
  border-bottom-color: #3b3b5c !important;
}

/* Obsidian 双链样式 */
.vditor-ir span[data-type="link"] .vditor-ir__marker--link {
  color: #8b5cf6;
}

/* 高亮标记 */
.vditor-reset mark {
  background-color: #fde68a;
  padding: 0.1rem 0.2rem;
  border-radius: 0.125rem;
}

.dark .vditor-reset mark {
  background-color: #92400e;
  color: #fef3c7;
}
</style>
