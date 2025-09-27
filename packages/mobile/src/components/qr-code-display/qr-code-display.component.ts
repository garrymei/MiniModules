import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { QRCodeService } from '../../services/qrcode.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-qr-code-display',
  templateUrl: './qr-code-display.component.html',
  styleUrls: ['./qr-code-display.component.scss']
})
export class QRCodeDisplayComponent implements OnInit, OnDestroy {
  @Input() qrData: string = '';
  @Input() size: number = 200;
  @Input() showActions: boolean = true;
  @Input() title: string = '核销二维码';
  @Input() description: string = '请向商家出示此二维码';
  
  @Output() qrCodeGenerated = new EventEmitter<string>();
  @Output() qrCodeSaved = new EventEmitter<boolean>();
  @Output() qrCodeShared = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  
  qrCodeImage: string = '';
  loading = false;
  error: string = '';
  isExpired = false;
  remainingTime: string = '';
  private countdownInterval: any;

  constructor(private qrCodeService: QRCodeService) {}

  ngOnInit(): void {
    if (this.qrData) {
      this.generateQRCode();
      this.startCountdown();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdown();
  }

  /**
   * 生成二维码图片
   */
  generateQRCode(): void {
    if (!this.qrData) {
      this.error = '二维码数据为空';
      return;
    }

    this.loading = true;
    this.error = '';

    this.qrCodeService.generateQRCodeImage(this.qrData, this.size)
      .then(imageData => {
        this.qrCodeImage = imageData;
        this.loading = false;
        this.qrCodeGenerated.emit(imageData);
      })
      .catch(error => {
        console.error('Failed to generate QR code:', error);
        this.error = '生成二维码失败';
        this.loading = false;
      });
  }

  /**
   * 保存二维码到相册
   */
  saveToAlbum(): void {
    if (!this.qrData) return;

    this.qrCodeService.saveQRCodeToAlbum(this.qrData, 'qrcode.png')
      .then(success => {
        this.qrCodeSaved.emit(success);
        if (!success) {
          this.error = '保存失败';
        }
      })
      .catch(error => {
        console.error('Failed to save QR code:', error);
        this.error = '保存失败';
        this.qrCodeSaved.emit(false);
      });
  }

  /**
   * 分享二维码
   */
  shareQRCode(): void {
    if (!this.qrData) return;

    const shareLink = this.qrCodeService.generateShareLink(this.qrData);
    this.qrCodeShared.emit(shareLink);

    if (navigator.share) {
      navigator.share({
        title: this.title,
        text: this.description,
        url: shareLink
      }).catch(error => {
        console.error('Failed to share:', error);
        this.copyToClipboard(shareLink);
      });
    } else {
      this.copyToClipboard(shareLink);
    }
  }

  /**
   * 复制到剪贴板
   */
  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    }).catch(error => {
      console.error('Failed to copy to clipboard:', error);
    });
  }

  /**
   * 刷新二维码
   */
  refreshQRCode(): void {
    this.generateQRCode();
    this.startCountdown();
  }

  /**
   * 开始倒计时
   */
  private startCountdown(): void {
    this.clearCountdown();
    
    const qrDataObj = this.qrCodeService.parseQRCodeData(this.qrData);
    if (!qrDataObj || !qrDataObj.timestamp) {
      return;
    }

    const maxAge = 30 * 60 * 1000; // 30分钟
    const expiresAt = qrDataObj.timestamp + maxAge;

    this.countdownInterval = setInterval(() => {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        this.isExpired = true;
        this.remainingTime = '已过期';
        this.clearCountdown();
        return;
      }

      const minutes = Math.floor(remaining / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      this.remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  /**
   * 清除倒计时
   */
  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * 验证二维码数据
   */
  validateQRCode(): boolean {
    const validation = this.qrCodeService.validateQRCode(this.qrData);
    if (!validation.valid) {
      this.error = validation.error || '二维码格式无效';
      return false;
    }
    return true;
  }

  /**
   * 获取二维码类型
   */
  getQRCodeType(): string {
    const qrDataObj = this.qrCodeService.parseQRCodeData(this.qrData);
    return qrDataObj?.type || 'unknown';
  }

  /**
   * 获取二维码ID
   */
  getQRCodeId(): string {
    const qrDataObj = this.qrCodeService.parseQRCodeData(this.qrData);
    return qrDataObj?.orderId || qrDataObj?.bookingId || '';
  }
}
