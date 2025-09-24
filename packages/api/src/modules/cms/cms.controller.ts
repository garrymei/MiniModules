import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CMSService, CreateCMSContentDto, UpdateCMSContentDto, CMSContentQuery } from './cms.service';
import { CMSContentType, CMSContentStatus, CMSJumpType } from '../../entities/cms-content.entity';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuditAction, AuditResourceType } from '../../entities/audit-log.entity';

@ApiTags('cms')
@Controller('cms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CMSController {
  constructor(private readonly cmsService: CMSService) {}

  @Post('content')
  @Audit({
    action: AuditAction.CREATE,
    resourceType: AuditResourceType.CONFIG,
    description: '创建CMS内容'
  })
  @ApiOperation({ summary: '创建CMS内容' })
  @ApiResponse({ 
    status: 201, 
    description: 'CMS内容创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string' }
      }
    }
  })
  async createContent(@Body() createDto: CreateCMSContentDto) {
    return this.cmsService.createContent(createDto);
  }

  @Put('content/:id')
  @Audit({
    action: AuditAction.UPDATE,
    resourceType: AuditResourceType.CONFIG,
    description: '更新CMS内容'
  })
  @ApiOperation({ summary: '更新CMS内容' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'CMS内容更新成功' 
  })
  async updateContent(
    @Param('id') id: string,
    @Body() updateDto: UpdateCMSContentDto
  ) {
    return this.cmsService.updateContent(id, updateDto);
  }

  @Get('content')
  @ApiOperation({ summary: '获取CMS内容列表' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租户ID' })
  @ApiQuery({ name: 'type', required: false, enum: CMSContentType, description: '内容类型' })
  @ApiQuery({ name: 'status', required: false, enum: CMSContentStatus, description: '内容状态' })
  @ApiQuery({ name: 'category', required: false, description: '分类' })
  @ApiQuery({ name: 'isActive', required: false, description: '是否激活' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ 
    status: 200, 
    description: 'CMS内容列表获取成功',
    schema: {
      type: 'object',
      properties: {
        contents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string' },
              viewCount: { type: 'number' },
              createdAt: { type: 'string' }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  async getContentList(@Query() query: CMSContentQuery) {
    return this.cmsService.getContentList(query);
  }

  @Get('content/:id')
  @ApiOperation({ summary: '获取单个CMS内容' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'CMS内容获取成功' 
  })
  async getContentById(@Param('id') id: string) {
    return this.cmsService.getContentById(id);
  }

  @Get('banners/:tenantId')
  @ApiOperation({ summary: '获取租户Banner列表' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Banner列表获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          coverImage: { type: 'string' },
          jumpType: { type: 'string' },
          jumpUrl: { type: 'string' }
        }
      }
    }
  })
  async getBanners(@Param('tenantId') tenantId: string) {
    return this.cmsService.getBanners(tenantId);
  }

  @Get('announcements/:tenantId')
  @ApiOperation({ summary: '获取租户公告列表' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @ApiResponse({ 
    status: 200, 
    description: '公告列表获取成功' 
  })
  async getAnnouncements(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: number
  ) {
    return this.cmsService.getAnnouncements(tenantId, limit);
  }

  @Get('articles/:tenantId')
  @ApiOperation({ summary: '获取租户文章列表' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiQuery({ name: 'category', required: false, description: '文章分类' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ 
    status: 200, 
    description: '文章列表获取成功' 
  })
  async getArticles(
    @Param('tenantId') tenantId: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.cmsService.getArticles(tenantId, category, page, limit);
  }

  @Get('activities/:tenantId')
  @ApiOperation({ summary: '获取租户活动列表' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @ApiResponse({ 
    status: 200, 
    description: '活动列表获取成功' 
  })
  async getActivities(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: number
  ) {
    return this.cmsService.getActivities(tenantId, limit);
  }

  @Post('content/:id/view')
  @ApiOperation({ summary: '增加内容浏览量' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiResponse({ 
    status: 200, 
    description: '浏览量增加成功' 
  })
  async incrementViewCount(@Param('id') id: string) {
    await this.cmsService.incrementViewCount(id);
    return { success: true, message: 'View count incremented' };
  }

  @Delete('content/:id')
  @Audit({
    action: AuditAction.DELETE,
    resourceType: AuditResourceType.CONFIG,
    description: '删除CMS内容'
  })
  @ApiOperation({ summary: '删除CMS内容' })
  @ApiParam({ name: 'id', description: '内容ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'CMS内容删除成功' 
  })
  async deleteContent(@Param('id') id: string) {
    await this.cmsService.deleteContent(id);
    return { success: true, message: 'Content deleted successfully' };
  }

  @Post('content/batch-status')
  @Audit({
    action: AuditAction.UPDATE,
    resourceType: AuditResourceType.CONFIG,
    description: '批量更新内容状态'
  })
  @ApiOperation({ summary: '批量更新内容状态' })
  @ApiResponse({ 
    status: 200, 
    description: '批量更新成功' 
  })
  async batchUpdateStatus(
    @Body() body: { ids: string[]; status: CMSContentStatus }
  ) {
    const { ids, status } = body;
    await this.cmsService.batchUpdateStatus(ids, status);
    return { success: true, message: 'Batch status update completed' };
  }

  @Get('stats/:tenantId')
  @ApiOperation({ summary: '获取内容统计' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ 
    status: 200, 
    description: '内容统计获取成功',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byType: { type: 'object' },
        byStatus: { type: 'object' },
        totalViews: { type: 'number' }
      }
    }
  })
  async getContentStats(@Param('tenantId') tenantId: string) {
    return this.cmsService.getContentStats(tenantId);
  }

  @Get('popular/:tenantId')
  @ApiOperation({ summary: '获取热门内容' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiQuery({ name: 'type', required: false, enum: CMSContentType, description: '内容类型' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  @ApiResponse({ 
    status: 200, 
    description: '热门内容获取成功' 
  })
  async getPopularContent(
    @Param('tenantId') tenantId: string,
    @Query('type') type?: CMSContentType,
    @Query('limit') limit?: number
  ) {
    return this.cmsService.getPopularContent(tenantId, type, limit);
  }
}
