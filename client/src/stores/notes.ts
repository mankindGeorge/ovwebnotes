import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Note, CreateNoteDTO, UpdateNoteDTO, SearchParams } from '@/types'
import * as notesApi from '@/api/notes'
import { getNoteIdentifier } from '@/api/notes'

export const useNotesStore = defineStore('notes', () => {
  // State
  const notes = ref<Note[]>([])
  const currentNote = ref<Note | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchKeyword = ref('')
  const selectedTags = ref<string[]>([])
  const selectedFolder = ref<string>('')
  const allTags = ref<string[]>([])

  // Getters
  const filteredNotes = computed(() => {
    let result = notes.value

    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
      )
    }

    if (selectedTags.value.length > 0) {
      result = result.filter((note) =>
        selectedTags.value.some((tag) => note.tags.includes(tag))
      )
    }

    if (selectedFolder.value) {
      result = result.filter((note) => note.folderPath === selectedFolder.value)
    }

    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  // Actions
  async function fetchNotes(params?: SearchParams & { is_cloud?: boolean }) {
    loading.value = true
    error.value = null
    try {
      const res = await notesApi.getNotes(params)
      const data = res.data.data as any
      notes.value = data.notes || data.items || []
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取笔记列表失败'
    } finally {
      loading.value = false
    }
  }

  async function createNote(data: CreateNoteDTO): Promise<Note> {
    loading.value = true
    error.value = null
    try {
      const res = await notesApi.createNote(data)
      const newNote = res.data.data
      notes.value.unshift(newNote)
      currentNote.value = newNote
      return newNote
    } catch (err: any) {
      error.value = err.response?.data?.message || '创建笔记失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新笔记 - 自动根据 is_cloud 选择正确的标识符
   */
  async function updateNote(note: Note, data: UpdateNoteDTO): Promise<Note> {
    const identifier = getNoteIdentifier(note)
    const isCloud = !!note.is_cloud

    error.value = null
    try {
      const res = await notesApi.updateNote(identifier, data, isCloud)
      const updated = res.data.data
      // 更新列表中的笔记
      const idx = notes.value.findIndex((n) => getNoteIdentifier(n) === identifier && n.is_cloud === isCloud)
      if (idx !== -1) {
        notes.value[idx] = updated
      }
      // 更新当前笔记
      if (currentNote.value && getNoteIdentifier(currentNote.value) === identifier && currentNote.value.is_cloud === isCloud) {
        currentNote.value = updated
      }
      return updated
    } catch (err: any) {
      error.value = err.response?.data?.message || '更新笔记失败'
      throw err
    }
  }

  /**
   * 删除笔记 - 自动根据 is_cloud 选择正确的标识符
   */
  async function deleteNote(note: Note): Promise<void> {
    const identifier = getNoteIdentifier(note)
    const isCloud = !!note.is_cloud

    loading.value = true
    error.value = null
    try {
      await notesApi.deleteNote(identifier, isCloud)
      notes.value = notes.value.filter(
        (n) => !(getNoteIdentifier(n) === identifier && n.is_cloud === isCloud)
      )
      if (currentNote.value && getNoteIdentifier(currentNote.value) === identifier && currentNote.value.is_cloud === isCloud) {
        currentNote.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '删除笔记失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAllTags() {
    try {
      const res = await notesApi.getAllTags()
      allTags.value = res.data.data || []
    } catch {
      allTags.value = []
    }
  }

  function setCurrentNote(note: Note | null) {
    currentNote.value = note
  }

  function clearSearch() {
    searchKeyword.value = ''
    selectedTags.value = []
    selectedFolder.value = ''
  }

  /** 直接设置笔记列表（本地模式使用） */
  function setNotes(newNotes: Note[]) {
    notes.value = newNotes
  }

  return {
    notes,
    currentNote,
    loading,
    error,
    searchKeyword,
    selectedTags,
    selectedFolder,
    allTags,
    filteredNotes,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    fetchAllTags,
    setCurrentNote,
    clearSearch,
    setNotes,
  }
})
