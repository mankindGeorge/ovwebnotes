import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getInfo() {
    return {
      name: 'Ovwebnotes API',
      version: '1.0.0',
      description: 'Hybrid storage backend for Obsidian notes',
      endpoints: {
        notes: '/api/notes',
        files: '/api/files',
        ai: '/api/v1/ai',
        ingest: '/api/v1/ingest',
        webhooks: '/api/v1/webhooks',
        docs: '/api/docs',
      },
    };
  }
}
