import { Controller, Get, Param } from '@nestjs/common'
import { TenantConfigService } from './tenant-config.service'

@Controller('api/tenant')
export class TenantConfigController {
  constructor(private readonly tenantConfigService: TenantConfigService) {}

  @Get(':id/config')
  getTenantConfig(@Param('id') tenantId: string) {
    return this.tenantConfigService.getTenantConfig(tenantId)
  }
}
