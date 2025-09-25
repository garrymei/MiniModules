import { IsString, IsOptional, IsEnum, IsInt, IsDateString, IsUUID } from 'class-validator';

export class CreateCMSArticleDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsEnum(['product', 'resource', 'url', 'article'])
  linkType!: 'product' | 'resource' | 'url' | 'article';

  @IsOptional()
  @IsString()
  linkPayload?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';
}

export class UpdateCMSArticleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsEnum(['product', 'resource', 'url', 'article'])
  linkType?: 'product' | 'resource' | 'url' | 'article';

  @IsOptional()
  @IsString()
  linkPayload?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';
}

export class CMSArticleDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  tenantId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsEnum(['product', 'resource', 'url', 'article'])
  linkType!: 'product' | 'resource' | 'url' | 'article';

  @IsOptional()
  @IsString()
  linkPayload?: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsInt()
  sort!: number;

  @IsEnum(['draft', 'published', 'archived'])
  status!: 'draft' | 'published' | 'archived';

  @IsInt()
  viewCount!: number;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;
}
