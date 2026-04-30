import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { PathGuardGuard } from '../common/guards/path-guard.guard';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response, Request } from 'express';

const multerOptions = {
  storage: diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    // 允许的文件类型
    const allowedMimes = [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      'text/markdown',
      'text/plain',
      'application/pdf',
      'application/json',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
};

@ApiTags('Files')
@Controller('api/files')
@UseGuards(PathGuardGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'is_cloud', required: false, type: Boolean, description: '是否存储到云端' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('is_cloud', new ParseBoolPipe({ optional: true })) isCloud: boolean = false,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.filesService.saveFile(file, isCloud);
  }

  @Get(':path(*)')
  @ApiOperation({ summary: '下载/预览文件' })
  @ApiParam({ name: 'path', description: '文件路径' })
  async getFile(@Param('path') filePath: string, @Res() res: Response) {
    const { stream, mimeType, fileName } = await this.filesService.getFile(filePath);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileName)}"`,
    );
    stream.pipe(res);
  }

  @Delete(':path(*)')
  @ApiOperation({ summary: '删除文件' })
  @ApiParam({ name: 'path', description: '文件路径' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param('path') filePath: string) {
    await this.filesService.deleteFile(filePath);
  }
}
