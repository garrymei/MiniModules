import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // 生成或获取请求ID
    const requestId = request.headers['x-request-id'] as string || uuidv4();

    // 设置请求ID到请求对象
    (request as any).requestId = requestId;

    // 设置请求ID到响应头
    response.setHeader('X-Request-ID', requestId);

    return next.handle();
  }
}
