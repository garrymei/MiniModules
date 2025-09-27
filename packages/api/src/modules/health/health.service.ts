import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../../common/services/cache.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: any;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async getHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    // 并行检查所有服务
    const [databaseHealth, cacheHealth, memoryHealth, diskHealth] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    const services = {
      database: this.getResult(databaseHealth),
      cache: this.getResult(cacheHealth),
      memory: this.getResult(memoryHealth),
      disk: this.getResult(diskHealth),
    };

    // 确定整体状态
    const overallStatus = this.determineOverallStatus(services);

    return {
      status: overallStatus,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // 执行简单查询测试数据库连接
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        message: 'Database connection successful',
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // 测试缓存连接
      const testKey = 'health-check';
      const testValue = 'test';
      
      await this.cacheService.set(testKey, testValue, 10);
      const retrievedValue = await this.cacheService.get(testKey);
      await this.cacheService.del(testKey);
      
      const responseTime = Date.now() - startTime;
      
      if (retrievedValue === testValue) {
        return {
          status: responseTime < 500 ? 'healthy' : 'degraded',
          responseTime,
          message: 'Cache connection successful',
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Cache read/write test failed',
        };
      }
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        message: `Cache connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  private async checkMemory(): Promise<ServiceHealth> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    if (memoryUsagePercent < 80) {
      return {
        status: 'healthy',
        message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
        details: {
          heapUsed: usedMemory,
          heapTotal: totalMemory,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        },
      };
    } else if (memoryUsagePercent < 95) {
      return {
        status: 'degraded',
        message: `High memory usage: ${memoryUsagePercent.toFixed(2)}%`,
        details: {
          heapUsed: usedMemory,
          heapTotal: totalMemory,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        },
      };
    } else {
      return {
        status: 'unhealthy',
        message: `Critical memory usage: ${memoryUsagePercent.toFixed(2)}%`,
        details: {
          heapUsed: usedMemory,
          heapTotal: totalMemory,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        },
      };
    }
  }

  private async checkDisk(): Promise<ServiceHealth> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // 检查临时目录的写入权限
      const tempDir = process.env.TMPDIR || process.env.TMP || '/tmp';
      const testFile = path.join(tempDir, `health-check-${Date.now()}`);
      
      fs.writeFileSync(testFile, 'health check');
      fs.unlinkSync(testFile);
      
      return {
        status: 'healthy',
        message: 'Disk write access successful',
      };
    } catch (error) {
      this.logger.error('Disk health check failed:', error);
      return {
        status: 'unhealthy',
        message: `Disk access failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  private getResult(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${result.reason}`,
        details: { error: result.reason },
      };
    }
  }

  private determineOverallStatus(services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
  }): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    } else if (statuses.includes('degraded')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * 获取简化的健康状态（用于负载均衡器）
   */
  async getSimpleHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      // 只检查关键服务
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
