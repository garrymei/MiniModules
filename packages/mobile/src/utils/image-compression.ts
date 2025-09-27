import Taro from '@tarojs/taro';

export interface CompressionOptions {
  quality?: number; // 压缩质量 0-1
  maxWidth?: number; // 最大宽度
  maxHeight?: number; // 最大高度
  maxSize?: number; // 最大文件大小（字节）
}

export interface CompressionResult {
  tempFilePath: string;
  size: number;
  width: number;
  height: number;
}

/**
 * 图片压缩工具
 */
export class ImageCompression {
  private static readonly DEFAULT_OPTIONS: Required<CompressionOptions> = {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    maxSize: 2 * 1024 * 1024, // 2MB
  };

  /**
   * 压缩图片
   */
  static async compressImage(
    filePath: string,
    options: CompressionOptions = {},
  ): Promise<CompressionResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // 获取图片信息
      const imageInfo = await Taro.getImageInfo({ src: filePath });
      
      // 计算压缩后的尺寸
      const { width, height } = this.calculateDimensions(
        imageInfo.width,
        imageInfo.height,
        opts.maxWidth,
        opts.maxHeight,
      );

      // 压缩图片
      const result = await Taro.compressImage({
        src: filePath,
        quality: opts.quality,
        width,
        height,
      });

      // 检查文件大小
      const fileInfo = await Taro.getFileInfo({ filePath: result.tempFilePath });
      
      if (fileInfo.size > opts.maxSize) {
        // 如果还是太大，进一步降低质量
        const newQuality = Math.max(0.1, opts.quality * 0.7);
        return this.compressImage(filePath, { ...options, quality: newQuality });
      }

      return {
        tempFilePath: result.tempFilePath,
        size: fileInfo.size,
        width,
        height,
      };
    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error('图片压缩失败');
    }
  }

  /**
   * 计算压缩后的尺寸
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // 如果图片尺寸超过最大限制，按比例缩放
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);

      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    return { width, height };
  }

  /**
   * 批量压缩图片
   */
  static async compressImages(
    filePaths: string[],
    options: CompressionOptions = {},
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.compressImage(filePath, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compress image ${filePath}:`, error);
        // 如果压缩失败，使用原图
        const fileInfo = await Taro.getFileInfo({ filePath });
        results.push({
          tempFilePath: filePath,
          size: fileInfo.size,
          width: 0,
          height: 0,
        });
      }
    }

    return results;
  }

  /**
   * 检查图片是否需要压缩
   */
  static async shouldCompress(filePath: string, maxSize: number = 2 * 1024 * 1024): Promise<boolean> {
    try {
      const fileInfo = await Taro.getFileInfo({ filePath });
      return fileInfo.size > maxSize;
    } catch (error) {
      console.error('Failed to get file info:', error);
      return false;
    }
  }

  /**
   * 获取图片占位符
   */
  static getPlaceholder(width: number, height: number, text: string = '图片'): string {
    // 生成SVG占位符
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">
          ${text}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 预加载图片
   */
  static async preloadImage(src: string): Promise<boolean> {
    try {
      await Taro.getImageInfo({ src });
      return true;
    } catch (error) {
      console.error('Failed to preload image:', error);
      return false;
    }
  }

  /**
   * 批量预加载图片
   */
  static async preloadImages(srcs: string[]): Promise<{ src: string; success: boolean }[]> {
    const results = await Promise.allSettled(
      srcs.map(src => this.preloadImage(src))
    );

    return srcs.map((src, index) => ({
      src,
      success: results[index].status === 'fulfilled' && results[index].value,
    }));
  }
}
