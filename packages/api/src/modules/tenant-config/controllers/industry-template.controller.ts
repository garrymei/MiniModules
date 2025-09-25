import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { IndustryTemplateService } from '../services/industry-template.service';
import { 
  ApplyIndustryTemplateDto, 
  IndustryTemplateDto, 
  TemplateApplyResultDto 
} from '../dto/industry-template.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@Controller('admin/tenant')
@UseGuards(JwtAuthGuard)
export class IndustryTemplateController {
  constructor(
    private readonly industryTemplateService: IndustryTemplateService,
  ) {}

  @Get('templates')
  @RequirePermissions('platform:template:read')
  async getAvailableTemplates(): Promise<IndustryTemplateDto[]> {
    return this.industryTemplateService.getAvailableTemplates();
  }

  @Get('templates/:industry')
  @RequirePermissions('platform:template:read')
  async getIndustryTemplate(@Param('industry') industry: string): Promise<IndustryTemplateDto | null> {
    return this.industryTemplateService.getIndustryTemplate(industry);
  }

  @Post(':id/config/apply-industry-template')
  @RequirePermissions('tenant:config:write')
  @HttpCode(HttpStatus.OK)
  async applyIndustryTemplate(
    @Param('id') tenantId: string,
    @Body() applyDto: ApplyIndustryTemplateDto
  ): Promise<TemplateApplyResultDto> {
    return this.industryTemplateService.applyIndustryTemplate(tenantId, applyDto);
  }

  @Post('templates/:industry/preview')
  @RequirePermissions('platform:template:read')
  @HttpCode(HttpStatus.OK)
  async previewTemplateApplication(
    @Param('industry') industry: string,
    @Body() tenantOverrides?: Record<string, any>
  ): Promise<TemplateApplyResultDto> {
    return this.industryTemplateService.previewTemplateApplication(industry, tenantOverrides);
  }

  @Post('templates/:industry/validate')
  @RequirePermissions('platform:template:read')
  @HttpCode(HttpStatus.OK)
  async validateConfigAgainstTemplate(
    @Param('industry') industry: string,
    @Body() config: Record<string, any>
  ) {
    return this.industryTemplateService.validateConfigAgainstTemplate(industry, config);
  }
}
