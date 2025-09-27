import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // 生成或获取请求ID
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    
    // 设置到请求对象中
    (req as any).requestId = requestId;
    
    // 设置到响应头中
    res.setHeader('X-Request-ID', requestId);
    
    // 设置到日志上下文中
    (req as any).logger = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };
    
    next();
  }
}
