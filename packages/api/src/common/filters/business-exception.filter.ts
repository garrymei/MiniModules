import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../errors/business.exception';
import { BusinessErrorCode } from '../errors/business-codes.enum';

export interface ErrorResponse {
  success: false;
  code: number;
  message: string;
  requestId: string;
  timestamp: string;
  path: string;
  method: string;
  details?: any;
}

@Catch()
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof BusinessException) {
      // 业务异常
      status = exception.getStatus();
      errorResponse = {
        success: false,
        code: exception.code,
        message: exception.message,
        requestId: exception.requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      };

      // 记录业务异常日志
      this.logger.warn(
        `Business Exception: ${exception.code} - ${exception.message}`,
        {
          requestId: exception.requestId,
          path: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
        },
      );
    } else if (exception instanceof HttpException) {
      // HTTP异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      errorResponse = {
        success: false,
        code: BusinessErrorCode.UNKNOWN_ERROR,
        message: typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : (exceptionResponse as any).message || exception.message,
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        details: typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
      };

      // 记录HTTP异常日志
      this.logger.error(
        `HTTP Exception: ${status} - ${exception.message}`,
        {
          requestId: errorResponse.requestId,
          path: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          stack: exception.stack,
        },
      );
    } else {
      // 未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        success: false,
        code: BusinessErrorCode.UNKNOWN_ERROR,
        message: 'Internal server error',
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      };

      // 记录未知异常日志
      this.logger.error(
        `Unknown Exception: ${exception}`,
        {
          requestId: errorResponse.requestId,
          path: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
      );
    }

    // 发送错误响应
    response.status(status).json(errorResponse);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
