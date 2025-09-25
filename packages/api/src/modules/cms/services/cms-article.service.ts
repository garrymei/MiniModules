import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CMSArticle } from '../../../entities/cms-article.entity';
import { CreateCMSArticleDto, UpdateCMSArticleDto, CMSArticleDto } from '../dto/cms-article.dto';

@Injectable()
export class CMSArticleService {
  constructor(
    @InjectRepository(CMSArticle)
    private articleRepository: Repository<CMSArticle>,
  ) {}

  async create(tenantId: string, createDto: CreateCMSArticleDto): Promise<CMSArticleDto> {
    const article = this.articleRepository.create({
      ...createDto,
      tenantId,
    });

    const saved = await this.articleRepository.save(article);
    return this.mapToDto(saved);
  }

  async findAll(tenantId: string, status?: string, category?: string): Promise<CMSArticleDto[]> {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }

    const articles = await this.articleRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    return articles.map(this.mapToDto);
  }

  async findPublished(tenantId: string, category?: string, limit?: number): Promise<CMSArticleDto[]> {
    const query = this.articleRepository
      .createQueryBuilder('article')
      .where('article.tenantId = :tenantId', { tenantId })
      .andWhere('article.status = :status', { status: 'published' })
      .orderBy('article.sort', 'ASC')
      .addOrderBy('article.publishedAt', 'DESC');

    if (category) {
      query.andWhere('article.category = :category', { category });
    }

    if (limit) {
      query.limit(limit);
    }

    const articles = await query.getMany();
    return articles.map(this.mapToDto);
  }

  async findOne(id: string, tenantId: string): Promise<CMSArticleDto> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // 增加浏览次数
    await this.articleRepository.increment({ id, tenantId }, 'viewCount', 1);

    return this.mapToDto(article);
  }

  async update(id: string, tenantId: string, updateDto: UpdateCMSArticleDto): Promise<CMSArticleDto> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // 如果状态从草稿变为发布，设置发布时间
    if (updateDto.status === 'published' && article.status !== 'published') {
      (updateDto as any).publishedAt = new Date().toISOString();
    }

    Object.assign(article, updateDto);
    const saved = await this.articleRepository.save(article);
    return this.mapToDto(saved);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.articleRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException('Article not found');
    }
  }

  async updateSort(tenantId: string, sortData: Array<{ id: string; sort: number }>): Promise<void> {
    for (const item of sortData) {
      await this.articleRepository.update(
        { id: item.id, tenantId },
        { sort: item.sort }
      );
    }
  }

  async getCategories(tenantId: string): Promise<string[]> {
    const result = await this.articleRepository
      .createQueryBuilder('article')
      .select('DISTINCT article.category', 'category')
      .where('article.tenantId = :tenantId', { tenantId })
      .andWhere('article.status = :status', { status: 'published' })
      .getRawMany();

    return result.map(item => item.category).filter(Boolean);
  }

  private mapToDto(article: CMSArticle): CMSArticleDto {
    return {
      id: article.id,
      tenantId: article.tenantId,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverUrl: article.coverUrl,
      linkType: article.linkType,
      linkPayload: article.linkPayload,
      category: article.category,
      tags: article.tags,
      sort: article.sort,
      status: article.status,
      viewCount: article.viewCount,
      publishedAt: article.publishedAt?.toISOString(),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };
  }
}
