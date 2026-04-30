import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GitService } from './git.service';

@Injectable()
export class GitScheduler {
  private readonly logger = new Logger(GitScheduler.name);

  constructor(private readonly gitService: GitService) {}

  /**
   * 每30分钟自动同步
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleAutoSync() {
    this.logger.log('Running scheduled auto sync...');
    const result = await this.gitService.autoSync();
    this.logger.log(`Scheduled sync result: ${result.message}`);
  }
}
