import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params } = request;
    const startTime = Date.now();
    const requestId = (request as any).requestId || 'unknown';

    // 记录请求开始
    this.logger.log({
      message: 'Request started',
      requestId,
      method,
      url,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          // 记录成功请求
          this.logger.log({
            message: 'Request completed',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          });

          // 如果响应时间过长，记录警告
          if (duration > 5000) {
            this.logger.warn({
              message: 'Slow request detected',
              requestId,
              method,
              url,
              duration: `${duration}ms`,
              threshold: '5000ms',
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;
          
          // 记录错误请求
          this.logger.error({
            message: 'Request failed',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
