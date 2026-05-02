import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { NotesModule } from './notes/notes.module';
import { FilesModule } from './files/files.module';
import { GitModule } from './git/git.module';
import { AiModule } from './ai/ai.module';
import { IngestModule } from './ingest/ingest.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    PrismaModule,
    // 静态文件服务 - uploads 目录
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    StorageModule,
    NotesModule,
    FilesModule,
    GitModule,
    AiModule,
    IngestModule,
    WebhooksModule,
    RepositoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
