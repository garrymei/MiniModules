import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  TenantConfig,
  validateTenantConfig,
} from '@minimodules/libs/config-schema'
import { DataSource, In, Repository } from 'typeorm'
import { ModuleEntity } from '../entities/module.entity'
import { TenantModuleConfig } from '../entities/tenant-module-config.entity'
import { Tenant } from '../entities/tenant.entity'

@Injectable()
export class TenantConfigService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  async getTenantConfig(tenantId: string): Promise<TenantConfig> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: { moduleConfigs: true },
    })

    if (!tenant) {
      throw new NotFoundException('Tenant not found')
    }

    const enabledModules = Array.from(
      new Set(tenant.moduleConfigs.map(config => config.moduleId)),
    )

    const moduleConfigs: Record<string, unknown> = {}
    for (const moduleId of enabledModules) {
      const match = tenant.moduleConfigs.find(
        config => config.moduleId === moduleId,
      )
      moduleConfigs[moduleId] = match?.configJson ?? {}
    }

    return {
      tenantId: tenant.id,
      industry: tenant.industry,
      enabledModules,
      theme: tenant.theme ?? {},
      moduleConfigs,
    }
  }

  async updateTenantConfig(
    tenantId: string,
    payload: unknown,
  ): Promise<TenantConfig> {
    const result = validateTenantConfig(payload)

    if (result.valid === false) {
      throw new BadRequestException({
        message: 'Invalid tenant configuration',
        errors: result.errors,
      })
    }

    const tenantConfig = result.value

    if (tenantConfig.tenantId !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch')
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: { moduleConfigs: true },
    })

    if (!tenant) {
      throw new NotFoundException('Tenant not found')
    }

    const enabledModules = new Set(tenantConfig.enabledModules)
    const moduleConfigsInput = tenantConfig.moduleConfigs ?? {}
    Object.keys(moduleConfigsInput).forEach(moduleId =>
      enabledModules.add(moduleId),
    )

    await this.dataSource.transaction(async manager => {
      tenant.industry = tenantConfig.industry
      tenant.theme = tenantConfig.theme ?? {}
      await manager.getRepository(Tenant).save(tenant)

      const moduleRepo = manager.getRepository(ModuleEntity)
      const tenantModuleRepo = manager.getRepository(TenantModuleConfig)

      if (enabledModules.size > 0) {
        const existingModules = await moduleRepo.find({
          where: { id: In([...enabledModules]) },
        })
        const existingModuleIds = new Set(existingModules.map(module => module.id))

        for (const moduleId of enabledModules) {
          if (!existingModuleIds.has(moduleId)) {
            await moduleRepo.insert({ id: moduleId, name: moduleId })
          }
        }
      }

      const existingConfigs = await tenantModuleRepo.find({
        where: { tenantId },
      })
      const configByModule = new Map(
        existingConfigs.map(config => [config.moduleId, config]),
      )

      for (const moduleId of enabledModules) {
        const config = configByModule.get(moduleId)
        const configJson = moduleConfigsInput[moduleId] ?? {}

        if (config) {
          config.configJson = configJson as Record<string, unknown>
          await tenantModuleRepo.save(config)
        } else {
          const newConfig = tenantModuleRepo.create({
            tenantId,
            moduleId,
            configJson: configJson as Record<string, unknown>,
          })
          await tenantModuleRepo.save(newConfig)
        }
      }

      const toRemove = existingConfigs.filter(
        config => !enabledModules.has(config.moduleId),
      )
      if (toRemove.length > 0) {
        await tenantModuleRepo.remove(toRemove)
      }
    })

    return this.getTenantConfig(tenantId)
  }
}
