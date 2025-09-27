import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('admin/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @RequirePermissions('tenant:files:upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      // 允许的图片类型
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('只支持图片文件 (JPEG, PNG, GIF, WebP)'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('没有上传文件');
    }

    return this.filesService.uploadFile(file);
  }
  
  @Get(':filename')
  async serveFile(@Param('filename') filename: string, @Res() res: any) {
    try {
      const fileStream = await this.filesService.getFileStream(filename);
      fileStream.pipe(res);
    } catch (error) {
      throw new BadRequestException('文件不存在');
    }
  }
}