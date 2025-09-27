import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CMSBanner } from '../../../entities/cms-banner.entity';
import { CMSArticle } from '../../../entities/cms-article.entity';
import { CreateBannerDto, UpdateBannerDto, CreateArticleDto, UpdateArticleDto, BannerDto, ArticleDto, ContentStatus } from '../dto/cms.dto';

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(CMSBanner)
    private bannerRepository: Repository<CMSBanner>,
    @InjectRepository(CMSArticle)
    private articleRepository: Repository<CMSArticle>,
  ) {}

  // Banner 相关方法
  async getBanners(tenantId: string, status?: string): Promise<BannerDto[]> {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const banners = await this.bannerRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    return banners.map(banner => this.mapBannerToDto(banner));
  }

  async getBanner(id: string): Promise<BannerDto> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
    return this.mapBannerToDto(banner);
  }

  async createBanner(createBannerDto: CreateBannerDto): Promise<BannerDto> {
    // 如果没有指定排序，自动设置为最大值+1
    if (!createBannerDto.sort) {
      const maxSort = await this.bannerRepository
        .createQueryBuilder('banner')
        .where('banner.tenantId = :tenantId', { tenantId: createBannerDto.tenantId })
        .select('MAX(banner.sort)', 'maxSort')
        .getRawOne();
      createBannerDto.sort = (maxSort?.maxSort || 0) + 1;
    }

    const banner = this.bannerRepository.create({
      ...createBannerDto,
      status: createBannerDto.status || ContentStatus.DRAFT,
      startAt: createBannerDto.startAt ? new Date(createBannerDto.startAt) : null,
      endAt: createBannerDto.endAt ? new Date(createBannerDto.endAt) : null,
    });

    const saved = await this.bannerRepository.save(banner);
    return this.mapBannerToDto(saved);
  }

  async updateBanner(id: string, updateBannerDto: UpdateBannerDto): Promise<BannerDto> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    const updateData: any = { ...updateBannerDto };
    if (updateBannerDto.startAt) {
      updateData.startAt = new Date(updateBannerDto.startAt);
    }
    if (updateBannerDto.endAt) {
      updateData.endAt = new Date(updateBannerDto.endAt);
    }

    await this.bannerRepository.update(id, updateData);
    const updated = await this.bannerRepository.findOne({ where: { id } });
    return this.mapBannerToDto(updated!);
  }

  async deleteBanner(id: string): Promise<void> {
    const result = await this.bannerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
  }

  async updateBannerSort(id: string, sort: number): Promise<BannerDto> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    await this.bannerRepository.update(id, { sort });
    const updated = await this.bannerRepository.findOne({ where: { id } });
    return this.mapBannerToDto(updated!);
  }

  async updateBannerStatus(id: string, status: string): Promise<BannerDto> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    if (!Object.values(ContentStatus).includes(status as ContentStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    await this.bannerRepository.update(id, { status: status as ContentStatus });
    const updated = await this.bannerRepository.findOne({ where: { id } });
    return this.mapBannerToDto(updated!);
  }

  // Article 相关方法
  async getArticles(
    tenantId: string,
    options: { category?: string; status?: string; page?: number; limit?: number } = {},
  ): Promise<{ articles: ArticleDto[]; total: number; page: number; limit: number }> {
    const { category, status, page = 1, limit = 10 } = options;
    const where: any = { tenantId };
    
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [articles, total] = await this.articleRepository.findAndCount({
      where,
      order: { sort: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      articles: articles.map(article => this.mapArticleToDto(article)),
      total,
      page,
      limit,
    };
  }

  async getArticle(id: string): Promise<ArticleDto> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    return this.mapArticleToDto(article);
  }

  async createArticle(createArticleDto: CreateArticleDto): Promise<ArticleDto> {
    // 如果没有指定排序，自动设置为最大值+1
    if (!createArticleDto.sort) {
      const maxSort = await this.articleRepository
        .createQueryBuilder('article')
        .where('article.tenantId = :tenantId', { tenantId: createArticleDto.tenantId })
        .select('MAX(article.sort)', 'maxSort')
        .getRawOne();
      createArticleDto.sort = (maxSort?.maxSort || 0) + 1;
    }

    const article = this.articleRepository.create({
      ...createArticleDto,
      status: createArticleDto.status || ContentStatus.DRAFT,
      publishedAt: createArticleDto.publishedAt ? new Date(createArticleDto.publishedAt) : null,
    });

    const saved = await this.articleRepository.save(article);
    return this.mapArticleToDto(saved);
  }

  async updateArticle(id: string, updateArticleDto: UpdateArticleDto): Promise<ArticleDto> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    const updateData: any = { ...updateArticleDto };
    if (updateArticleDto.publishedAt) {
      updateData.publishedAt = new Date(updateArticleDto.publishedAt);
    }

    await this.articleRepository.update(id, updateData);
    const updated = await this.articleRepository.findOne({ where: { id } });
    return this.mapArticleToDto(updated!);
  }

  async deleteArticle(id: string): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
  }

  async updateArticleStatus(id: string, status: string): Promise<ArticleDto> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    if (!Object.values(ContentStatus).includes(status as ContentStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const updateData: any = { status: status as ContentStatus };
    
    // 如果状态改为已发布，设置发布时间
    if (status === ContentStatus.PUBLISHED && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await this.articleRepository.update(id, updateData);
    const updated = await this.articleRepository.findOne({ where: { id } });
    return this.mapArticleToDto(updated!);
  }

  // 映射方法
  private mapBannerToDto(banner: CMSBanner): BannerDto {
    return {
      id: banner.id,
      tenantId: banner.tenantId,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkType: banner.linkType as any,
      linkPayload: banner.linkPayload,
      sort: banner.sort,
      status: banner.status as any,
      startAt: banner.startAt,
      endAt: banner.endAt,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };
  }

  private mapArticleToDto(article: CMSArticle): ArticleDto {
    return {
      id: article.id,
      tenantId: article.tenantId,
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      coverImage: article.coverImage,
      tags: article.tags,
      status: article.status as any,
      sort: article.sort,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
