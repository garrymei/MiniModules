import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CmsService } from '../services/cms.service';
import { CreateBannerDto, UpdateBannerDto, CreateArticleDto, UpdateArticleDto } from '../dto/cms.dto';

@ApiTags('cms')
@Controller('api/cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('banners')
  @ApiOperation({ summary: '获取轮播图列表' })
  @ApiQuery({ name: 'tenantId', required: true, description: '租户ID' })
  @ApiQuery({ name: 'status', required: false, description: '状态筛选' })
  @ApiResponse({ status: 200, description: '轮播图列表' })
  async getBanners(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.cmsService.getBanners(tenantId, status);
  }

  @Get('banners/:id')
  @ApiOperation({ summary: '获取轮播图详情' })
  @ApiResponse({ status: 200, description: '轮播图详情' })
  async getBanner(@Param('id') id: string) {
    return this.cmsService.getBanner(id);
  }

  @Post('banners')
  @ApiOperation({ summary: '创建轮播图' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createBanner(@Body() createBannerDto: CreateBannerDto) {
    return this.cmsService.createBanner(createBannerDto);
  }

  @Put('banners/:id')
  @ApiOperation({ summary: '更新轮播图' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateBanner(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
  ) {
    return this.cmsService.updateBanner(id, updateBannerDto);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: '删除轮播图' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteBanner(@Param('id') id: string) {
    return this.cmsService.deleteBanner(id);
  }

  @Get('articles')
  @ApiOperation({ summary: '获取文章列表' })
  @ApiQuery({ name: 'tenantId', required: true, description: '租户ID' })
  @ApiQuery({ name: 'category', required: false, description: '分类筛选' })
  @ApiQuery({ name: 'status', required: false, description: '状态筛选' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '文章列表' })
  async getArticles(
    @Query('tenantId') tenantId: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.cmsService.getArticles(tenantId, { category, status, page, limit });
  }

  @Get('articles/:id')
  @ApiOperation({ summary: '获取文章详情' })
  @ApiResponse({ status: 200, description: '文章详情' })
  async getArticle(@Param('id') id: string) {
    return this.cmsService.getArticle(id);
  }

  @Post('articles')
  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createArticle(@Body() createArticleDto: CreateArticleDto) {
    return this.cmsService.createArticle(createArticleDto);
  }

  @Put('articles/:id')
  @ApiOperation({ summary: '更新文章' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.cmsService.updateArticle(id, updateArticleDto);
  }

  @Delete('articles/:id')
  @ApiOperation({ summary: '删除文章' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteArticle(@Param('id') id: string) {
    return this.cmsService.deleteArticle(id);
  }

  @Put('banners/:id/sort')
  @ApiOperation({ summary: '更新轮播图排序' })
  @ApiResponse({ status: 200, description: '排序更新成功' })
  async updateBannerSort(
    @Param('id') id: string,
    @Body() body: { sort: number },
  ) {
    return this.cmsService.updateBannerSort(id, body.sort);
  }

  @Put('banners/:id/status')
  @ApiOperation({ summary: '更新轮播图状态' })
  @ApiResponse({ status: 200, description: '状态更新成功' })
  async updateBannerStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.cmsService.updateBannerStatus(id, body.status);
  }

  @Put('articles/:id/status')
  @ApiOperation({ summary: '更新文章状态' })
  @ApiResponse({ status: 200, description: '状态更新成功' })
  async updateArticleStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.cmsService.updateArticleStatus(id, body.status);
  }
}
