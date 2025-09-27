import { Injectable } from '@angular/core';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
  enableWebP?: boolean;
}

export interface CompressionResult {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: {
    original: { width: number; height: number };
    compressed: { width: number; height: number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {

  /**
   * 压缩图片
   */
  async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg',
      maintainAspectRatio = true,
      enableWebP = true
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // 计算新尺寸
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight,
            maintainAspectRatio
          );

          // 设置canvas尺寸
          canvas.width = width;
          canvas.height = height;

          // 绘制图片
          ctx?.drawImage(img, 0, 0, width, height);

          // 选择输出格式
          const outputFormat = this.selectOutputFormat(format, enableWebP);

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // 创建压缩后的文件
              const compressedFile = new File(
                [blob],
                this.generateFileName(file.name, outputFormat),
                { type: blob.type }
              );

              const result: CompressionResult = {
                originalFile: file,
                compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: (1 - blob.size / file.size) * 100,
                format: outputFormat,
                dimensions: {
                  original: { width: img.width, height: img.height },
                  compressed: { width, height }
                }
              };

              resolve(result);
            },
            `image/${outputFormat}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // 加载图片
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 批量压缩图片
   */
  async compressImages(
    files: File[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.compressImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // 如果压缩失败，返回原文件
        results.push({
          originalFile: file,
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          format: file.type.split('/')[1] || 'unknown',
          dimensions: {
            original: { width: 0, height: 0 },
            compressed: { width: 0, height: 0 }
          }
        });
      }
    }

    return results;
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(
    file: File,
    size: number = 200,
    quality: number = 0.7
  ): Promise<File> {
    const result = await this.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality,
      format: 'jpeg'
    });

    return result.compressedFile;
  }

  /**
   * 调整图片尺寸
   */
  async resizeImage(
    file: File,
    width: number,
    height: number,
    quality: number = 0.8
  ): Promise<File> {
    const result = await this.compressImage(file, {
      maxWidth: width,
      maxHeight: height,
      quality,
      maintainAspectRatio: false
    });

    return result.compressedFile;
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
    aspectRatio: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          aspectRatio: img.width / img.height
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 检查是否需要压缩
   */
  shouldCompress(file: File, options: {
    maxSize?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}): boolean {
    const { maxSize = 2 * 1024 * 1024, maxWidth = 1920, maxHeight = 1080 } = options;

    // 检查文件大小
    if (file.size > maxSize) {
      return true;
    }

    // 检查图片尺寸（需要异步获取）
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img.width > maxWidth || img.height > maxHeight);
      };
      img.onerror = () => resolve(false);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }) as any;
  }

  /**
   * 计算新尺寸
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (maintainAspectRatio) {
      const aspectRatio = originalWidth / originalHeight;
      
      if (originalWidth > originalHeight) {
        return {
          width: maxWidth,
          height: Math.round(maxWidth / aspectRatio)
        };
      } else {
        return {
          width: Math.round(maxHeight * aspectRatio),
          height: maxHeight
        };
      }
    } else {
      return { width: maxWidth, height: maxHeight };
    }
  }

  /**
   * 选择输出格式
   */
  private selectOutputFormat(
    preferredFormat: string,
    enableWebP: boolean
  ): string {
    if (enableWebP && this.supportsWebP()) {
      return 'webp';
    }
    return preferredFormat;
  }

  /**
   * 检查是否支持WebP
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * 生成文件名
   */
  private generateFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_compressed.${format}`;
  }

  /**
   * 创建占位符图片
   */
  createPlaceholder(
    width: number,
    height: number,
    text: string = 'Image',
    backgroundColor: string = '#f0f0f0',
    textColor: string = '#666'
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = width;
      canvas.height = height;

      // 绘制背景
      ctx!.fillStyle = backgroundColor;
      ctx!.fillRect(0, 0, width, height);

      // 绘制文字
      ctx!.fillStyle = textColor;
      ctx!.font = `${Math.min(width, height) / 10}px Arial`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(text, width / 2, height / 2);

      // 转换为文件
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'placeholder.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png');
    });
  }

  /**
   * 获取压缩建议
   */
  getCompressionSuggestion(file: File): {
    recommended: boolean;
    reason: string;
    suggestedOptions: CompressionOptions;
  } {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const maxDimension = 1920;

    if (file.size <= maxSize) {
      return {
        recommended: false,
        reason: 'File size is already optimal',
        suggestedOptions: {}
      };
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return {
        recommended: true,
        reason: 'File is very large, aggressive compression recommended',
        suggestedOptions: {
          maxWidth: 1280,
          maxHeight: 720,
          quality: 0.6,
          format: 'jpeg'
        }
      };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return {
        recommended: true,
        reason: 'File is large, moderate compression recommended',
        suggestedOptions: {
          maxWidth: 1600,
          maxHeight: 900,
          quality: 0.7,
          format: 'jpeg'
        }
      };
    }

    return {
      recommended: true,
      reason: 'File can be optimized for better performance',
      suggestedOptions: {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        quality: 0.8,
        format: 'jpeg'
      }
    };
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取压缩统计
   */
  getCompressionStats(results: CompressionResult[]): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavings: number;
    averageCompressionRatio: number;
    filesProcessed: number;
  } {
    const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0);
    const totalSavings = totalOriginalSize - totalCompressedSize;
    const averageCompressionRatio = results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length;

    return {
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageCompressionRatio,
      filesProcessed: results.length
    };
  }
}
