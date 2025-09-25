import { IsString, IsOptional, IsObject, IsEnum, IsUUID, IsDateString } from 'class-validator';

export enum ConfigStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  REJECTED = 'rejected'
}

export class ConfigRevisionDto {
  @IsString()
  id!: string;

  @IsString()
  tenantId!: string;

  @IsObject()
  configJson!: Record<string, any>;

  @IsString()
  version!: string;

  @IsEnum(ConfigStatus)
  status!: ConfigStatus;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  reviewNote?: string;

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;
}

export class ConfigDiffDto {
  @IsString()
  path!: string;

  @IsString()
  operation!: 'add' | 'remove' | 'modify';

  @IsOptional()
  oldValue?: any;

  @IsOptional()
  newValue?: any;
}

export class ConfigRevisionListDto {
  @IsString()
  revisions!: ConfigRevisionDto[];

  @IsString()
  currentPublishedVersion?: string;
}

export class SubmitConfigDto {
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class ApproveConfigDto {
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class RollbackConfigDto {
  @IsString()
  targetVersion!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
