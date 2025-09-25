import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly uploadDir: string;
  
  constructor(private configService: ConfigService) {
    this.uploadDir = join(process.cwd(), 'uploads');
    // 确保上传目录存在
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; filename: string; size: number }> {
    // 生成唯一文件名
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    
    // 在生产环境中，这里应该上传到对象存储（如阿里云OSS、AWS S3等）
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    const fileUrl = `${baseUrl}/uploads/${uniqueFilename}`;

    return {
      url: fileUrl,
      filename: uniqueFilename,
      size: file.size,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    // 删除文件的实现
    // 在生产环境中，这里应该从对象存储中删除文件
    const fs = require('fs');
    const path = require('path');
    
    try {
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  }
  
  async getFileStream(filename: string): Promise<any> {
    const filePath = join(this.uploadDir, filename);
    if (!existsSync(filePath)) {
      throw new BadRequestException('文件不存在');
    }
    
    return createReadStream(filePath);
  }
}
