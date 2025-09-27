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

@Controller('admin/config')
@UseGuards(JwtAuthGuard)
export class ConfigVersioningController {
  constructor(
    private readonly configVersioningService: ConfigVersioningService,
  ) {}

  @Get('revisions/:tenantId')
  @RequirePermissions('tenant:config:read')
  async getConfigRevisions(@Param('tenantId') tenantId: string): Promise<ConfigRevisionListDto> {
    return this.configVersioningService.getConfigRevisions(tenantId);
  }

  @Post('draft/:tenantId')
  @RequirePermissions('tenant:config:write')
  @HttpCode(HttpStatus.OK)
  async saveDraft(
    @Param('tenantId') tenantId: string,
    @Body() configJson: Record<string, any>,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.configVersioningService.saveDraft(tenantId, configJson, userId);
  }

  @Post('submit/:tenantId')
  @RequirePermissions('tenant:config:write')
  @HttpCode(HttpStatus.OK)
  async submitForReview(
    @Param('tenantId') tenantId: string,
    @Body() submitDto: SubmitConfigDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.configVersioningService.submitForReview(tenantId, userId, submitDto);
  }

  @Post('approve/:revisionId')
  @RequirePermissions('platform:config:approve')
  @HttpCode(HttpStatus.OK)
  async approveConfig(
    @Param('revisionId') revisionId: string,
    @Body() approveDto: ApproveConfigDto,
    @Request() req: any,
  ) {
    const approvedBy = req.user?.id;
    return this.configVersioningService.approveConfig(revisionId, approvedBy, approveDto);
  }

  @Post('publish/:revisionId')
  @RequirePermissions('tenant:config:publish')
  @HttpCode(HttpStatus.OK)
  async publishConfig(
      @Param('revisionId') revisionId: string,
      @Request() req: any,
    ) {
    const publishedBy = req.user?.id;
    return this.configVersioningService.publishConfig(revisionId, publishedBy);
  }

  @Post('rollback/:tenantId/:version')
  @RequirePermissions('tenant:config:publish')
  @HttpCode(HttpStatus.OK)
  async rollbackToVersion(
    @Param('tenantId') tenantId: string,
    @Param('version') version: string,
    @Body() rollbackDto: RollbackConfigDto,
    @Request() req: any,
  ) {
    const targetVersion = parseInt(version, 10);
    const userId = req.user?.id;
    return this.configVersioningService.rollbackToVersion(tenantId, targetVersion, userId, rollbackDto.reason);
  }

  @Get('diff/:tenantId/:version1/:version2')
  @RequirePermissions('tenant:config:read')
  async getConfigDiff(
    @Param('tenantId') tenantId: string,
    @Param('version1') version1: string,
    @Param('version2') version2: string
  ): Promise<ConfigDiffDto[]> {
    const v1 = parseInt(version1, 10);
    const v2 = parseInt(version2, 10);
    return this.configVersioningService.getConfigDiff(tenantId, v1, v2);
  }
}

@Controller('api/tenant-config')
export class PublicConfigController {
  constructor(
    private readonly configVersioningService: ConfigVersioningService,
  ) {}

  @Get(':tenantId')
  async getPublishedConfig(@Param('tenantId') tenantId: string): Promise<Record<string, any> | null> {
    return this.configVersioningService.getPublishedConfig(tenantId);
  }
}