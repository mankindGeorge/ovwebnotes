import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('api/v1/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  @Post('summary')
  @ApiOperation({ summary: 'AI 摘要生成 (预留接口)' })
  @HttpCode(HttpStatus.OK)
  async generateSummary(
    @Body() body: { content: string; noteId?: string },
  ) {
    this.logger.log(`AI summary request for note: ${body.noteId || 'unknown'}`);

    // 预留 AI 接口 - 实际使用时对接 AI API
    const aiApiUrl = process.env.AI_API_URL;

    if (!aiApiUrl) {
      // 返回模拟摘要
      const wordCount = body.content.split(/\s+/).length;
      const lineCount = body.content.split('\n').length;

      return {
        success: true,
        summary: `[AI 摘要 - 预留接口]\n\n文档统计：共 ${wordCount} 词，${lineCount} 行。\n\n请配置 AI_API_URL 环境变量以启用 AI 摘要功能。`,
        noteId: body.noteId,
        generatedAt: new Date().toISOString(),
        mode: 'placeholder',
      };
    }

    // 实际 AI API 调用 (预留)
    try {
      // TODO: 实现实际的 AI API 调用
      // const response = await fetch(`${aiApiUrl}/summary`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: body.content }),
      // });
      // const data = await response.json();
      // return data;

      return {
        success: true,
        summary: 'AI API integration pending.',
        noteId: body.noteId,
        generatedAt: new Date().toISOString(),
        mode: 'api',
      };
    } catch (error) {
      this.logger.error(`AI API call failed: ${error}`);
      return {
        success: false,
        summary: 'Failed to generate summary',
        error: String(error),
      };
    }
  }
}
