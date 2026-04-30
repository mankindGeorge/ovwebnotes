import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly storageService: StorageService) {}

  async create(createNoteDto: {
    title: string;
    content?: string;
    tags?: string[];
    folderPath?: string;
    filePath?: string;
    is_cloud: boolean;
  }) {
    const note = await this.storageService.createNote(
      {
        title: createNoteDto.title,
        content: createNoteDto.content || '',
        tags: createNoteDto.tags || [],
        folderPath: createNoteDto.folderPath || '',
        filePath: createNoteDto.filePath,
      },
      createNoteDto.is_cloud,
    );

    this.logger.log(
      `Note created: ${note.title} (cloud: ${createNoteDto.is_cloud})`,
    );
    return note;
  }

  async findOne(id: string, isCloud: boolean) {
    const note = await this.storageService.getNote(id, isCloud);
    if (!note) {
      throw new Error(`Note not found: ${id}`);
    }
    return note;
  }

  async update(
    id: string,
    updateNoteDto: {
      title?: string;
      content?: string;
      tags?: string[];
      folderPath?: string;
      filePath?: string;
      is_cloud?: boolean;
    },
  ) {
    const isCloud = updateNoteDto.is_cloud ?? true;
    const { is_cloud, ...data } = updateNoteDto;

    const note = await this.storageService.updateNote(id, data, isCloud);
    if (!note) {
      throw new Error(`Note not found: ${id}`);
    }
    return note;
  }

  async remove(id: string, isCloud: boolean) {
    const deleted = await this.storageService.deleteNote(id, isCloud);
    if (!deleted) {
      throw new Error(`Note not found: ${id}`);
    }
    return { deleted: true };
  }

  async findAll(params: {
    is_cloud: boolean;
    tags?: string[];
    search?: string;
    folderPath?: string;
    skip?: number;
    take?: number;
  }) {
    return this.storageService.listNotes(params.is_cloud, {
      tags: params.tags,
      search: params.search,
      folderPath: params.folderPath,
      skip: params.skip,
      take: params.take,
    });
  }

  async search(query: string, isCloud: boolean) {
    return this.storageService.searchNotes(query, isCloud);
  }

  async exportToVault(noteId: string) {
    return this.storageService.exportToVault(noteId);
  }

  async importToCloud(noteIdOrPath: string, body?: { title?: string; content?: string; tags?: string[]; folderPath?: string }) {
    // 如果前端传了笔记数据，直接用前端数据创建云端笔记
    if (body && body.title) {
      const note = await this.storageService.createNote({
        title: body.title,
        content: body.content || '',
        tags: body.tags || [],
        folderPath: body.folderPath || '/',
      }, true);
      return note;
    }
    // 兼容旧逻辑：从服务端文件系统读取
    return this.storageService.importToCloud(noteIdOrPath);
  }

  async getAllTags() {
    const { notes } = await this.storageService.listNotes(true, { take: 1000 });
    const tagSet = new Set<string>();
    for (const note of notes) {
      for (const tag of note.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet);
  }
}
