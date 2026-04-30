import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UPLOAD_DIR_TOKEN } from './files.constants';

@Module({
  controllers: [FilesController],
  providers: [
    {
      provide: UPLOAD_DIR_TOKEN,
      useValue: process.env.UPLOAD_DIR || './uploads',
    },
    FilesService,
  ],
  exports: [FilesService],
})
export class FilesModule {}
