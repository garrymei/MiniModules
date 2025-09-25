import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface I18nMessage {
  [key: string]: string | I18nMessage;
}

@Injectable()
export class I18nService {
  private readonly messages: Map<string, I18nMessage> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.loadMessages();
  }

  private loadMessages() {
    // Load Chinese messages
    this.messages.set('zh-CN', {
      common: {
        success: '操作成功',
        error: '操作失败',
        notFound: '未找到',
        unauthorized: '未授权',
        forbidden: '禁止访问',
        validation: '参数验证失败',
        serverError: '服务器内部错误'
      },
      auth: {
        invalidCredentials: '用户名或密码错误',
        tokenExpired: '登录已过期',
        tokenInvalid: '无效的登录令牌',
        permissionDenied: '权限不足'
      },
      tenant: {
        notFound: '租户不存在',
        configNotFound: '租户配置不存在',
        configInvalid: '配置格式无效',
        alreadyExists: '租户已存在'
      },
      config: {
        draftSaved: '草稿已保存',
        submittedForReview: '已提交审核',
        approved: '配置已审批通过',
        published: '配置已发布',
        rejected: '配置已驳回',
        rollbackSuccess: '回滚成功',
        versionNotFound: '版本不存在'
      },
      order: {
        notFound: '订单不存在',
        alreadyPaid: '订单已支付',
        cancelled: '订单已取消',
        insufficientStock: '库存不足'
      },
      booking: {
        notFound: '预约不存在',
        timeSlotUnavailable: '时段不可用',
        alreadyBooked: '时段已被预约',
        cancelled: '预约已取消'
      },
      payment: {
        created: '支付订单已创建',
        success: '支付成功',
        failed: '支付失败',
        cancelled: '支付已取消',
        orderNotFound: '订单不存在'
      }
    });

    // Load English messages
    this.messages.set('en-US', {
      common: {
        success: 'Operation successful',
        error: 'Operation failed',
        notFound: 'Not found',
        unauthorized: 'Unauthorized',
        forbidden: 'Forbidden',
        validation: 'Validation failed',
        serverError: 'Internal server error'
      },
      auth: {
        invalidCredentials: 'Invalid username or password',
        tokenExpired: 'Token expired',
        tokenInvalid: 'Invalid token',
        permissionDenied: 'Permission denied'
      },
      tenant: {
        notFound: 'Tenant not found',
        configNotFound: 'Tenant configuration not found',
        configInvalid: 'Invalid configuration format',
        alreadyExists: 'Tenant already exists'
      },
      config: {
        draftSaved: 'Draft saved',
        submittedForReview: 'Submitted for review',
        approved: 'Configuration approved',
        published: 'Configuration published',
        rejected: 'Configuration rejected',
        rollbackSuccess: 'Rollback successful',
        versionNotFound: 'Version not found'
      },
      order: {
        notFound: 'Order not found',
        alreadyPaid: 'Order already paid',
        cancelled: 'Order cancelled',
        insufficientStock: 'Insufficient stock'
      },
      booking: {
        notFound: 'Booking not found',
        timeSlotUnavailable: 'Time slot unavailable',
        alreadyBooked: 'Time slot already booked',
        cancelled: 'Booking cancelled'
      },
      payment: {
        created: 'Payment order created',
        success: 'Payment successful',
        failed: 'Payment failed',
        cancelled: 'Payment cancelled',
        orderNotFound: 'Order not found'
      }
    });
  }

  getMessage(key: string, locale: string = 'zh-CN'): string {
    const messages = this.messages.get(locale) || this.messages.get('zh-CN');
    const keys = key.split('.');
    
    let result: any = messages;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Fallback to Chinese if key not found
        const fallbackMessages = this.messages.get('zh-CN');
        result = fallbackMessages;
        for (const fallbackKey of keys) {
          if (result && typeof result === 'object' && fallbackKey in result) {
            result = result[fallbackKey];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }
    
    return typeof result === 'string' ? result : key;
  }

  getSupportedLocales(): string[] {
    return Array.from(this.messages.keys());
  }

  isLocaleSupported(locale: string): boolean {
    return this.messages.has(locale);
  }
}
