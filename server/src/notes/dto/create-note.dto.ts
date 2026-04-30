import { IsString, IsArray, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ description: '笔记标题', example: '我的第一篇笔记' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '笔记内容 (Markdown)', example: '# Hello World' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '标签列表', example: ['标签1', '标签2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: '文件夹路径', example: '/Notes' })
  @IsString()
  @IsOptional()
  folderPath?: string;

  @ApiProperty({ description: '是否存储到云端', example: true })
  @IsBoolean()
  is_cloud: boolean;

  @ApiPropertyOptional({ description: '文件路径' })
  @IsString()
  @IsOptional()
  filePath?: string;
}
