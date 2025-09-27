import { IsOptional, IsString } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
