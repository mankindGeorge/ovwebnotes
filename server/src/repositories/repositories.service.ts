import { Injectable, Logger, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { simpleGit, SimpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateRepositoryDto, UpdateRepositoryDto } from './dto/create-repository.dto';

@Injectable()
export class RepositoriesService {
  private readonly logger = new Logger(RepositoriesService.name);
  private readonly repositoriesPath = path.resolve('./repositories');

  constructor(private readonly prisma: PrismaService) {
    this.ensureRepositoriesDir();
  }

  private async ensureRepositoriesDir() {
    try {
      await fs.mkdir(this.repositoriesPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create repositories directory: ${error}`);
    }
  }

  async create(dto: CreateRepositoryDto) {
    const folder = dto.folder || this.generateFolderName(dto.name);
    
    const existing = await this.prisma.remoteRepository.findUnique({
      where: { folder },
    });
    
    if (existing) {
      throw new ConflictException(`仓库文件夹 "${folder}" 已存在`);
    }

    const repoPath = path.join(this.repositoriesPath, folder);
    await fs.mkdir(repoPath, { recursive: true });

    try {
      const git: SimpleGit = simpleGit(repoPath, { 
        timeout: { block: 240000 } // 4分钟超时
      });
      await git.init();
      
      // 获取镜像配置
      const mirrorConfig = await this.getMirrorConfig();
      const token = await this.getGitToken();
      
      // 确定最终使用的URL
      let finalUrl = dto.url;
      
      if (mirrorConfig.enabled) {
        // 使用镜像，不需要token
        finalUrl = this.convertToMirrorUrl(dto.url, mirrorConfig.url);
        this.logger.log(`Using mirror URL: ${mirrorConfig.url}`);
      } else if (token) {
        // 不使用镜像，但有token，使用带认证的URL
        finalUrl = this.injectToken(dto.url, token);
        this.logger.log('Using token authentication');
      }
      
      await git.addRemote('origin', finalUrl);
      
      // 尝试fetch
      try {
        await git.fetch('origin');
      } catch (fetchError) {
        this.logger.error(`Failed to fetch: ${fetchError}`);
        const errorMsg = fetchError.message || '';
        
        // 清理目录
        await fs.rm(repoPath, { recursive: true, force: true }).catch(() => {});
        
        // 根据错误类型返回不同的提示
        // 注意：使用镜像时，认证错误应该是镜像服务的问题
        if (errorMsg.includes('Authentication failed') ||
            errorMsg.includes('Permission denied') ||
            errorMsg.includes('403') ||
            errorMsg.includes('401')) {
          if (mirrorConfig.enabled) {
            throw new Error('镜像服务访问失败，请尝试其他镜像地址或禁用镜像使用Token');
          }
          if (!token) {
            throw new UnauthorizedException('此仓库需要认证。请先在设置中配置Git访问令牌，或启用GitHub镜像。');
          }
          throw new UnauthorizedException('访问令牌无效或权限不足，请检查访问令牌是否正确');
        }
        
        // "could not read Username" 错误
        if (errorMsg.includes('could not read Username')) {
          if (mirrorConfig.enabled) {
            // 使用镜像时出现此错误，说明镜像服务有问题
            throw new Error('镜像服务连接失败，请尝试其他镜像地址或检查网络连接');
          }
          // 不使用镜像时，这是认证问题
          throw new UnauthorizedException('此仓库需要认证。请先在设置中配置Git访问令牌，或启用GitHub镜像。');
        }
        
        if (errorMsg.includes('timed out') || errorMsg.includes('ETIMEDOUT')) {
          throw new Error('连接仓库超时，请检查网络连接或尝试启用GitHub镜像');
        }
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          throw new NotFoundException('仓库不存在，请检查仓库URL是否正确');
        }
        if (errorMsg.includes('SSL') || errorMsg.includes('openssl') || errorMsg.includes('tls')) {
          throw new Error('SSL连接失败，请启用GitHub镜像或检查网络设置');
        }
        throw new Error(`访问仓库失败: ${errorMsg}`);
      }
      
      // 获取远程分支列表
      const branch = dto.branch || 'main';
      try {
        const branches = await git.branch(['-r']);
        const remoteBranch = `origin/${branch}`;
        
        if (branches.all.includes(remoteBranch)) {
          await git.checkoutBranch(branch, remoteBranch);
        } else {
          const alternativeBranches = ['origin/main', 'origin/master', 'origin/develop'];
          const foundBranch = alternativeBranches.find(b => branches.all.includes(b));
          
          if (foundBranch) {
            const localBranch = foundBranch.replace('origin/', '');
            await git.checkoutBranch(localBranch, foundBranch);
            this.logger.log(`Checked out branch: ${localBranch}`);
          } else if (branches.all.length === 0) {
            this.logger.log('Repository appears to be empty, skipping branch checkout');
          } else {
            const firstBranch = branches.all[0];
            const localBranch = firstBranch.replace('origin/', '');
            await git.checkoutBranch(localBranch, firstBranch);
            this.logger.log(`Checked out first available branch: ${localBranch}`);
          }
        }
      } catch (branchError) {
        this.logger.warn(`Branch checkout issue: ${branchError}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize git repository: ${error}`);
      try {
        await fs.rmdir(repoPath, { recursive: true });
      } catch (cleanupError) {
        this.logger.error(`Failed to cleanup repo directory: ${cleanupError}`);
      }
      throw error;
    }

    const repository = await this.prisma.remoteRepository.create({
      data: {
        name: dto.name,
        url: dto.url,
        branch: dto.branch || 'main',
        folder,
      },
    });

    // 创建成功后自动同步笔记
    await this.syncNotesFromRepository(repository.id, repoPath);

    return repository;
  }

  private async getGitToken(): Promise<string | null> {
    try {
      const tokenPath = path.join(path.resolve('./vaults'), '.git-token');
      const token = await fs.readFile(tokenPath, 'utf-8');
      return token.trim() || null;
    } catch {
      return null;
    }
  }

  private injectToken(url: string, token: string): string {
    if (url.startsWith('https://')) {
      return url.replace('https://', `https://oauth2:${token}@`);
    }
    if (url.startsWith('http://')) {
      return url.replace('http://', `http://oauth2:${token}@`);
    }
    return url;
  }

  async findAll() {
    return this.prisma.remoteRepository.findMany({
      include: {
        _count: {
          select: { notes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const repo = await this.prisma.remoteRepository.findUnique({
      where: { id },
      include: {
        notes: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!repo) {
      throw new NotFoundException(`Repository with id ${id} not found`);
    }

    return repo;
  }

  async update(id: string, dto: UpdateRepositoryDto) {
    const repo = await this.findOne(id);

    return this.prisma.remoteRepository.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const repo = await this.findOne(id);

    const repoPath = path.join(this.repositoriesPath, repo.folder);
    try {
      // 检查文件夹是否存在
      const exists = await fs.access(repoPath).then(() => true).catch(() => false);
      if (exists) {
        await fs.rmdir(repoPath, { recursive: true });
        this.logger.log(`Removed repository folder: ${repoPath}`);
      } else {
        this.logger.warn(`Repository folder does not exist, skipping deletion: ${repoPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove repository folder: ${error}`);
    }

    return this.prisma.remoteRepository.delete({
      where: { id },
    });
  }

  async activate(id: string) {
    const repo = await this.findOne(id);

    await this.prisma.remoteRepository.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    return this.prisma.remoteRepository.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async sync(id: string) {
    const repo = await this.findOne(id);
    const repoPath = path.join(this.repositoriesPath, repo.folder);

    // 检查文件夹是否存在
    const exists = await fs.access(repoPath).then(() => true).catch(() => false);
    if (!exists) {
      throw new Error('仓库文件夹不存在，请重新添加仓库');
    }

    try {
      const git: SimpleGit = simpleGit(repoPath);
      await git.pull('origin', repo.branch);

      // 同步仓库中的markdown文件到数据库
      await this.syncNotesFromRepository(repo.id, repoPath);

      await this.prisma.remoteRepository.update({
        where: { id },
        data: { lastSync: new Date() },
      });

      return { success: true, message: '仓库同步成功' };
    } catch (error) {
      this.logger.error(`Failed to sync repository: ${error}`);
      throw error;
    }
  }

  private async syncNotesFromRepository(repositoryId: string, repoPath: string) {
    try {
      // 获取仓库信息以获取名称
      const repository = await this.prisma.remoteRepository.findUnique({
        where: { id: repositoryId },
      });
      
      if (!repository) {
        this.logger.error(`Repository not found: ${repositoryId}`);
        return;
      }

      // 递归查找所有markdown文件
      const mdFiles = await this.findMarkdownFiles(repoPath);
      
      let importedCount = 0;
      for (const filePath of mdFiles) {
        try {
          // 读取文件内容
          const content = await fs.readFile(filePath, 'utf-8');
          const relativePath = path.relative(repoPath, filePath);
          const title = path.basename(filePath, '.md');
          
          // 构建云端文件夹路径：/仓库名/相对路径的目录
          const cloudFolderPath = '/' + repository.name + '/' + (path.dirname(relativePath) || '/');
          const cloudFilePath = '/' + repository.name + '/' + relativePath;
          
          // 检查是否已存在
          const existing = await this.prisma.note.findFirst({
            where: {
              repositoryId,
              filePath: cloudFilePath,
            },
          });

          if (existing) {
            // 更新现有笔记
            await this.prisma.note.update({
              where: { id: existing.id },
              data: {
                content,
                title,
                folderPath: cloudFolderPath,
                updatedAt: new Date(),
              },
            });
          } else {
            // 创建新笔记
            await this.prisma.note.create({
              data: {
                title,
                content,
                filePath: cloudFilePath,
                folderPath: cloudFolderPath,
                is_cloud: true,
                isFromRepository: true,
                repositoryId,
                tags: [],
              },
            });
          }
          importedCount++;
        } catch (error) {
          this.logger.error(`Failed to import note ${filePath}: ${error}`);
        }
      }

      this.logger.log(`Imported ${importedCount} notes from repository`);
    } catch (error) {
      this.logger.error(`Failed to sync notes from repository: ${error}`);
    }
  }

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(currentDir: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        // 跳过.git目录
        if (entry.name === '.git') continue;
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dir);
    return files;
  }

  private generateFolderName(name: string): string {
    const sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${sanitized}-${Date.now()}`;
  }

  private async getMirrorConfig(): Promise<{ enabled: boolean; url: string }> {
    try {
      const configPath = path.join(path.resolve('./vaults'), '.mirror-config.json');
      const config = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(config);
      // 确保返回完整的配置对象，缺失字段使用默认值
      return {
        enabled: parsed.enabled ?? false,
        url: parsed.url ?? 'gh-proxy.com'
      };
    } catch {
      return { enabled: false, url: 'gh-proxy.com' };
    }
  }

  private convertToMirrorUrl(originalUrl: string, mirrorDomain: string): string {
    // GitHub HTTPS URL
    if (originalUrl.startsWith('https://github.com/')) {
      return originalUrl.replace('https://github.com/', `https://${mirrorDomain}/https://github.com/`);
    }
    // GitHub HTTP URL
    if (originalUrl.startsWith('http://github.com/')) {
      return originalUrl.replace('http://github.com/', `https://${mirrorDomain}/http://github.com/`);
    }
    // 其他情况返回原URL
    return originalUrl;
  }
}
