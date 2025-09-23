import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleConfig } from '../../entities/tenant-module-config.entity';
import { TenantConfigDto, UpdateTenantConfigDto } from './dto/tenant-config.dto';

@Injectable()
export class TenantConfigService {
  constructor(
    @InjectRepository(TenantModuleConfig)
    private tenantModuleConfigRepository: Repository<TenantModuleConfig>,
  ) {}

  async getTenantConfig(tenantId: string): Promise<TenantConfigDto> {
    const config = await this.tenantModuleConfigRepository.findOne({
      where: { tenantId },
      order: { version: 'DESC' }
    });

    if (!config) {
      throw new NotFoundException(`Tenant config not found for tenant: ${tenantId}`);
    }

    return config.configJson as TenantConfigDto;
  }

  async updateTenantConfig(tenantId: string, configDto: UpdateTenantConfigDto): Promise<TenantConfigDto> {
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

  async getTenantConfigHistory(tenantId: string): Promise<TenantModuleConfig[]> {
    return this.tenantModuleConfigRepository.find({
      where: { tenantId },
      order: { version: 'DESC' }
    });
  }
}
