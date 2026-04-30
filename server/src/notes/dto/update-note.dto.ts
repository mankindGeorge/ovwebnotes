import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateNoteDto } from './create-note.dto';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {
  @ApiPropertyOptional({ description: '笔记标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '笔记内容 (Markdown)' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: '标签列表' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: '文件夹路径' })
  @IsString()
  @IsOptional()
  folderPath?: string;

  @ApiPropertyOptional({ description: '是否存储到云端' })
  @IsBoolean()
  @IsOptional()
  is_cloud?: boolean;

  @ApiPropertyOptional({ description: '文件路径' })
  @IsString()
  @IsOptional()
  filePath?: string;
}
