import { useNotesStore } from '@/stores/notes'
import { useAppStore } from '@/stores/app'
import { getNoteIdentifier } from '@/api/notes'
import type { CreateNoteDTO, UpdateNoteDTO } from '@/types'

export function useNotes() {
  const notesStore = useNotesStore()
  const appStore = useAppStore()

  async function loadNotes(params?: { is_cloud?: boolean }) {
    await notesStore.fetchNotes({ is_cloud: params?.is_cloud ?? appStore.isCloudMode })
  }

  async function loadTags() {
    await notesStore.fetchAllTags()
  }

  async function addNote(data: CreateNoteDTO) {
    return notesStore.createNote(data)
  }

  async function editNote(_noteId: string, data: UpdateNoteDTO) {
    const note = notesStore.currentNote
    if (!note) throw new Error('No current note')
    return notesStore.updateNote(note, data)
  }

  async function removeNote(noteId: string) {
    const note = notesStore.notes.find((n) => getNoteIdentifier(n) === noteId)
    if (!note) throw new Error('Note not found')
    return notesStore.deleteNote(note)
  }

  return {
    loadNotes,
    loadTags,
    addNote,
    editNote,
    removeNote,
  }
}
