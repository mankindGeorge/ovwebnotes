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
      // 文本/文档
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
      // 图片
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.ico': 'image/x-icon',
      // PDF
      '.pdf': 'application/pdf',
      // Office 文档
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // 压缩文件
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      // 音频
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      // 视频
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogv': 'video/ogg',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      // 代码
      '.py': 'text/x-python',
      '.sh': 'application/x-sh',
      '.ts': 'application/typescript',
      '.vue': 'text/x-vue',
      '.jsx': 'text/jsx',
      '.tsx': 'text/tsx',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  /**
   * 移动文件到目标文件夹
   */
  async moveFile(sourcePath: string, targetFolder: string, repositoryId?: string): Promise<{
    success: boolean;
    newPath: string;
  }> {
    const resolvedSource = this.resolveSafePath(sourcePath);
    
    // 确定目标路径
    let targetBasePath: string;
    if (repositoryId) {
      // 如果指定了仓库，移动到仓库目录
      targetBasePath = path.resolve('./repositories', targetFolder);
    } else {
      // 否则移动到 uploads 目录下的目标文件夹
      targetBasePath = path.join(this.uploadDir, targetFolder);
    }

    // 确保目标文件夹存在
    await fs.mkdir(targetBasePath, { recursive: true });

    const fileName = path.basename(resolvedSource);
    const targetPath = path.join(targetBasePath, fileName);

    // 检查源文件是否存在
    try {
      await fs.access(resolvedSource);
    } catch {
      throw new NotFoundException(`Source file not found: ${sourcePath}`);
    }

    // 移动文件
    try {
      await fs.rename(resolvedSource, targetPath);
      return {
        success: true,
        newPath: targetPath,
      };
    } catch (error) {
      this.logger.error(`Failed to move file: ${error}`);
      throw error;
    }
  }
}
