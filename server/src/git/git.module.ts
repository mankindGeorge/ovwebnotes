import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GitService } from './git.service';
import { GitController } from './git.controller';
import { GitScheduler } from './git.scheduler';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GitController],
  providers: [GitService, GitScheduler],
  exports: [GitService],
})
export class GitModule {}
