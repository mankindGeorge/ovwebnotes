import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { FileAdapter } from './file.adapter';
import { DbAdapter } from './db.adapter';
import { VAULT_PATH_TOKEN } from './storage.constants';

@Global()
@Module({
  providers: [
    {
      provide: VAULT_PATH_TOKEN,
      useValue: process.env.VAULT_PATH || './vaults',
    },
    StorageService,
    FileAdapter,
    DbAdapter,
  ],
  exports: [StorageService, FileAdapter, DbAdapter],
})
export class StorageModule {}
