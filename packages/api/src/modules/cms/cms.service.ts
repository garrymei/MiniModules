import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CMSContent, CMSContentType, CMSContentStatus, CMSJumpType } from '../../entities/cms-content.entity';

export interface CreateCMSContentDto {
  tenantId: string;
  type: CMSContentType;
  title: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  images?: string[];
  jumpType?: CMSJumpType;
  jumpUrl?: string;
  category?: string;
  tags?: string[];
  sortOrder?: number;
  expiresAt?: Date;
  metadata?: any;
}

export interface UpdateCMSContentDto {
  title?: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  images?: string[];
  status?: CMSContentStatus;
  jumpType?: CMSJumpType;
  jumpUrl?: string;
  category?: string;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
  expiresAt?: Date;
  metadata?: any;
}

export interface CMSContentQuery {
  tenantId?: string;
  type?: CMSContentType;
  status?: CMSContentStatus;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class CMSService {
  constructor(
    @InjectRepository(CMSContent)
    private cmsContentRepository: Repository<CMSContent>,
  ) {}

  /**
   * 创建CMS内容
   */
  async createContent(createDto: CreateCMSContentDto): Promise<CMSContent> {
    const content = this.cmsContentRepository.create(createDto);
    return this.cmsContentRepository.save(content);
  }

  /**
   * 更新CMS内容
   */
  async updateContent(id: string, updateDto: UpdateCMSContentDto): Promise<CMSContent> {
    const content = await this.cmsContentRepository.findOne({ where: { id } });
    if (!content) {
      throw new NotFoundException(`CMS content with ID ${id} not found`);
    }

    // 如果状态改为已发布，设置发布时间
    if (updateDto.status === CMSContentStatus.PUBLISHED && content.status !== CMSContentStatus.PUBLISHED) {
      (updateDto as any).publishedAt = new Date();
    }

    Object.assign(content, updateDto);
    return this.cmsContentRepository.save(content);
  }

  /**
   * 获取CMS内容列表
   */
  async getContentList(query: CMSContentQuery): Promise<{
    contents: CMSContent[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      tenantId,
      type,
      status,
      category,
      tags,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    // 处理标签查询
    if (tags && tags.length > 0) {
      where.tags = { $overlap: tags };
    }

    const [contents, total] = await this.cmsContentRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      contents,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取单个CMS内容
   */
  async getContentById(id: string): Promise<CMSContent> {
    const content = await this.cmsContentRepository.findOne({ where: { id } });
    if (!content) {
      throw new NotFoundException(`CMS content with ID ${id} not found`);
    }
    return content;
  }

  /**
   * 获取租户的Banner列表
   */
  async getBanners(tenantId: string): Promise<CMSContent[]> {
    return this.cmsContentRepository.find({
      where: {
        tenantId,
        type: CMSContentType.BANNER,
        status: CMSContentStatus.PUBLISHED,
        isActive: true,
      },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 获取租户的公告列表
   */
  async getAnnouncements(tenantId: string, limit: number = 10): Promise<CMSContent[]> {
    return this.cmsContentRepository.find({
      where: {
        tenantId,
        type: CMSContentType.ANNOUNCEMENT,
        status: CMSContentStatus.PUBLISHED,
        isActive: true,
      },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取租户的文章列表
   */
  async getArticles(
    tenantId: string,
    category?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    articles: CMSContent[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {
      tenantId,
      type: CMSContentType.ARTICLE,
      status: CMSContentStatus.PUBLISHED,
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    const [articles, total] = await this.cmsContentRepository.findAndCount({
      where,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      articles,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取租户的活动列表
   */
  async getActivities(tenantId: string, limit: number = 10): Promise<CMSContent[]> {
    const now = new Date();
    
    return this.cmsContentRepository.find({
      where: {
        tenantId,
        type: CMSContentType.ACTIVITY,
        status: CMSContentStatus.PUBLISHED,
        isActive: true,
        // 只显示未过期的活动
        expiresAt: Between(now, new Date('2099-12-31')),
      },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 增加浏览量
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.cmsContentRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 删除CMS内容
   */
  async deleteContent(id: string): Promise<void> {
    const result = await this.cmsContentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`CMS content with ID ${id} not found`);
    }
  }

  /**
   * 批量更新内容状态
   */
  async batchUpdateStatus(ids: string[], status: CMSContentStatus): Promise<void> {
    const publishedAt = status === CMSContentStatus.PUBLISHED ? new Date() : null;
    
    await this.cmsContentRepository.update(ids, {
      status,
      publishedAt,
    });
  }

  /**
   * 获取内容统计
   */
  async getContentStats(tenantId: string): Promise<{
    total: number;
    byType: Record<CMSContentType, number>;
    byStatus: Record<CMSContentStatus, number>;
    totalViews: number;
    recentActivity: Array<{
      id: string;
      title: string;
      type: CMSContentType;
      status: CMSContentStatus;
      updatedAt: Date;
    }>;
  }> {
    const contents = await this.cmsContentRepository.find({
      where: { tenantId },
      select: ['type', 'status', 'viewCount'],
    });

    const byType = {} as Record<CMSContentType, number>;
    const byStatus = {} as Record<CMSContentStatus, number>;
    let totalViews = 0;

    for (const content of contents) {
      byType[content.type] = (byType[content.type] || 0) + 1;
      byStatus[content.status] = (byStatus[content.status] || 0) + 1;
      totalViews += content.viewCount;
    }

    const recentActivity = await this.cmsContentRepository.find({
      where: { tenantId },
      select: ['id', 'title', 'type', 'status', 'updatedAt'],
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    return {
      total: contents.length,
      byType,
      byStatus,
      totalViews,
      recentActivity,
    };
  }

  /**
   * 批量删除CMS内容
   */
  async batchDeleteContent(
    contentIds: string[],
    tenantId: string,
  ): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const results = { success: [] as string[], failed: [] as Array<{ id: string; error: string }> };

    for (const contentId of contentIds) {
      try {
        await this.deleteCMSContent(contentId, tenantId);
        results.success.push(contentId);
      } catch (error) {
        results.failed.push({
          id: contentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * 复制CMS内容
   */
  async duplicateCMSContent(contentId: string, tenantId: string): Promise<CMSContent> {
    const originalContent = await this.getCMSContentById(contentId, tenantId);
    
    const duplicateData: CreateCMSContentDto = {
      tenantId,
      type: originalContent.type,
      title: `${originalContent.title} (Copy)`,
      content: originalContent.content,
      summary: originalContent.summary,
      coverImage: originalContent.coverImage,
      images: originalContent.images,
      jumpType: originalContent.jumpType,
      jumpUrl: originalContent.jumpUrl,
      category: originalContent.category,
      tags: originalContent.tags,
      sortOrder: originalContent.sortOrder,
      metadata: originalContent.metadata,
    };

    return this.createCMSContent(duplicateData);
  }

  /**
   * 搜索CMS内容
   */
  async searchCMSContent(
    query: string,
    tenantId: string,
    options?: {
      type?: CMSContentType;
      status?: CMSContentStatus;
      category?: string;
      tags?: string[];
      page?: number;
      limit?: number;
    },
  ): Promise<{
    results: CMSContent[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const queryBuilder = this.cmsContentRepository
      .createQueryBuilder('content')
      .where('content.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(content.title ILIKE :query OR content.content ILIKE :query OR content.summary ILIKE :query)',
        { query: `%${query}%` }
      );

    if (options?.type) {
      queryBuilder.andWhere('content.type = :type', { type: options.type });
    }

    if (options?.status) {
      queryBuilder.andWhere('content.status = :status', { status: options.status });
    }

    if (options?.category) {
      queryBuilder.andWhere('content.category = :category', { category: options.category });
    }

    if (options?.tags && options.tags.length > 0) {
      queryBuilder.andWhere('content.tags && :tags', { tags: options.tags });
    }

    const [results, total] = await queryBuilder
      .orderBy('content.updatedAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      results,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取CMS内容分类
   */
  async getContentCategories(tenantId: string): Promise<Array<{
    category: string;
    count: number;
    lastUpdated: Date;
  }>> {
    const categories = await this.cmsContentRepository
      .createQueryBuilder('content')
      .select('content.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(content.updatedAt)', 'lastUpdated')
      .where('content.tenantId = :tenantId', { tenantId })
      .andWhere('content.category IS NOT NULL')
      .groupBy('content.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return categories.map(cat => ({
      category: cat.category,
      count: parseInt(cat.count),
      lastUpdated: new Date(cat.lastUpdated),
    }));
  }

  /**
   * 获取CMS内容标签
   */
  async getContentTags(tenantId: string): Promise<Array<{
    tag: string;
    count: number;
  }>> {
    const tags = await this.cmsContentRepository
      .createQueryBuilder('content')
      .select('unnest(content.tags)', 'tag')
      .addSelect('COUNT(*)', 'count')
      .where('content.tenantId = :tenantId', { tenantId })
      .andWhere('content.tags IS NOT NULL')
      .groupBy('tag')
      .orderBy('count', 'DESC')
      .getRawMany();

    return tags.map(tag => ({
      tag: tag.tag,
      count: parseInt(tag.count),
    }));
  }

  /**
   * 获取热门内容
   */
  async getPopularContent(
    tenantId: string,
    type?: CMSContentType,
    limit: number = 10
  ): Promise<CMSContent[]> {
    const where: any = {
      tenantId,
      status: CMSContentStatus.PUBLISHED,
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    return this.cmsContentRepository.find({
      where,
      order: { viewCount: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }
}
