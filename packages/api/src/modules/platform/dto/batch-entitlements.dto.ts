import { IsArray, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BatchOperationType {
  GRANT = 'grant',
  REVOKE = 'revoke',
  UPDATE = 'update',
}

export class BatchEntitlementItem {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ description: '模块标识' })
  @IsString()
  moduleKey!: string;

  @ApiProperty({ description: '授权状态', enum: ['active', 'inactive', 'expired'] })
  @IsString()
  status!: string;

  @ApiProperty({ description: '过期时间', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class BatchEntitlementsDto {
  @ApiProperty({ description: '批量操作类型', enum: BatchOperationType })
  @IsEnum(BatchOperationType)
  operation!: BatchOperationType;

  @ApiProperty({ description: '批量授权项', type: [BatchEntitlementItem] })
  @IsArray()
  items!: BatchEntitlementItem[];

  @ApiProperty({ description: '操作备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class BatchEntitlementsResult {
  @ApiProperty({ description: '成功数量' })
  successCount!: number;

  @ApiProperty({ description: '失败数量' })
  failureCount!: number;

  @ApiProperty({ description: '失败详情' })
  failures!: Array<{
    tenantId: string;
    moduleKey: string;
    error: string;
  }>;

  @ApiProperty({ description: '操作ID' })
  operationId!: string;
}
