import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface DbNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_cloud: boolean;
  folderPath: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  isFromRepository?: boolean;
  repositoryId?: string | null;
}

@Injectable()
export class DbAdapter {
  private readonly logger = new Logger(DbAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建笔记
   */
  async createNote(data: {
    title: string;
    content: string;
    tags: string[];
    folderPath: string;
    filePath: string;
  }): Promise<DbNote> {
    const note = await this.prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
        is_cloud: true,
        folderPath: data.folderPath,
        filePath: data.filePath,
      },
    });
    return this.toDbNote(note);
  }

  /**
   * 获取单个笔记
   */
  async getNote(id: string): Promise<DbNote | null> {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: { attachments: true },
    });
    return note ? this.toDbNote(note) : null;
  }

  /**
   * 更新笔记
   */
  async updateNote(
    id: string,
    data: {
      title?: string;
      content?: string;
      tags?: string[];
      folderPath?: string;
      filePath?: string;
    },
  ): Promise<DbNote | null> {
    try {
      const note = await this.prisma.note.update({
        where: { id },
        data,
      });
      return this.toDbNote(note);
    } catch (error) {
      this.logger.warn(`Failed to update note ${id}: record not found`);
      return null;
    }
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      await this.prisma.note.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 列出笔记，支持标签过滤和搜索
   */
  async listNotes(options?: {
    tags?: string[];
    search?: string;
    folderPath?: string;
    skip?: number;
    take?: number;
  }): Promise<{ notes: DbNote[]; total: number }> {
    const where: Record<string, unknown> = { is_cloud: true };

    if (options?.tags && options.tags.length > 0) {
      where.tags = { hasEvery: options.tags };
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.folderPath) {
      where.folderPath = { startsWith: options.folderPath };
    }

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: options?.skip ?? 0,
        take: options?.take ?? 50,
      }),
      this.prisma.note.count({ where }),
    ]);

    return {
      notes: notes.map((n) => this.toDbNote(n)),
      total,
    };
  }

  /**
   * 全文搜索
   */
  async searchNotes(query: string): Promise<DbNote[]> {
    const notes = await this.prisma.note.findMany({
      where: {
        is_cloud: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return notes.map((n) => this.toDbNote(n));
  }

  /**
   * 记录同步日志
   */
  async createSyncLog(status: string, message: string): Promise<void> {
    await this.prisma.syncLog.create({
      data: { status, message },
    });
  }

  /**
   * 获取最近的同步日志
   */
  async getRecentSyncLogs(limit = 10) {
    return this.prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private toDbNote(note: any): DbNote {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      is_cloud: note.is_cloud,
      folderPath: note.folderPath,
      filePath: note.filePath,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      isFromRepository: note.isFromRepository ?? false,
      repositoryId: note.repositoryId,
    };
  }
}
