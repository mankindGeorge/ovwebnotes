import { Injectable, Logger } from '@nestjs/common';
import { FileAdapter, FileNote } from './file.adapter';
import { DbAdapter, DbNote } from './db.adapter';

export type StorageNote = (FileNote | DbNote) & { is_cloud?: boolean };

export interface CreateNoteInput {
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  filePath?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  folderPath?: string;
  filePath?: string;
}

export interface ListNotesOptions {
  tags?: string[];
  search?: string;
  folderPath?: string;
  skip?: number;
  take?: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly fileAdapter: FileAdapter,
    private readonly dbAdapter: DbAdapter,
  ) {}

  /**
   * 给笔记打上 is_cloud 标记
   */
  private markCloud(note: DbNote): DbNote & { is_cloud: true } {
    return { ...note, is_cloud: true };
  }

  private markLocal(note: FileNote): FileNote & { is_cloud: false } {
    return { ...note, is_cloud: false };
  }

  /**
   * 混合存储网关：根据 is_cloud 决定使用 FileAdapter 还是 DbAdapter
   */

  async createNote(input: CreateNoteInput, isCloud: boolean): Promise<StorageNote> {
    if (isCloud) {
      const cleanFolder = input.folderPath.replace(/^\/+|\/+$/g, '');
      const filePath = input.filePath || (cleanFolder ? `${cleanFolder}/${input.title}.md` : `${input.title}.md`);
      const note = await this.dbAdapter.createNote({
        title: input.title,
        content: input.content,
        tags: input.tags,
        folderPath: input.folderPath,
        filePath,
      });
      return this.markCloud(note);
    } else {
      const note = await this.fileAdapter.createNote({
        title: input.title,
        content: input.content,
        tags: input.tags,
        folderPath: input.folderPath,
      });
      return this.markLocal(note);
    }
  }

  async getNote(idOrPath: string, isCloud: boolean): Promise<StorageNote | null> {
    if (isCloud) {
      const note = await this.dbAdapter.getNote(idOrPath);
      return note ? this.markCloud(note) : null;
    } else {
      const note = await this.fileAdapter.getNote(idOrPath);
      return note ? this.markLocal(note) : null;
    }
  }

  async updateNote(
    idOrPath: string,
    data: UpdateNoteInput,
    isCloud: boolean,
  ): Promise<StorageNote | null> {
    if (isCloud) {
      const note = await this.dbAdapter.updateNote(idOrPath, data);
      return note ? this.markCloud(note) : null;
    } else {
      const note = await this.fileAdapter.updateNote(idOrPath, data);
      return note ? this.markLocal(note) : null;
    }
  }

  async deleteNote(idOrPath: string, isCloud: boolean): Promise<boolean> {
    if (isCloud) {
      return this.dbAdapter.deleteNote(idOrPath);
    } else {
      return this.fileAdapter.deleteNote(idOrPath);
    }
  }

  async listNotes(
    isCloud: boolean,
    options?: ListNotesOptions,
  ): Promise<{ notes: StorageNote[]; total: number }> {
    if (isCloud) {
      const result = await this.dbAdapter.listNotes(options);
      return {
        notes: result.notes.map((n) => this.markCloud(n)),
        total: result.total,
      };
    } else {
      const notes = await this.fileAdapter.listNotes(options?.folderPath);
      return {
        notes: notes.map((n) => this.markLocal(n)),
        total: notes.length,
      };
    }
  }

  /**
   * 一键固化：将云端笔记导出到本地 Vault
   */
  async exportToVault(noteId: string): Promise<StorageNote> {
    const cloudNote = await this.dbAdapter.getNote(noteId);
    if (!cloudNote) {
      throw new Error(`Cloud note not found: ${noteId}`);
    }

    const localNote = await this.fileAdapter.createNote({
      title: cloudNote.title,
      content: cloudNote.content,
      tags: cloudNote.tags,
      folderPath: cloudNote.folderPath,
    });

    this.logger.log(`Exported cloud note ${noteId} to vault: ${localNote.filePath}`);
    return this.markLocal(localNote);
  }

  /**
   * 上传本地笔记到云端数据库
   */
  async importToCloud(noteIdOrPath: string): Promise<StorageNote> {
    const localNote = await this.fileAdapter.getNote(noteIdOrPath);
    if (!localNote) {
      throw new Error(`Local note not found: ${noteIdOrPath}`);
    }

    const cloudNote = await this.dbAdapter.createNote({
      title: localNote.title,
      content: localNote.content,
      tags: localNote.tags,
      folderPath: localNote.folderPath,
      filePath: localNote.filePath,
    });

    this.logger.log(`Imported local note ${noteIdOrPath} to cloud: ${cloudNote.id}`);
    return this.markCloud(cloudNote);
  }

  /**
   * 搜索笔记
   */
  async searchNotes(query: string, isCloud: boolean): Promise<StorageNote[]> {
    if (isCloud) {
      const notes = await this.dbAdapter.searchNotes(query);
      return notes.map((n) => this.markCloud(n));
    } else {
      const allNotes = await this.fileAdapter.listNotes();
      const lowerQuery = query.toLowerCase();
      return allNotes
        .filter(
          (n) =>
            n.title.toLowerCase().includes(lowerQuery) ||
            n.content.toLowerCase().includes(lowerQuery) ||
            n.tags.some((t) => t.toLowerCase().includes(lowerQuery)),
        )
        .map((n) => this.markLocal(n));
    }
  }
}
