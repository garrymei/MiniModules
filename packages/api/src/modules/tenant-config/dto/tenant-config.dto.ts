import { IsString, IsArray, IsOptional, ValidateNested, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TenantThemeDto {
  @ApiProperty({ description: '主题色', example: '#1890ff', required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ description: 'Logo URL', example: 'https://example.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logo?: string;
}

export class TenantConfigDto {
  @ApiProperty({ 
    description: '启用的模块列表', 
    example: ['booking', 'ordering', 'user'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  enabledModules: string[];

  @ApiProperty({ 
    description: '主题配置', 
    type: TenantThemeDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TenantThemeDto)
  theme?: TenantThemeDto;

  @ApiProperty({ description: '配置版本号', required: false })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiProperty({ description: '配置更新时间', required: false })
  @IsOptional()
  @IsString()
  updatedAt?: string;

  @ApiProperty({ description: '配置状态', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateTenantConfigDto extends TenantConfigDto {
  @ApiProperty({ description: '配置版本', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  version?: number;
}

export class ConfigHistoryDto {
  @ApiProperty({ description: '配置版本号' })
  @IsNumber()
  version: number;

  @ApiProperty({ description: '配置状态' })
  @IsString()
  status: string;

  @ApiProperty({ description: '创建时间' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: '更新时间' })
  @IsString()
  updatedAt: string;

  @ApiProperty({ description: '提交时间', required: false })
  @IsOptional()
  @IsString()
  submittedAt?: string;

  @ApiProperty({ description: '审核时间', required: false })
  @IsOptional()
  @IsString()
  approvedAt?: string;

  @ApiProperty({ description: '发布时间', required: false })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiProperty({ description: '配置内容' })
  @IsObject()
  config: TenantConfigDto;
}

export class WorkflowNoteDto {
  @ApiProperty({ description: '目标版本号' })
  @IsNumber()
  version: number;

  @ApiProperty({ description: '备注信息', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ApproveConfigDto extends WorkflowNoteDto {
  @ApiProperty({ description: '是否同时发布', required: false })
  @IsOptional()
  publish?: boolean;
}

export class ConfigDiffItemDto {
  @ApiProperty({ description: '变更路径' })
  path: string;

  @ApiProperty({ description: '变更类型', example: 'N/U/D/A' })
  kind: string;

  @ApiProperty({ description: '原值', required: false })
  @IsOptional()
  lhs?: any;

  @ApiProperty({ description: '新值', required: false })
  @IsOptional()
  rhs?: any;
}

export class ConfigDiffResponseDto {
  @ApiProperty({ description: '源版本号' })
  @IsNumber()
  fromVersion: number;

  @ApiProperty({ description: '目标版本号' })
  @IsNumber()
  toVersion: number;

  @ApiProperty({ description: '差异列表', type: [ConfigDiffItemDto] })
  diffs: ConfigDiffItemDto[];
}
