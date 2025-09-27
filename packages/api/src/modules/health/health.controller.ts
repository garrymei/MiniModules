import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('/healthz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '简单健康检查' })
  @ApiResponse({ status: 200, description: '服务正常' })
  @ApiResponse({ status: 503, description: '服务异常' })
  async simpleHealth() {
    const result = await this.healthService.getSimpleHealth();
    return result;
  }

  @Get('/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详细健康检查' })
  @ApiResponse({ status: 200, description: '健康检查结果' })
  async detailedHealth() {
    return await this.healthService.getHealth();
  }

  @Get('/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '就绪检查' })
  @ApiResponse({ status: 200, description: '服务就绪' })
  @ApiResponse({ status: 503, description: '服务未就绪' })
  async readiness() {
    const health = await this.healthService.getHealth();
    
    // 只有数据库和缓存都正常才认为服务就绪
    const isReady = health.services.database.status === 'healthy' && 
                   health.services.cache.status !== 'unhealthy';
    
    return {
      ready: isReady,
      timestamp: health.timestamp,
      services: {
        database: health.services.database.status,
        cache: health.services.cache.status,
      },
    };
  }

  @Get('/live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '存活检查' })
  @ApiResponse({ status: 200, description: '服务存活' })
  async liveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
