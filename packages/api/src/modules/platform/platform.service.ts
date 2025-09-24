import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TenantEntitlement } from '../../entities/tenant-entitlement.entity';
import { ModuleSpecService } from './module-spec.service';
import { ModuleDependencyService } from './module-dependency.service';

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
    private dataSource: DataSource,
    private moduleSpecService: ModuleSpecService,
    private moduleDependencyService: ModuleDependencyService,
  ) {}

  async onModuleInit() {
    // 初始化时加载所有模块规范
    this.moduleSpecService.loadAllModuleSpecs();
  }

  async getTenantEntitlements(tenantId: string): Promise<TenantEntitlement[]> {
    return this.tenantEntitlementRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' }
    });
  }

  async updateTenantEntitlements(tenantId: string, entitlements: TenantEntitlementDto[]): Promise<TenantEntitlement[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // 删除现有授权
      await queryRunner.manager.delete(TenantEntitlement, { tenantId });

      // 创建新授权
      const newEntitlements = entitlements.map(entitlement => 
        queryRunner.manager.create(TenantEntitlement, {
          tenantId,
          moduleKey: entitlement.moduleKey,
          status: entitlement.status,
          expiresAt: entitlement.expiresAt,
        })
      );

      const result = await queryRunner.manager.save(newEntitlements);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async addTenantEntitlement(tenantId: string, moduleKey: string, expiresAt?: Date): Promise<TenantEntitlement> {
    // 验证模块是否存在
    try {
      this.moduleSpecService.getModuleSpec(moduleKey);
    } catch (error) {
      throw new NotFoundException(`Module ${moduleKey} not found`);
    }

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

  /**
   * 验证租户模块配置
   * @param moduleId 模块ID
   * @param config 配置对象
   * @returns 验证结果
   */
  validateModuleConfig(moduleId: string, config: Record<string, any>) {
    return this.moduleSpecService.validateModuleConfig(moduleId, config);
  }

  /**
   * 检查模块依赖
   * @param moduleIds 启用的模块ID列表
   * @returns 依赖检查结果
   */
  checkModuleDependencies(moduleIds: string[]) {
    return this.moduleDependencyService.checkDependencies(moduleIds);
  }

  /**
   * 获取模块版本信息
   * @param moduleId 模块ID
   * @returns 模块版本信息
   */
  getModuleVersion(moduleId: string) {
    const spec = this.moduleSpecService.getModuleSpec(moduleId);
    return {
      id: spec.id,
      name: spec.name,
      version: spec.version,
      description: spec.description
    };
  }

  /**
   * 获取所有模块版本信息
   * @returns 所有模块版本信息
   */
  getAllModuleVersions() {
    const specs = this.moduleSpecService.getAllModuleSpecs();
    return specs.map(spec => ({
      id: spec.id,
      name: spec.name,
      version: spec.version,
      description: spec.description
    }));
  }
}