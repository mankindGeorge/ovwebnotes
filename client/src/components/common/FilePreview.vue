<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70" @click.self="$emit('close')">
    <div class="relative max-w-[90vw] max-h-[90vh] bg-white dark:bg-vault-surface rounded-lg shadow-xl overflow-hidden">
      <!-- 关闭按钮 -->
      <button
        class="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        @click="$emit('close')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- 文件名 -->
      <div class="absolute top-2 left-2 z-10 px-3 py-1 rounded bg-black/50 text-white text-sm truncate max-w-[60%]">
        {{ fileName }}
      </div>

      <!-- 预览内容 -->
      <div class="w-full h-full flex items-center justify-center p-4">
        <!-- 图片预览 -->
        <img
          v-if="isImage"
          :src="fileUrl"
          :alt="fileName"
          class="max-w-full max-h-[85vh] object-contain"
        />

        <!-- 视频预览 -->
        <video
          v-else-if="isVideo"
          :src="fileUrl"
          controls
          class="max-w-full max-h-[85vh]"
        >
          您的浏览器不支持视频播放
        </video>

        <!-- 音频预览 -->
        <div v-else-if="isAudio" class="flex flex-col items-center gap-4 p-8">
          <div class="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <audio :src="fileUrl" controls class="w-80">
            您的浏览器不支持音频播放
          </audio>
        </div>

        <!-- PDF 预览 -->
        <iframe
          v-else-if="isPdf"
          :src="fileUrl"
          class="w-[80vw] h-[85vh] border-0"
        />

        <!-- 代码/文本预览 -->
        <div v-else-if="isText" class="w-[80vw] h-[85vh] overflow-auto">
          <pre v-if="textContent" class="p-4 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto whitespace-pre-wrap">{{ textContent }}</pre>
          <div v-else class="flex items-center justify-center h-full">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        </div>

        <!-- Office 文档 - 使用 Google Docs Viewer 或 Office Online -->
        <iframe
          v-else-if="isOffice"
          :src="officeViewerUrl"
          class="w-[80vw] h-[85vh] border-0"
        />

        <!-- 不支持的格式 -->
        <div v-else class="flex flex-col items-center gap-4 p-8">
          <svg class="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400">此文件格式不支持预览</p>
          <a
            :href="fileUrl"
            :download="fileName"
            class="px-4 py-2 bg-obsidian-600 text-white rounded-lg hover:bg-obsidian-700 transition-colors"
          >
            下载文件
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'

const props = defineProps<{
  fileUrl: string
  fileName: string
  fileType?: string
}>()

defineEmits<{
  close: []
}>()

const textContent = ref<string>('')

const extension = computed(() => {
  const ext = props.fileName.split('.').pop()?.toLowerCase() || ''
  return ext
})

const isImage = computed(() => {
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'tif', 'ico'].includes(extension.value)
})

const isVideo = computed(() => {
  return ['mp4', 'webm', 'ogv', 'avi', 'mov'].includes(extension.value)
})

const isAudio = computed(() => {
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension.value)
})

const isPdf = computed(() => {
  return extension.value === 'pdf'
})

const isText = computed(() => {
  return ['txt', 'md', 'json', 'xml', 'csv', 'html', 'css', 'js', 'ts', 'py', 'sh', 'vue', 'jsx', 'tsx'].includes(extension.value)
})

const isOffice = computed(() => {
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension.value)
})

const officeViewerUrl = computed(() => {
  // 使用 Office Online Viewer
  const encodedUrl = encodeURIComponent(props.fileUrl)
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`
})

// 加载文本内容
async function loadTextContent() {
  if (!isText.value) return
  
  try {
    const response = await fetch(props.fileUrl)
    textContent.value = await response.text()
  } catch (error) {
    textContent.value = '无法加载文件内容'
  }
}

onMounted(() => {
  loadTextContent()
})

watch(() => props.fileUrl, () => {
  loadTextContent()
})
</script>
