import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { AuditLogService } from '../../modules/audit/audit-log.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request as any).requestId;
    const user = (request as any).user;
    const tenantId = request.headers['x-tenant-id'] || (request as any).params?.tenantId;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.logAuditEvent({
            auditOptions,
            request,
            response,
            requestId,
            user,
            tenantId,
            startTime,
            success: true,
            error: null,
          });
        } catch (error) {
          this.logger.error('Failed to log audit event:', error);
        }
      }),
      catchError(async (error) => {
        try {
          await this.logAuditEvent({
            auditOptions,
            request,
            response: null,
            requestId,
            user,
            tenantId,
            startTime,
            success: false,
            error,
          });
        } catch (auditError) {
          this.logger.error('Failed to log audit event for error:', auditError);
        }
        throw error;
      }),
    );
  }

  private async logAuditEvent({
    auditOptions,
    request,
    response,
    requestId,
    user,
    tenantId,
    startTime,
    success,
    error,
  }: {
    auditOptions: AuditOptions;
    request: Request;
    response: any;
    requestId: string;
    user: any;
    tenantId: string;
    startTime: number;
    success: boolean;
    error: any;
  }): Promise<void> {
    const duration = Date.now() - startTime;

    // 构建审计日志数据
    const auditData = {
      action: auditOptions.action,
      resourceType: auditOptions.resourceType,
      resourceId: this.extractResourceId(auditOptions, request, response),
      resourceName: this.extractResourceName(auditOptions, request, response),
      description: auditOptions.description || `${auditOptions.action} ${auditOptions.resourceType}`,
      oldValues: this.extractOldValues(auditOptions, request, response),
      newValues: this.extractNewValues(auditOptions, request, response),
      userId: user?.id || 'anonymous',
      tenantId: tenantId || 'unknown',
      requestId,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'] || '',
      method: request.method,
      url: request.url,
      duration,
      result: success ? 'success' : 'error',
      errorMessage: error ? (error.message || 'Unknown error') : null,
      metadata: {
        timestamp: new Date().toISOString(),
        success,
        duration,
        requestId,
      },
    };

    // 过滤敏感字段
    if (auditOptions.sensitiveFields) {
      auditData.oldValues = this.filterSensitiveFields(auditData.oldValues, auditOptions.sensitiveFields);
      auditData.newValues = this.filterSensitiveFields(auditData.newValues, auditOptions.sensitiveFields);
    }

    // 记录审计日志
    await this.auditLogService.createAuditLog(auditData);
  }

  private extractResourceId(auditOptions: AuditOptions, request: Request, response: any): string | null {
    // 优先使用装饰器中指定的resourceId
    if (auditOptions.resourceId) {
      return auditOptions.resourceId;
    }

    // 从URL参数中提取
    const params = (request as any).params;
    if (params?.id) {
      return params.id;
    }

    // 从响应中提取
    if (response?.id) {
      return response.id;
    }

    // 从请求体中提取
    const body = (request as any).body;
    if (body?.id) {
      return body.id;
    }

    return null;
  }

  private extractResourceName(auditOptions: AuditOptions, request: Request, response: any): string | null {
    if (auditOptions.resourceName) {
      return auditOptions.resourceName;
    }

    // 从响应中提取名称字段
    if (response?.name) {
      return response.name;
    }

    if (response?.title) {
      return response.title;
    }

    if (response?.orderNumber) {
      return `Order ${response.orderNumber}`;
    }

    if (response?.bookingNumber) {
      return `Booking ${response.bookingNumber}`;
    }

    return null;
  }

  private extractOldValues(auditOptions: AuditOptions, request: Request, response: any): any {
    if (!auditOptions.includeRequestData) {
      return null;
    }

    const body = (request as any).body;
    if (!body) {
      return null;
    }

    // 对于更新操作，通常需要记录旧值
    if (auditOptions.action === 'UPDATE') {
      // 这里应该从数据库获取旧值，但为了简化，我们只记录请求数据
      return body;
    }

    return null;
  }

  private extractNewValues(auditOptions: AuditOptions, request: Request, response: any): any {
    if (auditOptions.includeResponseData && response) {
      return response;
    }

    if (auditOptions.includeRequestData) {
      const body = (request as any).body;
      return body;
    }

    return null;
  }

  private filterSensitiveFields(data: any, sensitiveFields: string[]): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const filtered = { ...data };
    
    sensitiveFields.forEach(field => {
      if (field in filtered) {
        filtered[field] = '[FILTERED]';
      }
    });

    // 递归处理嵌套对象
    Object.keys(filtered).forEach(key => {
      if (typeof filtered[key] === 'object' && filtered[key] !== null) {
        filtered[key] = this.filterSensitiveFields(filtered[key], sensitiveFields);
      }
    });

    return filtered;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    
    return request.connection.remoteAddress || 
           request.socket.remoteAddress || 
           (request.connection as any)?.socket?.remoteAddress || 
           'unknown';
  }
}