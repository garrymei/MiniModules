import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { Webhook } from '../../entities/webhook.entity';
import { WebhookDelivery } from '../../entities/webhook-delivery.entity';
import { BusinessException } from '../../common/errors/business.exception';

export type NotifyEvent = 'order.created' | 'booking.created' | 'payment.success';

export interface SendTemplateMessageParams {
  tenantId: string;
  templateKey: string;
  toUser?: string;
  data: Record<string, any>;
}

export interface SendSMSParams {
  tenantId: string;
  phoneNumber: string;
  templateKey: string;
  params?: Record<string, any>;
}

export interface CreateWebhookParams {
  tenantId: string;
  event: string;
  url: string;
  secret?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateWebhookParams {
  event?: string;
  url?: string;
  secret?: string | null;
  headers?: Record<string, string> | null;
  isActive?: boolean;
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
  ) {}

  async sendTemplateMessage(params: SendTemplateMessageParams): Promise<{ success: boolean; messageId: string }> {
    const messageId = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.logger.debug('Mock template message dispatched', {
      messageId,
      tenantId: params.tenantId,
      templateKey: params.templateKey,
      toUser: params.toUser,
    });
    return { success: true, messageId };
  }

  async sendSMS(params: SendSMSParams): Promise<{ success: boolean; sid: string }> {
    const sid = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.logger.debug('Mock SMS dispatched', {
      sid,
      tenantId: params.tenantId,
      phoneNumber: params.phoneNumber,
      templateKey: params.templateKey,
    });
    return { success: true, sid };
  }

  async triggerEvent(tenantId: string, event: NotifyEvent | string, payload: Record<string, any>): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { tenantId, event, isActive: true },
    });

    if (webhooks.length === 0) {
      return;
    }

    await Promise.all(webhooks.map((webhook) => this.deliverWebhook(webhook, payload)));
  }

  async listWebhooks(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async createWebhook(params: CreateWebhookParams): Promise<Webhook> {
    const webhook = this.webhookRepository.create({
      tenantId: params.tenantId,
      event: params.event,
      url: params.url,
      secret: params.secret,
      headers: params.headers,
      isActive: params.isActive ?? true,
    });

    return this.webhookRepository.save(webhook);
  }

  async updateWebhook(id: string, params: UpdateWebhookParams): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw BusinessException.notFound(`Webhook ${id} not found`);
    }

    if (params.event !== undefined) {
      webhook.event = params.event;
    }
    if (params.url !== undefined) {
      webhook.url = params.url;
    }
    if (params.secret !== undefined) {
      webhook.secret = params.secret || undefined;
    }
    if (params.headers !== undefined) {
      webhook.headers = params.headers || undefined;
    }
    if (params.isActive !== undefined) {
      webhook.isActive = params.isActive;
    }

    return this.webhookRepository.save(webhook);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.webhookRepository.delete(id);
  }

  async getDeliveries(webhookId: string, limit = 20): Promise<WebhookDelivery[]> {
    return this.deliveryRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private async deliverWebhook(webhook: Webhook, payload: Record<string, any>): Promise<void> {
    const fetchFn: any = (globalThis as any).fetch;
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      tenantId: webhook.tenantId,
      event: webhook.event,
      timestamp,
      payload,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    if (webhook.secret) {
      headers['X-MM-Timestamp'] = timestamp;
      headers['X-MM-Signature'] = this.generateSignature(webhook.secret, body, timestamp);
    }

    const startedAt = Date.now();
    let statusCode: number | undefined;
    let responseBody: string | undefined;
    let success = false;
    let errorMessage: string | undefined;

    try {
      if (!fetchFn) {
        throw new Error('fetch is not available in current runtime');
      }

      const response = await fetchFn(webhook.url, {
        method: 'POST',
        headers,
        body,
      });
      statusCode = response.status;
      responseBody = await response.text();
      success = response.ok;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Webhook delivery failed`, {
        webhookId: webhook.id,
        error: errorMessage,
      });
    }

    const durationMs = Date.now() - startedAt;

    await this.deliveryRepository.save(
      this.deliveryRepository.create({
        webhookId: webhook.id,
        tenantId: webhook.tenantId,
        event: webhook.event,
        payload,
        statusCode,
        success,
        errorMessage,
        responseBody,
        durationMs,
      }),
    );
  }

  private generateSignature(secret: string, body: string, timestamp: string): string {
    return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  }
}
