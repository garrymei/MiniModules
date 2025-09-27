import { SetMetadata } from '@nestjs/common';

export interface CacheOptions {
  /**
   * 缓存键前缀
   */
  key: string;
  /**
   * 缓存时间（秒）
   */
  ttl?: number;
  /**
   * 是否根据参数生成唯一键
   */
  useParams?: boolean;
  /**
   * 是否根据用户ID生成唯一键
   */
  useUser?: boolean;
  /**
   * 是否根据租户ID生成唯一键
   */
  useTenant?: boolean;
}

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_OPTIONS_METADATA = 'cache_options';

/**
 * 缓存装饰器
 */
export const Cacheable = (options: CacheOptions) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_OPTIONS_METADATA, options)(target, propertyName, descriptor);
    return descriptor;
  };
};

/**
 * 清除缓存装饰器
 */
export const CacheEvict = (key: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyName, descriptor);
    return descriptor;
  };
};
