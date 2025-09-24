import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleConfig } from '../../entities/tenant-module-config.entity';
import { TenantConfigDto, UpdateTenantConfigDto, ConfigHistoryDto } from './dto/tenant-config.dto';
import { ModuleSpecService } from '../platform/module-spec.service';
import { ModuleDependencyService } from '../platform/module-dependency.service';

@Injectable()
export class TenantConfigService {
  constructor(
    @InjectRepository(TenantModuleConfig)
    private tenantModuleConfigRepository: Repository<TenantModuleConfig>,
    private moduleSpecService: ModuleSpecService,
    private moduleDependencyService: ModuleDependencyService,
  ) {}

  async onModuleInit() {
    // 初始化时加载所有模块规范
    this.moduleSpecService.loadAllModuleSpecs();
  }

  async getTenantConfig(tenantId: string): Promise<TenantConfigDto> {
    const config = await this.tenantModuleConfigRepository.findOne({
      where: { 
        tenantId,
        status: 'published'
      },
      order: { version: 'DESC' }
    });

    if (!config) {
      throw new NotFoundException(`Published tenant config not found for tenant: ${tenantId}`);
    }

    return config.configJson as TenantConfigDto;
  }

  async updateTenantConfig(tenantId: string, configDto: UpdateTenantConfigDto): Promise<TenantConfigDto> {
    // 验证启用的模块是否有效
    for (const moduleId of configDto.enabledModules) {
      try {
        this.moduleSpecService.getModuleSpec(moduleId);
      } catch (error) {
        throw new BadRequestException(`Invalid module: ${moduleId}`);
      }
    }

    // 检查模块依赖
    const dependencyCheck = this.moduleDependencyService.checkDependencies(configDto.enabledModules);
    if (!dependencyCheck.valid) {
      throw new BadRequestException(`Module dependency check failed: ${dependencyCheck.errors?.join(', ')}`);
    }

    // 验证每个模块的配置
    for (const [key, value] of Object.entries(configDto)) {
      // 跳过非对象类型的配置（如enabledModules、theme等）
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // 检查这个键是否是模块ID
        if (configDto.enabledModules.includes(key)) {
          const validationResult = this.moduleSpecService.validateModuleConfig(key, value);
          if (!validationResult.isValid) {
            throw new BadRequestException(`Invalid configuration for module ${key}: ${validationResult.errors?.join(', ')}`);
          }
        }
      }
    }

    // 获取当前版本
    const currentConfig = await this.tenantModuleConfigRepository.findOne({
      where: { tenantId },
      order: { version: 'DESC' }
    });

    const newVersion = currentConfig ? currentConfig.version + 1 : 1;

    // 创建新配置记录
    const newConfig = this.tenantModuleConfigRepository.create({
      tenantId,
      configJson: configDto,
      version: newVersion,
    });

    await this.tenantModuleConfigRepository.save(newConfig);

    return configDto;
  }

  async publishTenantConfig(tenantId: string, version: number): Promise<TenantConfigDto> {
    const config = await this.tenantModuleConfigRepository.findOne({
      where: { tenantId, version }
    });

    if (!config) {
      throw new NotFoundException(`Tenant config not found for tenant: ${tenantId}, version: ${version}`);
    }

    // 更新状态为已发布
    config.status = 'published';
    await this.tenantModuleConfigRepository.save(config);

    return config.configJson as TenantConfigDto;
  }

  async getTenantConfigHistory(tenantId: string): Promise<ConfigHistoryDto[]> {
    const configs = await this.tenantModuleConfigRepository.find({
      where: { tenantId },
      order: { version: 'DESC' }
    });

    return configs.map(config => ({
      version: config.version,
      status: config.status,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      config: config.configJson as TenantConfigDto
    }));
  }
}