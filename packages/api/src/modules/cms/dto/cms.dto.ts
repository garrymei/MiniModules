import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LinkType {
  PRODUCT = 'product',
  RESOURCE = 'resource',
  URL = 'url',
  ARTICLE = 'article',
  NONE = 'none',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export class CreateBannerDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ description: '标题' })
  @IsString()
  title!: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '图片URL' })
  @IsString()
  imageUrl!: string;

  @ApiProperty({ description: '链接类型', enum: LinkType })
  @IsEnum(LinkType)
  linkType!: LinkType;

  @ApiProperty({ description: '链接数据', required: false })
  @IsOptional()
  @IsObject()
  linkPayload?: Record<string, any>;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '状态', enum: ContentStatus, required: false })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class UpdateBannerDto {
  @ApiProperty({ description: '标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '图片URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: '链接类型', enum: LinkType, required: false })
  @IsOptional()
  @IsEnum(LinkType)
  linkType?: LinkType;

  @ApiProperty({ description: '链接数据', required: false })
  @IsOptional()
  @IsObject()
  linkPayload?: Record<string, any>;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '状态', enum: ContentStatus, required: false })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class CreateArticleDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ description: '标题' })
  @IsString()
  title!: string;

  @ApiProperty({ description: '摘要', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: '内容' })
  @IsString()
  content!: string;

  @ApiProperty({ description: '分类' })
  @IsString()
  category!: string;

  @ApiProperty({ description: '封面图片', required: false })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: '状态', enum: ContentStatus, required: false })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '发布时间', required: false })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

export class UpdateArticleDto {
  @ApiProperty({ description: '标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '摘要', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: '内容', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '封面图片', required: false })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: '状态', enum: ContentStatus, required: false })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '发布时间', required: false })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

export class BannerDto {
  @ApiProperty({ description: 'ID' })
  id!: string;

  @ApiProperty({ description: '租户ID' })
  tenantId!: string;

  @ApiProperty({ description: '标题' })
  title!: string;

  @ApiProperty({ description: '描述' })
  description?: string;

  @ApiProperty({ description: '图片URL' })
  imageUrl!: string;

  @ApiProperty({ description: '链接类型' })
  linkType!: LinkType;

  @ApiProperty({ description: '链接数据' })
  linkPayload?: Record<string, any>;

  @ApiProperty({ description: '排序' })
  sort!: number;

  @ApiProperty({ description: '状态' })
  status!: ContentStatus;

  @ApiProperty({ description: '开始时间' })
  startAt?: Date;

  @ApiProperty({ description: '结束时间' })
  endAt?: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date;
}

export class ArticleDto {
  @ApiProperty({ description: 'ID' })
  id!: string;

  @ApiProperty({ description: '租户ID' })
  tenantId!: string;

  @ApiProperty({ description: '标题' })
  title!: string;

  @ApiProperty({ description: '摘要' })
  summary?: string;

  @ApiProperty({ description: '内容' })
  content!: string;

  @ApiProperty({ description: '分类' })
  category!: string;

  @ApiProperty({ description: '封面图片' })
  coverImage?: string;

  @ApiProperty({ description: '标签' })
  tags?: string[];

  @ApiProperty({ description: '状态' })
  status!: ContentStatus;

  @ApiProperty({ description: '排序' })
  sort!: number;

  @ApiProperty({ description: '发布时间' })
  publishedAt?: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date;
}
