import { Injectable, Logger } from '@nestjs/common';
import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface GitStatus {
  isClean: boolean;
  branch: string;
  changed: string[];
  staged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

/** Token 存储文件路径（与 vaults 同级，不进 git） */
const TOKEN_FILE = '.git-token';

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);
  private git: SimpleGit;
  private _vaultPath: string;

  constructor() {
    this._vaultPath = path.resolve(process.env.VAULT_PATH || './vaults');
    this.git = simpleGit(this._vaultPath);
  }

  /** 获取当前 vault 路径 */
  get vaultPath(): string {
    return this._vaultPath;
  }

  // ==================== Token 管理 ====================

  /**
   * 读取存储的 Token
   */
  async getToken(): Promise<string | null> {
    try {
      const tokenPath = path.join(this.vaultPath, TOKEN_FILE);
      const token = await fs.readFile(tokenPath, 'utf-8');
      return token.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * 保存 Token 到文件
   */
  async saveToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const tokenPath = path.join(this.vaultPath, TOKEN_FILE);
      await fs.writeFile(tokenPath, token.trim(), 'utf-8');

      // 确保 .gitignore 包含 .git-token
      const gitignorePath = path.join(this.vaultPath, '.gitignore');
      try {
        const gitignore = await fs.readFile(gitignorePath, 'utf-8');
        if (!gitignore.includes(TOKEN_FILE)) {
          await fs.appendFile(gitignorePath, `\n${TOKEN_FILE}\n`, 'utf-8');
        }
      } catch {
        // .gitignore 不存在，创建一个
        await fs.writeFile(gitignorePath, `${TOKEN_FILE}\n`, 'utf-8');
      }

      this.logger.log('Git token saved');
      return { success: true, message: 'Token 已保存' };
    } catch (error) {
      this.logger.error(`Failed to save token: ${error}`);
      return { success: false, message: `保存失败: ${error}` };
    }
  }

  /**
   * 删除 Token
   */
  async removeToken(): Promise<{ success: boolean; message: string }> {
    try {
      const tokenPath = path.join(this.vaultPath, TOKEN_FILE);
      await fs.unlink(tokenPath);
      return { success: true, message: 'Token 已删除' };
    } catch {
      return { success: true, message: 'Token 不存在' };
    }
  }

  /**
   * 将 Token 注入到 remote URL 中用于认证
   * 支持 https://github.com/user/repo.git 格式
   */
  private async getAuthenticatedRemote(): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      let remoteUrl = origin?.refs?.push || null;
      if (!remoteUrl) return null;

      const token = await this.getToken();
      if (!token) return remoteUrl;

      // 如果 URL 已经包含 token，不再重复注入
      if (remoteUrl.includes('@')) return remoteUrl;

      // https://github.com/user/repo.git → https://oauth2:TOKEN@github.com/user/repo.git
      if (remoteUrl.startsWith('https://')) {
        const injected = remoteUrl.replace(
          'https://',
          `https://oauth2:${token}@`,
        );
        return injected;
      }

      // http:// 也支持
      if (remoteUrl.startsWith('http://')) {
        const injected = remoteUrl.replace(
          'http://',
          `http://oauth2:${token}@`,
        );
        return injected;
      }

      return remoteUrl;
    } catch {
      return null;
    }
  }

  // ==================== Git 操作 ====================

  /**
   * 获取当前仓库状态
   */
  async getStatus(): Promise<GitStatus> {
    try {
      const status: StatusResult = await this.git.status();
      const branch = status.current || 'unknown';

      return {
        isClean: status.isClean(),
        branch,
        changed: status.modified,
        staged: status.staged,
        untracked: status.not_added,
        ahead: status.ahead,
        behind: status.behind,
      };
    } catch (error: any) {
      // 非 git 仓库时返回空状态而非抛错
      if (error?.message?.includes('not a git repository')) {
        return {
          isClean: true,
          branch: '',
          changed: [],
          staged: [],
          untracked: [],
          ahead: 0,
          behind: 0,
        };
      }
      this.logger.error(`Failed to get git status: ${error}`);
      throw new Error(`Git status failed: ${error}`);
    }
  }

  /**
   * 自动同步：检测变动并 commit/push
   */
  async autoSync(): Promise<{
    success: boolean;
    message: string;
    changes?: number;
  }> {
    try {
      const status = await this.getStatus();

      if (status.isClean) {
        this.logger.log('No changes to sync');
        return { success: true, message: '没有需要同步的变更', changes: 0 };
      }

      const allChanges = [
        ...status.changed,
        ...status.staged,
        ...status.untracked,
      ];

      // 添加所有变更
      await this.git.add('-A');

      // 提交
      const timestamp = new Date().toISOString();
      await this.git.commit(
        `Auto sync: ${allChanges.length} file(s) changed [${timestamp}]`,
      );

      // 推送（带 Token 认证）
      const authRemote = await this.getAuthenticatedRemote();
      if (authRemote) {
        await this.git.push(authRemote, status.branch);
      } else {
        await this.git.push('origin', status.branch);
      }

      this.logger.log(
        `Auto sync completed: ${allChanges.length} file(s) pushed`,
      );

      return {
        success: true,
        message: `已同步 ${allChanges.length} 个文件`,
        changes: allChanges.length,
      };
    } catch (error) {
      this.logger.error(`Auto sync failed: ${error}`);
      return {
        success: false,
        message: `同步失败: ${error}`,
      };
    }
  }

  /**
   * 只拉取：从远程仓库拉取内容，不推送
   */
  async pullOnly(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 拉取（带 Token 认证）
      const authRemote = await this.getAuthenticatedRemote();
      if (authRemote) {
        await this.git.fetch(authRemote);
        const head = (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
        await this.git.raw(['rebase', 'origin/' + head]);
      } else {
        await this.git.pull('origin', undefined, { '--rebase': 'true' });
      }
      this.logger.log('Pull completed');

      return {
        success: true,
        message: '拉取完成',
      };
    } catch (error) {
      this.logger.error(`Pull failed: ${error}`);
      return {
        success: false,
        message: `拉取失败: ${error}`,
      };
    }
  }

  /**
   * 自动拉取：网页加载时调用，只拉取不推送
   */
  async autoPull(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 检查是否有远程仓库
      const remotes = await this.git.getRemotes(true);
      const hasOrigin = remotes.some((r) => r.name === 'origin');
      
      if (!hasOrigin) {
        this.logger.log('No remote repository configured');
        return { success: true, message: '未配置远程仓库' };
      }

      // 拉取（带 Token 认证）
      const authRemote = await this.getAuthenticatedRemote();
      if (authRemote) {
        await this.git.fetch(authRemote);
        const head = (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
        await this.git.raw(['rebase', 'origin/' + head]);
      } else {
        await this.git.pull('origin', undefined, { '--rebase': 'true' });
      }
      this.logger.log('Auto pull completed');

      return {
        success: true,
        message: '自动拉取完成',
      };
    } catch (error) {
      this.logger.error(`Auto pull failed: ${error}`);
      return {
        success: false,
        message: `自动拉取失败: ${error}`,
      };
    }
  }

  /**
   * 强制同步：手动 pull --rebase
   */
  async forceSync(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 拉取（带 Token 认证）
      const authRemote = await this.getAuthenticatedRemote();
      if (authRemote) {
        await this.git.fetch(authRemote);
        const head = (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
        await this.git.raw(['rebase', 'origin/' + head]);
      } else {
        await this.git.pull('origin', undefined, { '--rebase': 'true' });
      }
      this.logger.log('Force sync (pull --rebase) completed');

      return {
        success: true,
        message: '同步完成',
      };
    } catch (error) {
      this.logger.error(`Force sync failed: ${error}`);
      return {
        success: false,
        message: `同步失败: ${error}`,
      };
    }
  }

  /**
   * 获取远程仓库地址（脱敏，不暴露 Token）
   */
  async getRemoteUrl(): Promise<{ url: string | null }> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      let url = origin?.refs?.push || null;
      // 脱敏：移除 URL 中的 token
      if (url && url.includes('@')) {
        url = url.replace(/https?:\/\/[^@]+@/, 'https://');
      }
      return { url };
    } catch (error) {
      this.logger.error(`Failed to get remote: ${error}`);
      return { url: null };
    }
  }

  /**
   * 检查是否已配置 Token
   */
  async hasToken(): Promise<{ hasToken: boolean }> {
    const token = await this.getToken();
    return { hasToken: !!token };
  }

  /**
   * 设置远程仓库地址
   */
  async setRemoteUrl(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const remotes = await this.git.getRemotes(true);
      const hasOrigin = remotes.some((r) => r.name === 'origin');

      // 脱敏：移除旧 URL 中的 token 再存储
      let cleanUrl = url;
      if (cleanUrl.includes('@')) {
        cleanUrl = cleanUrl.replace(/https?:\/\/[^@]+@/, 'https://');
      }

      if (hasOrigin) {
        await this.git.raw(['remote', 'set-url', 'origin', cleanUrl]);
      } else {
        await this.git.addRemote('origin', cleanUrl);
      }

      this.logger.log(`Remote URL set to: ${cleanUrl}`);
      return { success: true, message: `远程仓库已设置为: ${cleanUrl}` };
    } catch (error) {
      this.logger.error(`Failed to set remote: ${error}`);
      return { success: false, message: `设置失败: ${error}` };
    }
  }

  /**
   * 初始化 Git 仓库
   */
  async initRepo(repoUrl?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const git = simpleGit(this.vaultPath);
      const isRepo = await git.checkIsRepo();

      if (!isRepo) {
        await git.init();
        this.logger.log('Git repository initialized');

        if (repoUrl) {
          await git.addRemote('origin', repoUrl);
          this.logger.log(`Remote added: ${repoUrl}`);
        }

        await git.add('-A');
        await git.commit('Initial commit');
      }

      return {
        success: true,
        message: isRepo ? '仓库已存在' : '仓库初始化完成',
      };
    } catch (error) {
      this.logger.error(`Git init failed: ${error}`);
      return { success: false, message: `初始化失败: ${error}` };
    }
  }
}
