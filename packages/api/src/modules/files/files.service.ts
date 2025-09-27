import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  path: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    originalSize: number;
    compressedSize: number;
  };
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;
  private readonly thumbnailDir: string;
  private readonly placeholderDir: string;
  
  // 文件类型白名单
  private readonly allowedMimeTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
  };

  // 文件大小限制 (字节)
  private readonly fileSizeLimits = {
    image: 10 * 1024 * 1024, // 10MB
    document: 50 * 1024 * 1024, // 50MB
    video: 200 * 1024 * 1024, // 200MB
  };

  constructor(private configService: ConfigService) {
    this.uploadDir = join(process.cwd(), 'uploads');
    this.thumbnailDir = join(this.uploadDir, 'thumbnails');
    this.placeholderDir = join(this.uploadDir, 'placeholders');
    
    // 确保目录存在
    [this.uploadDir, this.thumbnailDir, this.placeholderDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    // 生成默认占位图
    this.generateDefaultPlaceholders();
  }

  /**
   * 检查文件是否被允许上传（白名单验证）
   */
  isFileAllowed(file: Express.Multer.File): boolean {
    if (!file) return false;
    
    const fileType = this.getFileType(file.mimetype);
    return fileType !== null;
  }

  async uploadFile(
    file: Express.Multer.File, 
    options: ImageProcessingOptions = {}
  ): Promise<UploadResult> {
    if (!file.filename) {
      throw new BadRequestException('Failed to persist file to disk');
    }

    // 验证文件类型和大小
    this.validateFile(file);

    const baseUrl = this.configService.get('PUBLIC_BASE_URL') || this.configService.get('BASE_URL') || 'http://localhost:3000';
    const publicPath = this.configService.get('UPLOADS_PUBLIC_PATH', '/uploads');
    const normalizedPublicPath = publicPath.endsWith('/') ? publicPath.slice(0, -1) : publicPath;

    const filePath = join(this.uploadDir, file.filename);
    let result: UploadResult = {
      url: `${baseUrl.replace(/\/$/, '')}${normalizedPublicPath}/${file.filename}`,
      filename: file.filename,
      size: file.size,
      path: `${normalizedPublicPath}/${file.filename}`,
    };

    // 如果是图片文件，进行压缩和缩略图处理
    if (this.isImageFile(file.mimetype)) {
      try {
        const processedResult = await this.processImage(filePath, options);
        result = { ...result, ...processedResult };
      } catch (error) {
        this.logger.warn(`Failed to process image ${file.filename}:`, error);
        // 如果图片处理失败，仍然返回原始文件信息
      }
    }

    return result;
  }

  /**
   * 处理图片：压缩、调整尺寸、生成缩略图
   */
  private async processImage(
    filePath: string,
    options: ImageProcessingOptions
  ): Promise<Partial<UploadResult>> {
    const {
      width = 1920,
      height = 1080,
      quality = 85,
      format = 'jpeg',
      generateThumbnail = true,
      thumbnailSize = 300,
    } = options;

    const image = sharp(filePath);
    const metadata = await image.metadata();
    const originalSize = readFileSync(filePath).length;

    // 生成压缩后的主图
    const processedImage = image
      .resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality });

    const processedBuffer = await processedImage.toBuffer();
    const processedSize = processedBuffer.length;

    // 如果压缩后文件更小，则替换原文件
    if (processedSize < originalSize) {
      writeFileSync(filePath, processedBuffer);
    }

    const result: Partial<UploadResult> = {
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        originalSize,
        compressedSize: processedSize,
      },
    };

    // 生成缩略图
    if (generateThumbnail) {
      const thumbnailFilename = `thumb_${uuidv4()}.jpg`;
      const thumbnailPath = join(this.thumbnailDir, thumbnailFilename);
      
      await image
        .resize(thumbnailSize, thumbnailSize, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      const baseUrl = this.configService.get('PUBLIC_BASE_URL') || this.configService.get('BASE_URL') || 'http://localhost:3000';
      const publicPath = this.configService.get('UPLOADS_PUBLIC_PATH', '/uploads');
      const normalizedPublicPath = publicPath.endsWith('/') ? publicPath.slice(0, -1) : publicPath;

      result.thumbnailUrl = `${baseUrl.replace(/\/$/, '')}${normalizedPublicPath}/thumbnails/${thumbnailFilename}`;
      result.thumbnailPath = `${normalizedPublicPath}/thumbnails/${thumbnailFilename}`;
    }

    return result;
  }

  /**
   * 验证文件类型和大小
   */
  private validateFile(file: Express.Multer.File): void {
    const fileType = this.getFileType(file.mimetype);
    
    if (!fileType) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const sizeLimit = this.fileSizeLimits[fileType];
    if (file.size > sizeLimit) {
      throw new BadRequestException(
        `File size exceeds limit. Maximum allowed: ${this.formatFileSize(sizeLimit)}, actual: ${this.formatFileSize(file.size)}`
      );
    }
  }

  /**
   * 获取文件类型
   */
  private getFileType(mimeType: string): keyof typeof this.allowedMimeTypes | null {
    for (const [type, mimes] of Object.entries(this.allowedMimeTypes)) {
      if (mimes.includes(mimeType)) {
        return type as keyof typeof this.allowedMimeTypes;
      }
    }
    return null;
  }

  /**
   * 检查是否为图片文件
   */
  private isImageFile(mimeType: string): boolean {
    return this.allowedMimeTypes.image.includes(mimeType);
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 生成默认占位图
   */
  private generateDefaultPlaceholders(): void {
    const sizes = [
      { name: 'placeholder-300x200.jpg', width: 300, height: 200 },
      { name: 'placeholder-600x400.jpg', width: 600, height: 400 },
      { name: 'placeholder-1200x800.jpg', width: 1200, height: 800 },
    ];

    sizes.forEach(({ name, width, height }) => {
      const placeholderPath = join(this.placeholderDir, name);
      if (!existsSync(placeholderPath)) {
        try {
          const placeholder = sharp({
            create: {
              width,
              height,
              channels: 3,
              background: { r: 240, g: 240, b: 240 }
            }
          })
          .jpeg({ quality: 60 })
          .toBuffer();

          placeholder.then(buffer => {
            writeFileSync(placeholderPath, buffer);
            this.logger.log(`Generated placeholder: ${name}`);
          });
        } catch (error) {
          this.logger.warn(`Failed to generate placeholder ${name}:`, error);
        }
      }
    });
  }

  /**
   * 获取占位图URL
   */
  getPlaceholderUrl(width: number, height: number): string {
    const baseUrl = this.configService.get('PUBLIC_BASE_URL') || this.configService.get('BASE_URL') || 'http://localhost:3000';
    const publicPath = this.configService.get('UPLOADS_PUBLIC_PATH', '/uploads');
    const normalizedPublicPath = publicPath.endsWith('/') ? publicPath.slice(0, -1) : publicPath;

    // 选择最接近的占位图尺寸
    const sizes = [300, 600, 1200];
    const closestSize = sizes.reduce((prev, curr) => 
      Math.abs(curr - Math.max(width, height)) < Math.abs(prev - Math.max(width, height)) ? curr : prev
    );

    return `${baseUrl.replace(/\/$/, '')}${normalizedPublicPath}/placeholders/placeholder-${closestSize}x${Math.round(closestSize * 0.67)}.jpg`;
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