<template>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg
        class="w-4 h-4 text-warm-text-muted dark:text-vault-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <input
      v-model="keyword"
      type="text"
      placeholder="搜索笔记..."
      class="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-warm-border dark:border-vault-border bg-warm-surface dark:bg-vault-highlight text-warm-text dark:text-vault-text placeholder-warm-text-muted dark:placeholder-vault-muted focus:outline-none focus:ring-2 focus:ring-obsidian-500 dark:focus:ring-obsidian-400 focus:border-transparent transition-colors"
      @input="handleInput"
      @keydown.escape="handleClear"
    />
    <!-- 清除按钮 -->
    <button
      v-if="keyword"
      class="absolute inset-y-0 right-0 pr-3 flex items-center text-warm-text-muted hover:text-warm-text dark:hover:text-vault-text"
      @click="handleClear"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNotesStore } from '@/stores/notes'

const notesStore = useNotesStore()
const keyword = ref(notesStore.searchKeyword)

watch(
  () => notesStore.searchKeyword,
  (val) => {
    keyword.value = val
  }
)

function handleInput() {
  notesStore.searchKeyword = keyword.value
}

function handleClear() {
  keyword.value = ''
  notesStore.searchKeyword = ''
}
</script>
