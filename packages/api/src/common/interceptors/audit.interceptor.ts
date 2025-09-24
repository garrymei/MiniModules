import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '../../modules/audit/audit-log.service';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditOptions } from '../decorators/audit.decorator';
import { AuditResult } from '../../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { user, params, body, query } = request;

    // 提取审计信息
    const auditData = {
      tenantId: (user as any)?.tenantId,
      userId: (user as any)?.id,
      userEmail: (user as any)?.email,
      action: auditOptions.action,
      resourceType: auditOptions.resourceType,
      resourceId: params?.id || params?.tenantId,
      resourceName: this.extractResourceName(params, body),
      description: auditOptions.description,
      oldValues: auditOptions.includeRequest ? this.sanitizeData(body) : null,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent'),
      requestId: request.headers['x-request-id'] as string,
      metadata: {
        method: request.method,
        url: request.url,
        query: auditOptions.includeRequest ? query : null,
      },
    };

    return next.handle().pipe(
      tap((response) => {
        // 成功时记录审计日志
        this.auditLogService.log({
          ...auditData,
          newValues: auditOptions.includeResponse ? this.sanitizeData(response) : null,
          result: AuditResult.SUCCESS,
        });
      }),
      catchError((error) => {
        // 失败时记录审计日志
        this.auditLogService.log({
          ...auditData,
          result: AuditResult.FAILURE,
          metadata: {
            ...auditData.metadata,
            error: {
              message: error.message,
              code: error.code,
            },
          },
        });
        throw error;
      }),
    );
  }

  private extractResourceName(params: any, body: any): string {
    // 尝试从参数或请求体中提取资源名称
    if (params?.name) return params.name;
    if (body?.name) return body.name;
    if (body?.title) return body.title;
    if (params?.id) return `Resource-${params.id}`;
    return null;
  }

  private sanitizeData(data: any): any {
    if (!data) return null;
    
    // 移除敏感信息
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
