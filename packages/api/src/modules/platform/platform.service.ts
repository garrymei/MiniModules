import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';

export interface TenantEntitlementDto {
  tenantId: string;
  moduleKey: string;
  status: 'active' | 'inactive' | 'expired';
  expiresAt?: Date;
}

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(TenantEntitlement)
    private tenantEntitlementRepository: Repository<TenantEntitlement>,
  ) {}

  async getTenantEntitlements(tenantId: string): Promise<TenantEntitlement[]> {
    return this.tenantEntitlementRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' }
    });
  }

  async updateTenantEntitlements(tenantId: string, entitlements: TenantEntitlementDto[]): Promise<TenantEntitlement[]> {
    // 删除现有授权
    await this.tenantEntitlementRepository.delete({ tenantId });

    // 创建新授权
    const newEntitlements = entitlements.map(entitlement => 
      this.tenantEntitlementRepository.create({
        tenantId,
        moduleKey: entitlement.moduleKey,
        status: entitlement.status,
        expiresAt: entitlement.expiresAt,
      })
    );

    return this.tenantEntitlementRepository.save(newEntitlements);
  }

  async addTenantEntitlement(tenantId: string, moduleKey: string, expiresAt?: Date): Promise<TenantEntitlement> {
    const entitlement = this.tenantEntitlementRepository.create({
      tenantId,
      moduleKey,
      status: 'active',
      expiresAt,
    });

    return this.tenantEntitlementRepository.save(entitlement);
  }

  async removeTenantEntitlement(tenantId: string, moduleKey: string): Promise<void> {
    const result = await this.tenantEntitlementRepository.delete({ tenantId, moduleKey });
    
    if (result.affected === 0) {
      throw new NotFoundException(`Entitlement not found for tenant ${tenantId} and module ${moduleKey}`);
    }
  }
}