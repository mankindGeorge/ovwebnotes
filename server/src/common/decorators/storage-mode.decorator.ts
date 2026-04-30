import { SetMetadata } from '@nestjs/common';

export const STORAGE_MODE_KEY = 'storage_mode';

/**
 * 自定义装饰器：标记存储模式
 * @param isCloud 是否使用云端存储
 */
export const StorageMode = (isCloud: boolean) =>
  SetMetadata(STORAGE_MODE_KEY, isCloud);
