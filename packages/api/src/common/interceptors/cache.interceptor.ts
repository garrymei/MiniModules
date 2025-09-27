import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CACHE_OPTIONS_METADATA } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<{
      key: string;
      ttl?: number;
      useParams?: boolean;
      useUser?: boolean;
      useTenant?: boolean;
    }>(CACHE_OPTIONS_METADATA, context.getHandler());

    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(cacheOptions, request);

    // 尝试从缓存获取
    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return of(cachedResult);
    }

    this.logger.debug(`Cache miss for key: ${cacheKey}`);

    // 执行方法并缓存结果
    return next.handle().pipe(
      tap(async (result) => {
        if (result !== undefined && result !== null) {
          await this.cacheService.set(cacheKey, result, cacheOptions.ttl);
          this.logger.debug(`Cached result for key: ${cacheKey}`);
        }
      }),
    );
  }

  private generateCacheKey(
    options: {
      key: string;
      useParams?: boolean;
      useUser?: boolean;
      useTenant?: boolean;
    },
    request: any,
  ): string {
    const parts: (string | number)[] = [options.key];

    if (options.useTenant && request.user?.tenantId) {
      parts.push(request.user.tenantId);
    }

    if (options.useUser && request.user?.id) {
      parts.push(request.user.id);
    }

    if (options.useParams) {
      // 使用查询参数和路径参数
      const params = { ...request.params, ...request.query };
      const paramString = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');
      if (paramString) {
        parts.push(paramString);
      }
    }

    return CacheService.generateKey(...parts);
  }
}
