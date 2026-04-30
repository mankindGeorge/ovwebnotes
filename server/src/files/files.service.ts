import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UPLOAD_DIR_TOKEN } from './files.constants';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(@Inject(UPLOAD_DIR_TOKEN) private readonly uploadDir: string) {
    this.uploadDir = path.resolve(this.uploadDir);
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error}`);
    }
  }

  /**
   * 保存上传的文件
   */
  async saveFile(file: Express.Multer.File, isCloud: boolean): Promise<{
    fileName: string;
    filePath: string;
    fileType: string;
    size: number;
    is_cloud: boolean;
  }> {
    const relativePath = path.join(this.uploadDir, file.filename);
    const resolvedPath = path.resolve(relativePath);

    // 安全校验
    if (!resolvedPath.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    return {
      fileName: file.originalname,
      filePath: resolvedPath,
      fileType: file.mimetype,
      size: file.size,
      is_cloud: isCloud,
    };
  }

  /**
   * 获取文件用于下载/预览
   */
  async getFile(filePath: string): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
    fileName: string;
  }> {
    const resolvedPath = this.resolveSafePath(filePath);

    try {
      await fs.access(resolvedPath);
    } catch {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    const stat = await fs.stat(resolvedPath);
    if (!stat.isFile()) {
      throw new BadRequestException('Path is not a file');
    }

    const stream = require('fs').createReadStream(resolvedPath);
    const mimeType = this.getMimeType(resolvedPath);
    const fileName = path.basename(resolvedPath);

    return { stream, mimeType, fileName };
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<boolean> {
    const resolvedPath = this.resolveSafePath(filePath);
    try {
      await fs.unlink(resolvedPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 路径安全校验
   */
  private resolveSafePath(inputPath: string): string {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new BadRequestException('Path parameter is required');
    }

    const decodedPath = decodeURIComponent(inputPath);
    const resolvedPath = path.resolve(decodedPath);

    // 防止目录遍历
    if (
      decodedPath.includes('..') ||
      resolvedPath.includes('..') ||
      decodedPath.includes('\0')
    ) {
      throw new BadRequestException('Invalid path: directory traversal detected');
    }

    return resolvedPath;
  }

  /**
   * 根据 MIME 类型映射
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }
}
