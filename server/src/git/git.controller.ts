import { Controller, Get, Post, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GitService } from './git.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@ApiTags('Git')
@Controller('api/git')
export class GitController {
  constructor(private readonly gitService: GitService) {}

  @Get('mirror')
  @ApiOperation({ summary: '获取GitHub镜像配置' })
  async getMirror() {
    try {
      const configPath = path.join(path.resolve('./vaults'), '.mirror-config.json');
      const config = await fs.readFile(configPath, 'utf-8');
      return { data: JSON.parse(config) };
    } catch {
      return { data: { enabled: false, url: 'gh-proxy.com' } };
    }
  }

  @Post('mirror')
  @ApiOperation({ summary: '保存GitHub镜像配置' })
  async saveMirror(@Body() body: { enabled: boolean; url: string }) {
    const configPath = path.join(path.resolve('./vaults'), '.mirror-config.json');
    await fs.writeFile(configPath, JSON.stringify(body, null, 2));
    return { data: { success: true } };
  }

  @Get('status')
  @ApiOperation({ summary: '获取 Git 仓库状态' })
  getStatus() {
    return this.gitService.getStatus();
  }

  @Get('remote')
  @ApiOperation({ summary: '获取远程仓库地址' })
  getRemote() {
    return this.gitService.getRemoteUrl();
  }

  @Post('remote')
  @ApiOperation({ summary: '设置远程仓库地址' })
  setRemote(@Body() body: { url: string }) {
    return this.gitService.setRemoteUrl(body.url);
  }

  @Get('token')
  @ApiOperation({ summary: '检查是否已配置 Token' })
  hasToken() {
    return this.gitService.hasToken();
  }

  @Post('token')
  @ApiOperation({ summary: '保存 Git 访问 Token' })
  saveToken(@Body() body: { token: string }) {
    return this.gitService.saveToken(body.token);
  }

  @Delete('token')
  @ApiOperation({ summary: '删除 Git 访问 Token' })
  removeToken() {
    return this.gitService.removeToken();
  }

  @Post('sync')
  @ApiOperation({ summary: '强制同步 (pull --rebase)' })
  forceSync() {
    return this.gitService.forceSync();
  }

  @Post('pull')
  @ApiOperation({ summary: '拉取远程仓库内容（只读）' })
  pullOnly() {
    return this.gitService.pullOnly();
  }

  @Post('auto-pull')
  @ApiOperation({ summary: '自动拉取（网页加载时调用）' })
  autoPull() {
    return this.gitService.autoPull();
  }

  @Post('auto-sync')
  @ApiOperation({ summary: '手动触发自动同步 (add + commit + push)' })
  autoSync() {
    return this.gitService.autoSync();
  }

  @Post('init')
  @ApiOperation({ summary: '初始化 Git 仓库' })
  initRepo() {
    return this.gitService.initRepo();
  }
}
