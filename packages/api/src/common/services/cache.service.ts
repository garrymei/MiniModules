import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = createClient({
        url: this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        this.logger.log('Redis Client Connected');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // 在开发环境中，如果Redis不可用，继续运行但不使用缓存
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.warn('Redis not available, running without cache');
      } else {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
    }
  }

  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected()) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存（支持模式匹配）
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
      return 0;
    } catch (error) {
      this.logger.error(`Failed to delete cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      this.logger.error(`Failed to set expire for cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected()) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for cache key ${key}:`, error);
      return -1;
    }
  }

  /**
   * 原子性递增
   */
  async incr(key: string): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment cache key ${key}:`, error);
      return 0;
    }
  }

  /**
   * 原子性递减
   */
  async decr(key: string): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Failed to decrement cache key ${key}:`, error);
      return 0;
    }
  }

  /**
   * 检查Redis连接状态
   */
  private isConnected(): boolean {
    return this.client && this.client.isOpen;
  }

  /**
   * 生成缓存键
   */
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}
