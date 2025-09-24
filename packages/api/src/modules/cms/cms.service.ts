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

    return {
      total: contents.length,
      byType,
      byStatus,
      totalViews,
    };
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
