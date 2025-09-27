import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface QRCodeData {
  type: 'order_verification' | 'booking_verification';
  orderId?: string;
  bookingId?: string;
  code: string;
  timestamp: number;
}

export interface VerificationInfo {
  orderId: string;
  qrCodeData: string;
  verificationCode: string;
  expiresAt?: Date;
  status: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  order?: any;
  booking?: any;
}

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {
  private qrCodeSubject = new BehaviorSubject<string>('');
  public qrCode$ = this.qrCodeSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * 生成二维码数据
   */
  generateQRCodeData(data: any): string {
    return JSON.stringify(data);
  }

  /**
   * 解析二维码数据
   */
  parseQRCodeData(qrData: string): QRCodeData | null {
    try {
      return JSON.parse(qrData);
    } catch (error) {
      console.error('Failed to parse QR code data:', error);
      return null;
    }
  }

  /**
   * 获取订单核销信息
   */
  getOrderVerificationInfo(orderId: string): Observable<VerificationInfo> {
    return this.http.get<VerificationInfo>(`/api/orders/${orderId}/verification`).pipe(
      tap(info => {
        // 更新二维码数据
        this.qrCodeSubject.next(info.qrCodeData);
      }),
      catchError(error => {
        console.error('Failed to get order verification info:', error);
        throw error;
      })
    );
  }

  /**
   * 获取预约核销信息
   */
  getBookingVerificationInfo(bookingId: string): Observable<VerificationInfo> {
    return this.http.get<VerificationInfo>(`/api/bookings/${bookingId}/verification`).pipe(
      tap(info => {
        // 更新二维码数据
        this.qrCodeSubject.next(info.qrCodeData);
      }),
      catchError(error => {
        console.error('Failed to get booking verification info:', error);
        throw error;
      })
    );
  }

  /**
   * 验证订单码
   */
  verifyOrderCode(code: string, tenantId: string, verifiedBy?: string): Observable<VerificationResult> {
    return this.http.post<VerificationResult>('/api/orders/verify', {
      code,
      tenantId,
      verifiedBy
    });
  }

  /**
   * 验证预约码
   */
  verifyBookingCode(code: string, tenantId: string, verifiedBy?: string): Observable<VerificationResult> {
    return this.http.post<VerificationResult>('/api/bookings/verify', {
      code,
      tenantId,
      verifiedBy
    });
  }

  /**
   * 生成二维码图片（使用Canvas）
   */
  generateQRCodeImage(qrData: string, size: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      // 这里使用简单的文本二维码生成
      // 在实际项目中，您需要引入专门的二维码库
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = size;
      canvas.height = size;

      // 设置背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // 绘制边框
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, size, size);

      // 绘制文本
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 分行显示文本
      const lines = this.wrapText(qrData, size - 20);
      const lineHeight = 16;
      const startY = (size - (lines.length * lineHeight)) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, size / 2, startY + (index * lineHeight));
      });

      // 转换为base64
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    });
  }

  /**
   * 文本换行处理
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word;
      const metrics = this.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * 测量文本宽度
   */
  private measureText(text: string): { width: number; height: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { width: 0, height: 0 };
    }

    ctx.font = '12px Arial';
    const metrics = ctx.measureText(text);
    
    return {
      width: metrics.width,
      height: 16
    };
  }

  /**
   * 保存二维码到相册
   */
  async saveQRCodeToAlbum(qrData: string, filename: string = 'qrcode.png'): Promise<boolean> {
    try {
      // 生成二维码图片
      const dataURL = await this.generateQRCodeImage(qrData);
      
      // 转换为Blob
      const blob = this.dataURLToBlob(dataURL);
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Failed to save QR code:', error);
      return false;
    }
  }

  /**
   * 将DataURL转换为Blob
   */
  private dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  /**
   * 验证二维码格式
   */
  validateQRCode(qrData: string): { valid: boolean; type?: string; error?: string } {
    try {
      const data = JSON.parse(qrData);
      
      if (!data.type) {
        return { valid: false, error: 'Missing type field' };
      }

      if (!['order_verification', 'booking_verification'].includes(data.type)) {
        return { valid: false, error: 'Invalid type' };
      }

      if (!data.code) {
        return { valid: false, error: 'Missing verification code' };
      }

      if (!data.timestamp) {
        return { valid: false, error: 'Missing timestamp' };
      }

      // 检查时间戳是否过期（30分钟）
      const now = Date.now();
      const codeTime = data.timestamp;
      const maxAge = 30 * 60 * 1000; // 30分钟

      if (now - codeTime > maxAge) {
        return { valid: false, error: 'QR code expired' };
      }

      return { valid: true, type: data.type };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * 获取二维码状态
   */
  getQRCodeStatus(): Observable<string> {
    return this.qrCode$;
  }

  /**
   * 清除二维码数据
   */
  clearQRCode(): void {
    this.qrCodeSubject.next('');
  }

  /**
   * 生成二维码分享链接
   */
  generateShareLink(qrData: string, baseUrl: string = window.location.origin): string {
    const encodedData = encodeURIComponent(qrData);
    return `${baseUrl}/verify?data=${encodedData}`;
  }

  /**
   * 从分享链接解析二维码数据
   */
  parseShareLink(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const data = urlObj.searchParams.get('data');
      return data ? decodeURIComponent(data) : null;
    } catch (error) {
      console.error('Failed to parse share link:', error);
      return null;
    }
  }

  /**
   * 获取二维码统计信息
   */
  getQRCodeStats(): Observable<{
    totalGenerated: number;
    totalVerified: number;
    successRate: number;
    recentActivity: Array<{
      type: string;
      timestamp: Date;
      success: boolean;
    }>;
  }> {
    return this.http.get('/api/qrcode/stats');
  }
}
