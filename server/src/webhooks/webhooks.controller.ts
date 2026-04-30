import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  @Post('notify')
  @ApiOperation({ summary: 'Git 同步完成通知' })
  @HttpCode(HttpStatus.OK)
  async notify(@Body() body: { event: string; status: string; message?: string }) {
    this.logger.log(
      `Webhook notification received: ${body.event} - ${body.status}`,
    );

    // 处理不同类型的 webhook 通知
    switch (body.event) {
      case 'git.sync.completed':
        this.logger.log(`Git sync completed: ${body.message}`);
        break;
      case 'git.sync.failed':
        this.logger.warn(`Git sync failed: ${body.message}`);
        break;
      case 'note.created':
        this.logger.log(`Note created via webhook`);
        break;
      case 'note.updated':
        this.logger.log(`Note updated via webhook`);
        break;
      default:
        this.logger.log(`Unknown webhook event: ${body.event}`);
    }

    return {
      success: true,
      message: `Webhook ${body.event} processed`,
      timestamp: new Date().toISOString(),
    };
  }
}
