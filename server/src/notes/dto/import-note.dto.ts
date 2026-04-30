import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportNoteDto {
  @ApiProperty({ description: '笔记标题', example: '我的笔记' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '笔记内容 (Markdown)', example: '# Hello' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: '标签列表', example: ['标签1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: '文件夹路径', example: '/Notes' })
  @IsString()
  @IsOptional()
  folderPath?: string;
}
