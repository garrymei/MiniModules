import { IsString, IsOptional, IsEnum, IsInt, IsDateString, IsUUID } from 'class-validator';

export class CreateCMSBannerDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  imageUrl!: string;

  @IsEnum(['product', 'resource', 'url', 'article'])
  linkType!: 'product' | 'resource' | 'url' | 'article';

  @IsOptional()
  @IsString()
  linkPayload?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class UpdateCMSBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(['product', 'resource', 'url', 'article'])
  linkType?: 'product' | 'resource' | 'url' | 'article';

  @IsOptional()
  @IsString()
  linkPayload?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class CMSBannerDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  tenantId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  imageUrl!: string;

  @IsEnum(['product', 'resource', 'url', 'article'])
  linkType!: 'product' | 'resource' | 'url' | 'article';

  @IsOptional()
  @IsString()
  linkPayload?: string;

  @IsInt()
  sort!: number;

  @IsEnum(['active', 'inactive'])
  status!: 'active' | 'inactive';

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;
}
