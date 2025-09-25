import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotifyService, CreateWebhookParams, UpdateWebhookParams } from './notify.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('notify')
@Controller('notify')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Get('webhooks')
  @ApiOperation({ summary: '列出租户配置的Webhook' })
  @ApiQuery({ name: 'tenantId', required: true, description: '租户ID' })
  async listWebhooks(@Query('tenantId') tenantId: string) {
    return this.notifyService.listWebhooks(tenantId);
  }

  @Post('webhooks')
  @ApiOperation({ summary: '创建Webhook配置' })
  async createWebhook(@Body() body: CreateWebhookParams) {
    return this.notifyService.createWebhook(body);
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: '更新Webhook配置' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async updateWebhook(
    @Param('id') id: string,
    @Body() body: UpdateWebhookParams,
  ) {
    return this.notifyService.updateWebhook(id, body);
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: '删除Webhook配置' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async deleteWebhook(@Param('id') id: string) {
    await this.notifyService.deleteWebhook(id);
    return { success: true };
  }

  @Get('webhooks/:id/deliveries')
  @ApiOperation({ summary: '查看Webhook调用记录' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回条数限制' })
  async getDeliveries(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.notifyService.getDeliveries(id, limit ? Number(limit) : 20);
  }
}
