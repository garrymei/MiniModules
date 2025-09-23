import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntitlements } from '../../entities/tenant-entitlements.entity';

export interface EntitlementDto {
  moduleKey: string;
  status: 'enabled' | 'disabled';
  expiresAt?: Date | null;
}

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(TenantEntitlements)
    private entitlementsRepository: Repository<TenantEntitlements>,
  ) {}

  async getTenantEntitlements(tenantId: string): Promise<TenantEntitlements[]> {
    return this.entitlementsRepository.find({
      where: { tenantId },
      order: { moduleKey: 'ASC' }
    });
  }

  async updateTenantEntitlements(tenantId: string, entitlements: EntitlementDto[]): Promise<TenantEntitlements[]> {
    // 删除现有授权
    await this.entitlementsRepository.delete({ tenantId });

    // 创建新授权
    const newEntitlements = entitlements.map(entitlement => 
      this.entitlementsRepository.create({
        tenantId,
        moduleKey: entitlement.moduleKey,
        status: entitlement.status,
        expiresAt: entitlement.expiresAt,
      })
    );

    return this.entitlementsRepository.save(newEntitlements);
  }

  async checkModuleAccess(tenantId: string, moduleKey: string): Promise<boolean> {
    const entitlement = await this.entitlementsRepository.findOne({
      where: {
        tenantId,
        moduleKey,
        status: 'enabled',
      },
    });

    if (!entitlement) {
      return false;
    }

    // 检查是否过期
    if (entitlement.expiresAt && entitlement.expiresAt <= new Date()) {
      return false;
    }

    return true;
  }
}
