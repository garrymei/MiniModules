import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ImageCompressionService, CompressionResult, CompressionOptions } from '../../services/image-compression.service';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements OnInit {
  @Input() maxFiles: number = 5;
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB
  @Input() acceptedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];
  @Input() compressionOptions: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'jpeg'
  };
  @Input() enableCompression: boolean = true;
  @Input() showPreview: boolean = true;
  @Input() showProgress: boolean = true;
  @Input() placeholder: string = '点击或拖拽上传图片';

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() filesCompressed = new EventEmitter<CompressionResult[]>();
  @Output() uploadProgress = new EventEmitter<number>();
  @Output() uploadComplete = new EventEmitter<CompressionResult[]>();
  @Output() uploadError = new EventEmitter<string>();

  selectedFiles: File[] = [];
  compressedFiles: CompressionResult[] = [];
  isUploading: boolean = false;
  uploadProgressValue: number = 0;
  dragOver: boolean = false;

  constructor(private imageCompressionService: ImageCompressionService) {}

  ngOnInit(): void {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  private async handleFiles(files: File[]): Promise<void> {
    // 验证文件
    const validFiles = this.validateFiles(files);
    if (validFiles.length === 0) {
      return;
    }

    // 限制文件数量
    const remainingSlots = this.maxFiles - this.selectedFiles.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);

    this.selectedFiles = [...this.selectedFiles, ...filesToProcess];
    this.filesSelected.emit(this.selectedFiles);

    if (this.enableCompression) {
      await this.compressFiles(filesToProcess);
    } else {
      // 如果不压缩，直接使用原文件
      const results = filesToProcess.map(file => ({
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
      }));
      this.compressedFiles = [...this.compressedFiles, ...results];
      this.filesCompressed.emit(this.compressedFiles);
    }
  }

  private validateFiles(files: File[]): File[] {
    const validFiles: File[] = [];

    for (const file of files) {
      // 检查文件类型
      if (!this.acceptedTypes.includes(file.type)) {
        this.uploadError.emit(`文件 ${file.name} 类型不支持`);
        continue;
      }

      // 检查文件大小
      if (file.size > this.maxFileSize) {
        this.uploadError.emit(`文件 ${file.name} 超过大小限制`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }

  private async compressFiles(files: File[]): Promise<void> {
    this.isUploading = true;
    this.uploadProgressValue = 0;

    try {
      const results = await this.imageCompressionService.compressImages(files, this.compressionOptions);
      this.compressedFiles = [...this.compressedFiles, ...results];
      this.filesCompressed.emit(this.compressedFiles);
      this.uploadComplete.emit(results);
    } catch (error) {
      this.uploadError.emit('图片压缩失败');
    } finally {
      this.isUploading = false;
      this.uploadProgressValue = 100;
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.compressedFiles.splice(index, 1);
    this.filesSelected.emit(this.selectedFiles);
    this.filesCompressed.emit(this.compressedFiles);
  }

  clearFiles(): void {
    this.selectedFiles = [];
    this.compressedFiles = [];
    this.filesSelected.emit(this.selectedFiles);
    this.filesCompressed.emit(this.compressedFiles);
  }

  getFilePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  getCompressionStats(): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavings: number;
    averageCompressionRatio: number;
  } {
    return this.imageCompressionService.getCompressionStats(this.compressedFiles);
  }

  formatFileSize(bytes: number): string {
    return this.imageCompressionService.formatFileSize(bytes);
  }

  getCompressionSuggestion(file: File): {
    recommended: boolean;
    reason: string;
    suggestedOptions: CompressionOptions;
  } {
    return this.imageCompressionService.getCompressionSuggestion(file);
  }
}
