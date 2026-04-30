import { Injectable, Logger, Inject } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Dirent } from 'fs';
import { VAULT_PATH_TOKEN } from './storage.constants';

export interface FileNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileAttachment {
  id: string;
  noteId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  size: number;
}

@Injectable()
export class FileAdapter {
  private readonly logger = new Logger(FileAdapter.name);
  private _vaultPath: string;

  constructor(@Inject(VAULT_PATH_TOKEN) vaultPath: string) {
    this._vaultPath = path.resolve(vaultPath);
  }

  /** 动态获取当前 vault 路径 */
  get vaultPath(): string {
    return this._vaultPath;
  }

  /**
   * 创建笔记文件
   */
  async createNote(data: {
    title: string;
    content: string;
    tags: string[];
    folderPath: string;
  }): Promise<FileNote> {
    const { title, content, tags, folderPath } = data;
    const fileName = `${title}.md`;
    // 移除 folderPath 开头的 / 防止 path.join 产生绝对路径
    const cleanFolder = folderPath.replace(/^\/+/, '');
    const relativePath = cleanFolder ? path.join(cleanFolder, fileName) : fileName;
    const fullPath = path.join(this.vaultPath, relativePath);

    // 确保目录存在
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // 写入文件，前置 YAML frontmatter
    const frontmatter = this.buildFrontmatter(title, tags);
    const fileContent = `${frontmatter}\n${content}`;
    await fs.writeFile(fullPath, fileContent, 'utf-8');

    const now = new Date();
    return {
      id: this.generateId(fullPath),
      title,
      content,
      tags,
      folderPath,
      filePath: relativePath,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 读取笔记文件
   */
  async getNote(filePath: string): Promise<FileNote | null> {
    const fullPath = this.resolveSafePath(filePath);
    try {
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      const { title, tags, content } = this.parseMarkdown(fileContent);
      const stat = await fs.stat(fullPath);

      return {
        id: this.generateId(fullPath),
        title,
        content,
        tags,
        folderPath: path.dirname(filePath),
        filePath,
        createdAt: stat.birthtime,
        updatedAt: stat.mtime,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 更新笔记文件
   */
  async updateNote(
    filePath: string,
    data: {
      title?: string;
      content?: string;
      tags?: string[];
    },
  ): Promise<FileNote | null> {
    try {
      const fullPath = this.resolveSafePath(filePath);
      const existing = await this.getNote(filePath);
      if (!existing) {
        this.logger.warn(`File note not found: ${filePath}`);
        return null;
      }

      const title = data.title ?? existing.title;
      const content = data.content ?? existing.content;
      const tags = data.tags ?? existing.tags;

      const frontmatter = this.buildFrontmatter(title, tags);
      const fileContent = `${frontmatter}\n${content}`;
      await fs.writeFile(fullPath, fileContent, 'utf-8');

      const stat = await fs.stat(fullPath);
      return {
        ...existing,
        title,
        content,
        tags,
        updatedAt: stat.mtime,
      };
    } catch (error) {
      this.logger.warn(`Failed to update file note ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * 删除笔记文件
   */
  async deleteNote(filePath: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(filePath);
    try {
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 列出所有笔记
   */
  async listNotes(folderPath?: string): Promise<FileNote[]> {
    const searchDir = folderPath
      ? this.resolveSafePath(folderPath)
      : this.vaultPath;

    const notes: FileNote[] = [];
    await this.walkDirectory(searchDir, notes);

    return notes;
  }

  /**
   * 解析 Markdown 中的 Obsidian 附件语法 ![[attachment.png]]
   */
  parseAttachments(content: string): string[] {
    const wikiLinkPattern = /!\[\[([^\]]+)\]\]/g;
    const attachments: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = wikiLinkPattern.exec(content)) !== null) {
      attachments.push(match[1]);
    }

    return attachments;
  }

  /**
   * 递归遍历目录，收集所有 .md 文件
   */
  private async walkDirectory(dir: string, notes: FileNote[]): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 跳过隐藏目录和 .git
        if (entry.name.startsWith('.') || entry.name === '.git') {
          continue;
        }
        await this.walkDirectory(fullPath, notes);
      } else if (entry.name.endsWith('.md')) {
        try {
          const fileContent = await fs.readFile(fullPath, 'utf-8');
          const { title, tags, content } = this.parseMarkdown(fileContent);
          const relativePath = path.relative(this.vaultPath, fullPath);
          const stat = await fs.stat(fullPath);

          notes.push({
            id: this.generateId(fullPath),
            title,
            content,
            tags,
            folderPath: path.dirname(relativePath),
            filePath: relativePath,
            createdAt: stat.birthtime,
            updatedAt: stat.mtime,
          });
        } catch (error) {
          this.logger.warn(`Failed to read file ${fullPath}: ${error}`);
        }
      }
    }
  }

  /**
   * 解析 Markdown 文件的 YAML frontmatter
   */
  private parseMarkdown(fileContent: string): {
    title: string;
    tags: string[];
    content: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);

    let title = 'Untitled';
    let tags: string[] = [];
    let content = fileContent;

    if (match) {
      const fm = match[1];
      content = match[2];

      const titleMatch = fm.match(/title:\s*(.+)/);
      if (titleMatch) {
        title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
      }

      const tagsMatch = fm.match(/tags:\s*\[([^\]]*)\]/);
      if (tagsMatch) {
        tags = tagsMatch[1]
          .split(',')
          .map((t) => t.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }
    } else {
      // 如果没有 frontmatter，从第一行提取标题
      const firstLine = fileContent.split('\n')[0];
      if (firstLine.startsWith('# ')) {
        title = firstLine.replace(/^#\s+/, '');
      }
    }

    return { title, tags, content };
  }

  /**
   * 构建 YAML frontmatter
   */
  private buildFrontmatter(title: string, tags: string[]): string {
    const tagsStr = tags.map((t) => `"${t}"`).join(', ');
    return `---
title: "${title}"
tags: [${tagsStr}]
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---`;
  }

  /**
   * 路径安全校验
   */
  private resolveSafePath(relativePath: string): string {
    const resolved = path.resolve(this.vaultPath, relativePath);
    if (!resolved.startsWith(path.resolve(this.vaultPath))) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }

  /**
   * 基于文件路径生成稳定的 ID（不含时间戳，确保同一文件始终返回相同 ID）
   */
  private generateId(filePath: string): string {
    let hash = 0;
    const str = path.resolve(filePath);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    // 生成 16 位十六进制，确保足够唯一且稳定
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // 第二轮哈希增加区分度
    let hash2 = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      const char = str.charCodeAt(i);
      hash2 = ((hash2 << 7) ^ hash2 ^ char) | 0;
    }
    return hex + Math.abs(hash2).toString(16).padStart(8, '0');
  }
}
