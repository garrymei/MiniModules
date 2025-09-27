import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderStateService, OrderProgress } from '../../services/order-state.service';
import { QRCodeService, VerificationInfo } from '../../services/qrcode.service';
import { I18nService } from '../../services/i18n.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  orderId: string = '';
  order: any = null;
  orderProgress: OrderProgress | null = null;
  verificationInfo: VerificationInfo | null = null;
  qrCodeImage: string = '';
  loading = true;
  error: string = '';
  showQRCode = false;
  canCancel = false;
  canRefund = false;
  cancelReason = '';
  refundReason = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderStateService: OrderStateService,
    private qrCodeService: QRCodeService,
    private i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.orderId) {
      this.loadOrderDetails();
    } else {
      this.error = '订单ID无效';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 加载订单详情
   */
  loadOrderDetails(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      order: this.orderStateService.getOrderDetails(this.orderId),
      history: this.orderStateService.getOrderStatusHistory(this.orderId)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.order = data.order;
        this.orderProgress = this.orderStateService.generateOrderProgress(
          this.order.status,
          data.history
        );
        
        // 检查操作权限
        this.checkOrderPermissions();
        
        // 如果订单状态允许，加载核销信息
        if (this.shouldShowQRCode()) {
          this.loadVerificationInfo();
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load order details:', error);
        this.error = '加载订单详情失败';
        this.loading = false;
      }
    });
  }

  /**
   * 检查订单权限
   */
  checkOrderPermissions(): void {
    if (!this.order) return;

    const cancelCheck = this.orderStateService.canCancelOrder(this.order);
    const refundCheck = this.orderStateService.canRefundOrder(this.order);

    this.canCancel = cancelCheck.canCancel;
    this.canRefund = refundCheck.canRefund;
  }

  /**
   * 判断是否应该显示二维码
   */
  shouldShowQRCode(): boolean {
    if (!this.order) return false;
    
    // 只有在已确认、准备中、待取餐状态才显示二维码
    return ['CONFIRMED', 'PREPARING', 'READY'].includes(this.order.status);
  }

  /**
   * 加载核销信息
   */
  loadVerificationInfo(): void {
    this.qrCodeService.getOrderVerificationInfo(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.verificationInfo = info;
          this.generateQRCodeImage();
        },
        error: (error) => {
          console.error('Failed to load verification info:', error);
        }
      });
  }

  /**
   * 生成二维码图片
   */
  generateQRCodeImage(): void {
    if (!this.verificationInfo) return;

    this.qrCodeService.generateQRCodeImage(this.verificationInfo.qrCodeData)
      .then(imageData => {
        this.qrCodeImage = imageData;
      })
      .catch(error => {
        console.error('Failed to generate QR code image:', error);
      });
  }

  /**
   * 显示/隐藏二维码
   */
  toggleQRCode(): void {
    this.showQRCode = !this.showQRCode;
  }

  /**
   * 取消订单
   */
  cancelOrder(): void {
    if (!this.canCancel || !this.cancelReason.trim()) {
      return;
    }

    this.orderStateService.cancelOrder(this.orderId, this.cancelReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Order cancelled:', result);
          this.loadOrderDetails(); // 重新加载订单详情
          this.cancelReason = '';
        },
        error: (error) => {
          console.error('Failed to cancel order:', error);
          this.error = '取消订单失败';
        }
      });
  }

  /**
   * 申请退款
   */
  requestRefund(): void {
    if (!this.canRefund || !this.refundReason.trim()) {
      return;
    }

    this.orderStateService.requestRefund(this.orderId, this.refundReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Refund requested:', result);
          this.loadOrderDetails(); // 重新加载订单详情
          this.refundReason = '';
        },
        error: (error) => {
          console.error('Failed to request refund:', error);
          this.error = '申请退款失败';
        }
      });
  }

  /**
   * 保存二维码到相册
   */
  saveQRCodeToAlbum(): void {
    if (!this.verificationInfo) return;

    this.qrCodeService.saveQRCodeToAlbum(
      this.verificationInfo.qrCodeData,
      `order_${this.orderId}_qrcode.png`
    ).then(success => {
      if (success) {
        console.log('QR code saved to album');
      } else {
        this.error = '保存二维码失败';
      }
    });
  }

  /**
   * 分享订单
   */
  shareOrder(): void {
    if (!this.verificationInfo) return;

    const shareLink = this.qrCodeService.generateShareLink(this.verificationInfo.qrCodeData);
    
    if (navigator.share) {
      navigator.share({
        title: '订单核销码',
        text: `订单 ${this.orderId} 的核销码`,
        url: shareLink
      });
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(shareLink).then(() => {
        console.log('Share link copied to clipboard');
      });
    }
  }

  /**
   * 刷新订单状态
   */
  refreshOrder(): void {
    this.loadOrderDetails();
  }

  /**
   * 返回上一页
   */
  goBack(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * 格式化时间
   */
  formatTime(timestamp: Date): string {
    return this.orderStateService.formatStatusTime(timestamp);
  }

  /**
   * 获取状态颜色
   */
  getStatusColor(status: string): string {
    const statusInfo = this.orderStateService.getOrderStatus(status);
    return statusInfo?.color || '#6c757d';
  }

  /**
   * 获取状态图标
   */
  getStatusIcon(status: string): string {
    const statusInfo = this.orderStateService.getOrderStatus(status);
    return statusInfo?.icon || '❓';
  }

  /**
   * 获取状态标签
   */
  getStatusLabel(status: string): string {
    const statusInfo = this.orderStateService.getOrderStatus(status);
    return statusInfo?.label || status;
  }

  /**
   * 检查二维码是否过期
   */
  isQRCodeExpired(): boolean {
    if (!this.verificationInfo?.expiresAt) return false;
    return new Date() > this.verificationInfo.expiresAt;
  }

  /**
   * 获取二维码剩余时间
   */
  getQRCodeRemainingTime(): string {
    if (!this.verificationInfo?.expiresAt) return '';
    
    const now = new Date();
    const expiresAt = this.verificationInfo.expiresAt;
    const remaining = expiresAt.getTime() - now.getTime();
    
    if (remaining <= 0) return '已过期';
    
    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
