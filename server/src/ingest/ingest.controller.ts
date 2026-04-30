import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class IngestDto {
  @ApiProperty({ description: '剪藏内容标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '剪藏内容 (Markdown 格式)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '来源 URL' })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: '标签' })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ description: '目标文件夹' })
  @IsString()
  @IsOptional()
  folder?: string;
}

@ApiTags('Ingest')
@Controller('api/v1/ingest')
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  @Post()
  @ApiOperation({ summary: 'Web 剪藏内容推送' })
  @HttpCode(HttpStatus.CREATED)
  async ingest(@Body() ingestDto: IngestDto) {
    this.logger.log(
      `Ingest request: "${ingestDto.title}" from ${ingestDto.url || 'unknown'}`,
    );

    // 构建剪藏笔记内容
    const sourceInfo = ingestDto.url
      ? `\n\n> 来源: [${ingestDto.url}](${ingestDto.url})\n> 剪藏时间: ${new Date().toISOString()}`
      : `\n\n> 剪藏时间: ${new Date().toISOString()}`;

    const fullContent = `${ingestDto.content}${sourceInfo}`;

    // 解析标签
    const tags = ingestDto.tags
      ? ingestDto.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['剪藏'];

    const folder = ingestDto.folder || '/Clippings';

    return {
      success: true,
      message: 'Content ingested successfully',
      data: {
        title: ingestDto.title,
        content: fullContent,
        tags,
        folderPath: folder,
        source: ingestDto.url,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
