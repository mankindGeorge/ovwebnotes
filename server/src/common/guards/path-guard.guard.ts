import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class PathGuardGuard implements CanActivate {
  private readonly logger = new Logger(PathGuardGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const reqPath = request.params.path || request.query.path || request.body?.path;

    if (reqPath) {
      this.validatePath(reqPath);
    }

    return true;
  }

  /**
   * 校验路径安全性，防止目录遍历攻击
   * 使用 path.resolve 解析后检查是否在允许的根目录内
   */
  validatePath(inputPath: string, rootDir?: string): string {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new BadRequestException('Path parameter is required');
    }

    // 解码 URL 编码的字符
    const decodedPath = decodeURIComponent(inputPath);

    // 解析为绝对路径
    const resolvedPath = path.resolve(decodedPath);

    // 检查是否包含目录遍历模式
    if (
      decodedPath.includes('..') ||
      resolvedPath.includes('..') ||
      decodedPath.includes('\0')
    ) {
      this.logger.warn(`Path traversal attempt detected: ${inputPath}`);
      throw new BadRequestException('Invalid path: directory traversal detected');
    }

    // 如果指定了根目录，检查是否在根目录范围内
    if (rootDir) {
      const resolvedRoot = path.resolve(rootDir);
      if (!resolvedPath.startsWith(resolvedRoot)) {
        this.logger.warn(
          `Path escape attempt detected: ${inputPath} (root: ${rootDir})`,
        );
        throw new BadRequestException('Invalid path: access denied');
      }
    }

    return resolvedPath;
  }
}
