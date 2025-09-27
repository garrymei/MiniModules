import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../../entities/product.entity';
import { Resource, ResourceStatus } from '../../entities/resource.entity';
import { CMSArticle } from '../../entities/cms-article.entity';

export type SearchResultType = 'product' | 'resource' | 'article';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  description?: string | null;
  score: number;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(CMSArticle)
    private readonly articleRepository: Repository<CMSArticle>,
  ) {}

  async search(
    keyword: string,
    tenantId?: string,
    limit: number = 15,
  ): Promise<SearchResultItem[]> {
    if (!keyword.trim()) {
      return [];
    }

    const normalizedLimit = Math.min(Math.max(limit, 1), 60);
    const perCategoryLimit = Math.max(3, Math.ceil(normalizedLimit / 3));
    const pattern = `%${keyword.trim()}%`;
    const lowerPattern = pattern.toLowerCase();

    const [productRows, resourceRows, articleRows] = await Promise.all([
      this.queryProducts(lowerPattern, tenantId, perCategoryLimit),
      this.queryResources(lowerPattern, tenantId, perCategoryLimit),
      this.queryArticles(lowerPattern, tenantId, perCategoryLimit),
    ]);

    const combined: SearchResultItem[] = [
      ...productRows,
      ...resourceRows,
      ...articleRows,
    ];

    combined.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return combined.slice(0, normalizedLimit);
  }

  private async queryProducts(
    lowerPattern: string,
    tenantId: string | undefined,
    limit: number,
  ): Promise<SearchResultItem[]> {
    // 使用全文搜索索引提高性能
    const qb = this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.description',
        'product.category',
        'product.type',
        'product.images',
        'product.updatedAt',
        `ts_rank(
          to_tsvector('english', product.name || ' ' || COALESCE(product.description, '') || ' ' || COALESCE(product.category, '')),
          plainto_tsquery('english', :searchTerm)
        ) AS score`,
      ])
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.isAvailable = true')
      .andWhere(
        `to_tsvector('english', product.name || ' ' || COALESCE(product.description, '') || ' ' || COALESCE(product.category, '')) @@ plainto_tsquery('english', :searchTerm)`,
        { searchTerm: lowerPattern.replace(/%/g, '') }
      )
      .orderBy('score', 'DESC')
      .addOrderBy('product.updatedAt', 'DESC')
      .limit(limit);

    if (tenantId) {
      qb.andWhere('product.tenantId = :tenantId', { tenantId });
    }

    const products = await qb.getMany();

    return products
      .map((product) => ({
        type: 'product' as SearchResultType,
        id: product.id,
        title: product.name,
        description: product.description,
        score: 1, // 全文搜索的分数由数据库计算
        updatedAt: product.updatedAt,
        metadata: {
          category: product.category,
          productType: product.type,
          thumbnail: this.extractFirstImage(product.images),
        },
      }));
  }

  private async queryResources(
    lowerPattern: string,
    tenantId: string | undefined,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const qb = this.resourceRepository
      .createQueryBuilder('resource')
      .select([
        'resource.id AS id',
        'resource.name AS title',
        'resource.description AS description',
        'resource.type AS type',
        'resource.capacity AS capacity',
        'resource.images AS images',
        'resource.updatedAt AS updatedAt',
        `(
          (CASE WHEN LOWER(resource.name) LIKE :pattern THEN 3 ELSE 0 END) +
          (CASE WHEN resource.description IS NOT NULL AND LOWER(resource.description) LIKE :pattern THEN 1 ELSE 0 END)
        ) AS score`,
      ])
      .where('resource.status = :status', { status: ResourceStatus.ACTIVE })
      .andWhere(
        'LOWER(resource.name) LIKE :pattern OR (resource.description IS NOT NULL AND LOWER(resource.description) LIKE :pattern)',
        { pattern: lowerPattern },
      )
      .orderBy('score', 'DESC')
      .addOrderBy('resource.updatedAt', 'DESC')
      .take(limit);

    if (tenantId) {
      qb.andWhere('resource.tenantId = :tenantId', { tenantId });
    }

    const rows = await qb.getRawMany();

    return rows
      .filter((row) => Number(row.score) > 0)
      .map((row) => ({
        type: 'resource' as SearchResultType,
        id: row.id,
        title: row.title,
        description: row.description,
        score: Number(row.score),
        updatedAt: new Date(row.updatedAt),
        metadata: {
          resourceType: row.type,
          capacity: row.capacity !== null && row.capacity !== undefined ? Number(row.capacity) : undefined,
          thumbnail: this.extractFirstImage(row.images),
        },
      }));
  }

  private async queryArticles(
    lowerPattern: string,
    tenantId: string | undefined,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const qb = this.articleRepository
      .createQueryBuilder('article')
      .select([
        'article.id AS id',
        'article.title AS title',
        'article.excerpt AS excerpt',
        'article.tags AS tags',
        'article.updatedAt AS updatedAt',
        `(
          (CASE WHEN LOWER(article.title) LIKE :pattern THEN 3 ELSE 0 END) +
          (CASE WHEN article.tags IS NOT NULL AND LOWER(article.tags) LIKE :pattern THEN 2 ELSE 0 END) +
          (CASE WHEN article.excerpt IS NOT NULL AND LOWER(article.excerpt) LIKE :pattern THEN 1 ELSE 0 END)
        ) AS score`,
      ])
      .where(
        'LOWER(article.title) LIKE :pattern OR (article.tags IS NOT NULL AND LOWER(article.tags) LIKE :pattern) OR (article.excerpt IS NOT NULL AND LOWER(article.excerpt) LIKE :pattern)',
        { pattern: lowerPattern },
      )
      .orderBy('score', 'DESC')
      .addOrderBy('article.updatedAt', 'DESC')
      .take(limit);

    if (tenantId) {
      qb.andWhere('article.tenantId = :tenantId', { tenantId });
    }

    const rows = await qb.getRawMany();

    return rows
      .filter((row) => Number(row.score) > 0)
      .map((row) => ({
        type: 'article' as SearchResultType,
        id: row.id,
        title: row.title,
        description: row.excerpt,
        score: Number(row.score),
        updatedAt: new Date(row.updatedAt),
        metadata: {
          tags: row.tags,
        },
      }));
  }

  private extractFirstImage(raw: unknown): string | undefined {
    if (!raw) {
      return undefined;
    }

    if (Array.isArray(raw)) {
      return raw[0];
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed[0];
        }
      } catch {
        return undefined;
      }
    }

    return undefined;
  }
}
