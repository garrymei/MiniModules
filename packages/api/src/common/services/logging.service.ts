import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { Request } from 'express';

export interface LogContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  [key: string]: any;
}

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger = new Logger(LoggingService.name);

  /**
   * 记录业务操作日志
   */
  logBusinessOperation(
    message: string,
    context: LogContext,
    level: 'log' | 'warn' | 'error' = 'log',
  ): void {
    const logMessage = this.formatLogMessage(message, context);
    
    switch (level) {
      case 'warn':
        this.logger.warn(logMessage, context);
        break;
      case 'error':
        this.logger.error(logMessage, context);
        break;
      default:
        this.logger.log(logMessage, context);
    }
  }

  /**
   * 记录API请求日志
   */
  logApiRequest(
    request: Request,
    responseTime: number,
    statusCode: number,
    context?: LogContext,
  ): void {
    const logContext: LogContext = {
      requestId: (request as any).requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      responseTime,
      statusCode,
      ...context,
    };

    const message = `API Request: ${request.method} ${request.url} - ${statusCode} (${responseTime}ms)`;
    
    if (statusCode >= 400) {
      this.logger.warn(message, logContext);
    } else {
      this.logger.log(message, logContext);
    }
  }

  /**
   * 记录数据库操作日志
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    context: LogContext,
    duration?: number,
  ): void {
    const logContext: LogContext = {
      operation,
      table,
      duration,
      ...context,
    };

    const message = `Database ${operation}: ${table}${duration ? ` (${duration}ms)` : ''}`;
    this.logger.log(message, logContext);
  }

  /**
   * 记录安全相关日志
   */
  logSecurityEvent(
    event: string,
    context: LogContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  ): void {
    const logContext: LogContext = {
      securityEvent: event,
      severity,
      ...context,
    };

    const message = `Security Event [${severity.toUpperCase()}]: ${event}`;
    
    if (severity === 'critical' || severity === 'high') {
      this.logger.error(message, logContext);
    } else {
      this.logger.warn(message, logContext);
    }
  }

  /**
   * 记录性能指标
   */
  logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    context: LogContext,
  ): void {
    const logContext: LogContext = {
      metric,
      value,
      unit,
      ...context,
    };

    const message = `Performance: ${metric} = ${value}${unit}`;
    this.logger.log(message, logContext);
  }

  /**
   * 记录错误日志
   */
  logError(
    error: Error,
    context: LogContext,
    additionalInfo?: string,
  ): void {
    const logContext: LogContext = {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    };

    const message = additionalInfo 
      ? `Error: ${additionalInfo} - ${error.message}`
      : `Error: ${error.message}`;
    
    this.logger.error(message, logContext);
  }

  /**
   * 记录审计日志
   */
  logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    context: LogContext,
    result: 'success' | 'failure' = 'success',
  ): void {
    const logContext: LogContext = {
      auditAction: action,
      auditResourceType: resourceType,
      auditResourceId: resourceId,
      auditResult: result,
      ...context,
    };

    const message = `Audit: ${action} ${resourceType}${resourceId ? ` (${resourceId})` : ''} - ${result}`;
    
    if (result === 'failure') {
      this.logger.warn(message, logContext);
    } else {
      this.logger.log(message, logContext);
    }
  }

  /**
   * 格式化日志消息
   */
  private formatLogMessage(message: string, context: LogContext): string {
    const parts = [message];
    
    if (context.requestId) {
      parts.push(`[${context.requestId}]`);
    }
    
    if (context.userId) {
      parts.push(`[User: ${context.userId}]`);
    }
    
    if (context.tenantId) {
      parts.push(`[Tenant: ${context.tenantId}]`);
    }
    
    if (context.action && context.resourceType) {
      parts.push(`[${context.action} ${context.resourceType}]`);
    }
    
    return parts.join(' ');
  }

  // 实现 LoggerService 接口
  log(message: any, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, context);
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, context);
  }
}
