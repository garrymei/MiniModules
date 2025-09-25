import { IsString, IsOptional, IsObject } from 'class-validator';

export class ApplyIndustryTemplateDto {
  @IsString()
  industry!: string;

  @IsOptional()
  @IsObject()
  tenantOverrides?: Record<string, any>;
}

export class IndustryTemplateDto {
  @IsString()
  industry!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsObject()
  config!: Record<string, any>;

  @IsString()
  priority!: string;
}

export class TemplateApplyResultDto {
  @IsObject()
  mergedConfig!: Record<string, any>;

  @IsString()
  warnings!: string[];

  @IsString()
  appliedTemplates!: string[];
}
