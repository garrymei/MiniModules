import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param,
  UseGuards
} from '@nestjs/common';
import { ThemeService } from './theme.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('admin/theme')
@UseGuards(JwtAuthGuard)
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get(':tenantId/preview')
  @RequirePermissions('tenant:theme:read')
  async getThemePreview(@Param('tenantId') tenantId: string) {
    return this.themeService.getThemePreview(tenantId);
  }

  @Post(':tenantId/preview')
  @RequirePermissions('tenant:theme:write')
  async updateThemePreview(
    @Param('tenantId') tenantId: string,
    @Body() themeConfig: any
  ) {
    return this.themeService.updateThemePreview(tenantId, themeConfig);
  }

  @Post(':tenantId/sync')
  @RequirePermissions('tenant:theme:publish')
  async syncThemeToMobile(@Param('tenantId') tenantId: string) {
    return this.themeService.syncThemeToMobile(tenantId);
  }
}

@Controller('api/theme')
export class PublicThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get(':tenantId')
  async getPublishedTheme(@Param('tenantId') tenantId: string) {
    return this.themeService.getPublishedTheme(tenantId);
  }
}
