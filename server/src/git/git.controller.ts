import { Controller, Get, Post, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GitService } from './git.service';

@ApiTags('Git')
@Controller('api/git')
export class GitController {
  constructor(private readonly gitService: GitService) {}

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
