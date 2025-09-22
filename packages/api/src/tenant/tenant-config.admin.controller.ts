import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Role } from '../auth/roles.enum'
import { TenantConfigService } from './tenant-config.service'

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    username: string
    role: Role
  }
}

@Controller('admin/tenant')
@UseGuards(JwtAuthGuard)
export class TenantConfigAdminController {
  constructor(private readonly tenantConfigService: TenantConfigService) {}

  @Put(':id/config')
  updateTenantConfig(
    @Param('id') tenantId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user?.role !== Role.Admin) {
      throw new ForbiddenException('Admin role required')
    }

    return this.tenantConfigService.updateTenantConfig(tenantId, body)
  }
}
