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

  @ApiProperty({ description: '配置内容' })
  @IsObject()
  config: TenantConfigDto;
}