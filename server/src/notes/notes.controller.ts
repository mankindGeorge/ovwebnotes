import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { ImportNoteDto } from './dto/import-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@ApiTags('Notes')
@Controller('api/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: '创建笔记' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: '获取笔记列表' })
  @ApiQuery({ name: 'is_cloud', required: true, type: Boolean })
  @ApiQuery({ name: 'tags', required: false, type: String, description: '逗号分隔的标签' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'folderPath', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  findAll(
    @Query('is_cloud', new ParseBoolPipe()) isCloud: boolean,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('folderPath') folderPath?: string,
    @Query('skip', new DefaultValuePipe(0)) skip?: number,
    @Query('take', new DefaultValuePipe(50)) take?: number,
  ) {
    return this.notesService.findAll({
      is_cloud: isCloud,
      tags: tags ? tags.split(',') : undefined,
      search,
      folderPath,
      skip,
      take,
    });
  }

  @Get('search')
  @ApiOperation({ summary: '搜索笔记' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'is_cloud', required: true, type: Boolean })
  search(
    @Query('q') q: string,
    @Query('is_cloud', new ParseBoolPipe()) isCloud: boolean,
  ) {
    return this.notesService.search(q, isCloud);
  }

  @Get('tags')
  @ApiOperation({ summary: '获取所有标签' })
  getAllTags() {
    return this.notesService.getAllTags();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个笔记' })
  @ApiParam({ name: 'id', description: '笔记 ID 或文件路径' })
  findOne(
    @Param('id') id: string,
    @Query('is_cloud', new DefaultValuePipe(true), ParseBoolPipe) isCloud: boolean,
  ) {
    return this.notesService.findOne(id, isCloud);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新笔记' })
  @ApiParam({ name: 'id', description: '笔记 ID 或文件路径' })
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除笔记' })
  @ApiParam({ name: 'id', description: '笔记 ID 或文件路径' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @Query('is_cloud', new DefaultValuePipe(true), ParseBoolPipe) isCloud: boolean,
  ) {
    return this.notesService.remove(id, isCloud);
  }

  @Post(':id/export')
  @ApiOperation({ summary: '下载：将云端笔记导出到本地 Vault' })
  @ApiParam({ name: 'id', description: '云端笔记 ID' })
  @HttpCode(HttpStatus.OK)
  exportToVault(@Param('id') id: string) {
    return this.notesService.exportToVault(id);
  }

  @Post(':id/import')
  @ApiOperation({ summary: '上传：将笔记导入到云端数据库' })
  @ApiParam({ name: 'id', description: '笔记 ID（前端本地笔记的 filePath）' })
  @HttpCode(HttpStatus.OK)
  importToCloud(@Param('id') id: string, @Body() body: ImportNoteDto) {
    return this.notesService.importToCloud(id, body);
  }
}
