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
import { I18nService } from '../i18n/i18n.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18nService: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const locale = (request as any).locale || 'zh-CN';

    let status: HttpStatus;
    let errorResponse: any;

    if (exception instanceof BusinessException) {
      // 业务异常
      status = exception.getStatus();
      errorResponse = {
        code: exception.code,
        message: exception.message,
        requestId: exception.requestId,
        timestamp,
        path,
        method,
      };
    } else if (exception instanceof HttpException) {
      // HTTP异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          code: BusinessErrorCode.UNKNOWN_ERROR,
          message: exceptionResponse,
          requestId,
          timestamp,
          path,
          method,
        };
      } else {
        errorResponse = {
          code: BusinessErrorCode.UNKNOWN_ERROR,
          message: (exceptionResponse as any).message || exception.message,
          requestId,
          timestamp,
          path,
          method,
          ...exceptionResponse,
        };
      }
    } else {
      // 未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        code: BusinessErrorCode.UNKNOWN_ERROR,
        message: this.i18nService.getMessage('common.serverError', locale),
        requestId,
        timestamp,
        path,
        method,
      };
    }

    // 记录错误日志
    this.logger.error(
      `Exception caught: ${JSON.stringify({
        requestId,
        path,
        method,
        status,
        message: errorResponse.message,
        stack: exception instanceof Error ? exception.stack : undefined,
      })}`,
    );

    response.status(status).json(errorResponse);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
