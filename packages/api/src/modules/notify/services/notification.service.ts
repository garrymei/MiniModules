import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../../../entities/webhook.entity';
import { WebhookDelivery } from '../../../entities/webhook-delivery.entity';
import * as crypto from 'crypto';

export interface NotificationEvent {
  type: 'order.created' | 'order.paid' | 'order.cancelled' | 'booking.created' | 'booking.confirmed' | 'booking.cancelled' | 'user.registered' | 'user.login';
  tenantId: string;
  data: any;
  timestamp: Date;
}

export interface TemplateMessage {
  tenantId: string;
  templateId: string;
  openId: string;
  data: Record<string, any>;
  url?: string;
}

export interface SMSMessage {
  tenantId: string;
  phoneNumber: string;
  templateId: string;
  params: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private webhookDeliveryRepository: Repository<WebhookDelivery>,
  ) {}

  /**
   * 发送通知事件
   */
  async sendNotification(event: NotificationEvent): Promise<void> {
    this.logger.log(`Sending notification for event: ${event.type}`);

    // 并行执行所有通知方式
    await Promise.allSettled([
      this.sendWebhookNotifications(event),
      this.sendTemplateMessage(event),
      this.sendSMSNotification(event),
    ]);
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhookNotifications(event: NotificationEvent): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.find({
        where: {
          tenantId: event.tenantId,
          event: event.type,
          isActive: true,
        },
      });

      if (webhooks.length === 0) {
        this.logger.log(`No active webhooks found for event ${event.type}`);
        return;
      }

      // 并行发送所有webhook
      const webhookPromises = webhooks.map(webhook => this.deliverWebhook(webhook, event));
      await Promise.allSettled(webhookPromises);

    } catch (error) {
      this.logger.error('Failed to send webhook notifications:', error);
    }
  }

  /**
   * 投递Webhook
   */
  private async deliverWebhook(webhook: Webhook, event: NotificationEvent): Promise<void> {
    const delivery = this.webhookDeliveryRepository.create({
      webhookId: webhook.id,
      event: event.type,
      url: webhook.url,
      payload: event.data,
      status: 'pending',
      attempts: 0,
    });

    const savedDelivery = await this.webhookDeliveryRepository.save(delivery);

    try {
      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'MiniModules-Webhook/1.0',
        'X-Event-Type': event.type,
        'X-Tenant-Id': event.tenantId,
        'X-Timestamp': event.timestamp.toISOString(),
        ...webhook.headers,
      };

      // 生成签名
      if (webhook.secret) {
        const signature = this.generateWebhookSignature(event.data, webhook.secret);
        headers['X-Signature'] = `sha256=${signature}`;
      }

      // 发送请求
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: event.type,
          tenantId: event.tenantId,
          timestamp: event.timestamp.toISOString(),
          data: event.data,
        }),
        timeout: 30000, // 30秒超时
      });

      // 更新投递状态
      await this.webhookDeliveryRepository.update(savedDelivery.id, {
        status: response.ok ? 'delivered' : 'failed',
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        attempts: savedDelivery.attempts + 1,
        deliveredAt: new Date(),
        errorMessage: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      });

      this.logger.log(`Webhook delivered successfully to ${webhook.url}`);

    } catch (error) {
      // 更新投递状态为失败
      await this.webhookDeliveryRepository.update(savedDelivery.id, {
        status: 'failed',
        attempts: savedDelivery.attempts + 1,
        deliveredAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logger.error(`Webhook delivery failed to ${webhook.url}:`, error);
    }
  }

  /**
   * 发送模板消息
   */
  private async sendTemplateMessage(event: NotificationEvent): Promise<void> {
    try {
      // 根据事件类型确定是否需要发送模板消息
      const templateConfig = this.getTemplateConfig(event.type);
      if (!templateConfig) {
        return;
      }

      // 获取用户的openId
      const openId = this.extractOpenId(event.data);
      if (!openId) {
        this.logger.warn(`No openId found for template message in event ${event.type}`);
        return;
      }

      // 构建模板数据
      const templateData = this.buildTemplateData(event);

      // 发送模板消息
      const success = await this.sendWechatTemplateMessage(
        event.tenantId,
        templateConfig.templateId,
        openId,
        templateData,
        templateConfig.url,
      );

      if (success) {
        this.logger.log(`Template message sent successfully for event ${event.type}`);
      } else {
        this.logger.error(`Template message failed for event ${event.type}`);
      }

    } catch (error) {
      this.logger.error('Failed to send template message:', error);
    }
  }

  /**
   * 发送短信通知
   */
  private async sendSMSNotification(event: NotificationEvent): Promise<void> {
    try {
      // 根据事件类型确定是否需要发送短信
      const smsConfig = this.getSMSConfig(event.type);
      if (!smsConfig) {
        return;
      }

      // 获取用户手机号
      const phoneNumber = this.extractPhoneNumber(event.data);
      if (!phoneNumber) {
        this.logger.warn(`No phone number found for SMS in event ${event.type}`);
        return;
      }

      // 构建短信参数
      const smsParams = this.buildSMSParams(event);

      // 发送短信
      const success = await this.sendSMS(
        event.tenantId,
        phoneNumber,
        smsConfig.templateId,
        smsParams,
      );

      if (success) {
        this.logger.log(`SMS sent successfully for event ${event.type}`);
      } else {
        this.logger.error(`SMS failed for event ${event.type}`);
      }

    } catch (error) {
      this.logger.error('Failed to send SMS notification:', error);
    }
  }

  /**
   * 发送微信模板消息
   */
  private async sendWechatTemplateMessage(
    tenantId: string,
    templateId: string,
    openId: string,
    data: Record<string, any>,
    url?: string,
  ): Promise<boolean> {
    try {
      // 获取访问令牌
      const accessToken = await this.getWechatAccessToken(tenantId);

      // 构建模板消息数据
      const templateData = {
        touser: openId,
        template_id: templateId,
        url: url,
        data: this.formatTemplateData(data),
      };

      // 发送模板消息
      const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const result = await response.json();
      return result.errcode === 0;

    } catch (error) {
      this.logger.error('Failed to send WeChat template message:', error);
      return false;
    }
  }

  /**
   * 发送短信
   */
  private async sendSMS(
    tenantId: string,
    phoneNumber: string,
    templateId: string,
    params: Record<string, any>,
  ): Promise<boolean> {
    try {
      // 这里应该调用短信服务商API
      // 实际实现需要根据具体的短信服务商
      this.logger.log(`Sending SMS to ${phoneNumber} with template ${templateId}`);
      
      // 模拟发送成功
      return true;
    } catch (error) {
      this.logger.error('Failed to send SMS:', error);
      return false;
    }
  }

  /**
   * 生成Webhook签名
   */
  private generateWebhookSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * 获取微信访问令牌
   */
  private async getWechatAccessToken(tenantId: string): Promise<string> {
    // 实际应用中应该从配置或数据库获取
    const appId = process.env.WECHAT_APP_ID || 'your_app_id';
    const appSecret = process.env.WECHAT_APP_SECRET || 'your_app_secret';
    
    const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`);
    const result = await response.json();
    
    if (result.access_token) {
      return result.access_token;
    } else {
      throw new Error(`Failed to get access token: ${result.errmsg}`);
    }
  }

  /**
   * 格式化模板数据
   */
  private formatTemplateData(data: Record<string, any>): Record<string, { value: string; color?: string }> {
    const formatted: Record<string, { value: string; color?: string }> = {};
    
    Object.keys(data).forEach(key => {
      formatted[key] = {
        value: String(data[key]),
        color: '#173177',
      };
    });
    
    return formatted;
  }

  /**
   * 获取模板配置
   */
  private getTemplateConfig(eventType: string): { templateId: string; url?: string } | null {
    const configs: Record<string, { templateId: string; url?: string }> = {
      'order.created': { templateId: 'ORDER_CREATED_TEMPLATE' },
      'order.paid': { templateId: 'ORDER_PAID_TEMPLATE' },
      'booking.created': { templateId: 'BOOKING_CREATED_TEMPLATE' },
      'booking.confirmed': { templateId: 'BOOKING_CONFIRMED_TEMPLATE' },
    };

    return configs[eventType] || null;
  }

  /**
   * 获取短信配置
   */
  private getSMSConfig(eventType: string): { templateId: string } | null {
    const configs: Record<string, { templateId: string }> = {
      'order.paid': { templateId: 'ORDER_PAID_SMS' },
      'booking.confirmed': { templateId: 'BOOKING_CONFIRMED_SMS' },
    };

    return configs[eventType] || null;
  }

  /**
   * 提取OpenID
   */
  private extractOpenId(data: any): string | null {
    return data.openId || data.user?.openId || data.customer?.openId || null;
  }

  /**
   * 提取手机号
   */
  private extractPhoneNumber(data: any): string | null {
    return data.phoneNumber || data.user?.phone || data.customer?.phone || null;
  }

  /**
   * 构建模板数据
   */
  private buildTemplateData(event: NotificationEvent): Record<string, any> {
    switch (event.type) {
      case 'order.created':
        return {
          orderNumber: event.data.orderNumber,
          amount: event.data.totalAmount,
          time: event.timestamp.toLocaleString('zh-CN'),
        };
      case 'order.paid':
        return {
          orderNumber: event.data.orderNumber,
          amount: event.data.totalAmount,
          time: event.timestamp.toLocaleString('zh-CN'),
        };
      case 'booking.created':
        return {
          bookingNumber: event.data.bookingNumber,
          resourceName: event.data.resourceName,
          date: event.data.bookingDate,
          time: `${event.data.startTime}-${event.data.endTime}`,
        };
      case 'booking.confirmed':
        return {
          bookingNumber: event.data.bookingNumber,
          resourceName: event.data.resourceName,
          date: event.data.bookingDate,
          time: `${event.data.startTime}-${event.data.endTime}`,
        };
      default:
        return {};
    }
  }

  /**
   * 构建短信参数
   */
  private buildSMSParams(event: NotificationEvent): Record<string, any> {
    switch (event.type) {
      case 'order.paid':
        return {
          orderNumber: event.data.orderNumber,
          amount: event.data.totalAmount,
        };
      case 'booking.confirmed':
        return {
          bookingNumber: event.data.bookingNumber,
          resourceName: event.data.resourceName,
          date: event.data.bookingDate,
        };
      default:
        return {};
    }
  }
}
