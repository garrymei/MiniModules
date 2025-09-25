import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query,
  UseGuards
} from '@nestjs/common';
import { CMSBannerService } from '../services/cms-banner.service';
import { CreateCMSBannerDto, UpdateCMSBannerDto } from '../dto/cms-banner.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@Controller('admin/cms/banners')
@UseGuards(JwtAuthGuard)
export class CMSBannerController {
  constructor(private readonly bannerService: CMSBannerService) {}

  @Post()
  @RequirePermissions('tenant:cms:write')
  async create(
    @Body() createDto: CreateCMSBannerDto,
    @Query('tenantId') tenantId: string
  ) {
    return this.bannerService.create(tenantId, createDto);
  }

  @Get()
  @RequirePermissions('tenant:cms:read')
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: string
  ) {
    return this.bannerService.findAll(tenantId, status);
  }

  @Get(':id')
  @RequirePermissions('tenant:cms:read')
  async findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ) {
    return this.bannerService.findOne(id, tenantId);
  }

  @Put(':id')
  @RequirePermissions('tenant:cms:write')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCMSBannerDto,
    @Query('tenantId') tenantId: string
  ) {
    return this.bannerService.update(id, tenantId, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('tenant:cms:write')
  async remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ) {
    await this.bannerService.remove(id, tenantId);
    return { success: true };
  }

  @Put('sort')
  @RequirePermissions('tenant:cms:write')
  async updateSort(
    @Body() sortData: Array<{ id: string; sort: number }>,
    @Query('tenantId') tenantId: string
  ) {
    await this.bannerService.updateSort(tenantId, sortData);
    return { success: true };
  }
}

@Controller('api/cms/banners')
export class PublicCMSBannerController {
  constructor(private readonly bannerService: CMSBannerService) {}

  @Get(':tenantId')
  async findActive(@Param('tenantId') tenantId: string) {
    return this.bannerService.findActive(tenantId);
  }
}
