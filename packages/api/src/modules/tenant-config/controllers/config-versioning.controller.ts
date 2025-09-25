import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Body, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ConfigVersioningService } from '../services/config-versioning.service';
import { 
  ConfigRevisionListDto,
  SubmitConfigDto,
  ApproveConfigDto,
  RollbackConfigDto,
  ConfigDiffDto
} from '../dto/config-versioning.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { I18nService } from '../../../common/i18n/i18n.service';
import { FormattingService } from '../../../common/i18n/formatting.service';
import { Locale } from '../../../common/i18n/i18n.decorator';

@Controller('admin/tenant')
@UseGuards(JwtAuthGuard)
export class ConfigVersioningController {
  constructor(
    private readonly configVersioningService: ConfigVersioningService,
    private readonly i18nService: I18nService,
    private readonly formattingService: FormattingService,
  ) {}

  @Get(':id/config/revisions')
  @RequirePermissions('tenant:config:read')
  async getConfigRevisions(@Param('id') tenantId: string): Promise<ConfigRevisionListDto> {
    return this.configVersioningService.getConfigRevisions(tenantId);
  }

  @Post(':id/config/draft')
  @RequirePermissions('tenant:config:write')
  @HttpCode(HttpStatus.OK)
  async saveDraft(
    @Param('id') tenantId: string,
    @Body() configJson: Record<string, any>
  ) {
    return this.configVersioningService.saveDraft(tenantId, configJson);
  }

  @Post(':id/config/submit')
  @RequirePermissions('tenant:config:write')
  @HttpCode(HttpStatus.OK)
  async submitForReview(
    @Param('id') tenantId: string,
    @Body() submitDto: SubmitConfigDto
  ) {
    return this.configVersioningService.submitForReview(tenantId, submitDto);
  }

  @Post(':id/config/approve')
  @RequirePermissions('platform:config:approve')
  @HttpCode(HttpStatus.OK)
  async approveConfig(
    @Param('id') tenantId: string,
    @Body() approveDto: ApproveConfigDto,
    @Request() req: any
  ) {
    const approvedBy = req.user?.id;
    return this.configVersioningService.approveConfig(tenantId, approvedBy, approveDto);
  }

  @Post(':id/config/publish')
  @RequirePermissions('tenant:config:publish')
  @HttpCode(HttpStatus.OK)
  async publishConfig(@Param('id') tenantId: string) {
    return this.configVersioningService.publishConfig(tenantId);
  }

  @Post(':id/config/rollback/:version')
  @RequirePermissions('tenant:config:publish')
  @HttpCode(HttpStatus.OK)
  async rollbackToVersion(
    @Param('id') tenantId: string,
    @Param('version') version: string,
    @Body() rollbackDto: RollbackConfigDto
  ) {
    const targetVersion = parseInt(version, 10);
    return this.configVersioningService.rollbackToVersion(tenantId, targetVersion, rollbackDto.reason);
  }

  @Get(':id/config/diff/:version1/:version2')
  @RequirePermissions('tenant:config:read')
  async getConfigDiff(
    @Param('id') tenantId: string,
    @Param('version1') version1: string,
    @Param('version2') version2: string
  ): Promise<ConfigDiffDto[]> {
    const v1 = parseInt(version1, 10);
    const v2 = parseInt(version2, 10);
    return this.configVersioningService.getConfigDiff(tenantId, v1, v2);
  }
}

@Controller('platform/tenant')
@UseGuards(JwtAuthGuard)
export class PlatformConfigController {
  constructor(
    private readonly configVersioningService: ConfigVersioningService,
  ) {}

  @Post(':id/config/approve')
  @RequirePermissions('platform:config:approve')
  @HttpCode(HttpStatus.OK)
  async approveConfig(
    @Param('id') tenantId: string,
    @Body() approveDto: ApproveConfigDto,
    @Request() req: any
  ) {
    const approvedBy = req.user?.id;
    return this.configVersioningService.approveConfig(tenantId, approvedBy, approveDto);
  }
}

@Controller('api/tenant')
export class PublicConfigController {
  constructor(
    private readonly configVersioningService: ConfigVersioningService,
  ) {}

  @Get(':id/config')
  async getPublishedConfig(@Param('id') tenantId: string): Promise<Record<string, any> | null> {
    return this.configVersioningService.getPublishedConfig(tenantId);
  }
}
