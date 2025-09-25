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
import { CMSArticleService } from '../services/cms-article.service';
import { CreateCMSArticleDto, UpdateCMSArticleDto } from '../dto/cms-article.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@Controller('admin/cms/articles')
@UseGuards(JwtAuthGuard)
export class CMSArticleController {
  constructor(private readonly articleService: CMSArticleService) {}

  @Post()
  @RequirePermissions('tenant:cms:write')
  async create(
    @Body() createDto: CreateCMSArticleDto,
    @Query('tenantId') tenantId: string
  ) {
    return this.articleService.create(tenantId, createDto);
  }

  @Get()
  @RequirePermissions('tenant:cms:read')
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    return this.articleService.findAll(tenantId, status, category);
  }

  @Get('categories')
  @RequirePermissions('tenant:cms:read')
  async getCategories(@Query('tenantId') tenantId: string) {
    return this.articleService.getCategories(tenantId);
  }

  @Get(':id')
  @RequirePermissions('tenant:cms:read')
  async findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ) {
    return this.articleService.findOne(id, tenantId);
  }

  @Put(':id')
  @RequirePermissions('tenant:cms:write')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCMSArticleDto,
    @Query('tenantId') tenantId: string
  ) {
    return this.articleService.update(id, tenantId, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('tenant:cms:write')
  async remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string
  ) {
    await this.articleService.remove(id, tenantId);
    return { success: true };
  }

  @Put('sort')
  @RequirePermissions('tenant:cms:write')
  async updateSort(
    @Body() sortData: Array<{ id: string; sort: number }>,
    @Query('tenantId') tenantId: string
  ) {
    await this.articleService.updateSort(tenantId, sortData);
    return { success: true };
  }
}

@Controller('api/cms/articles')
export class PublicCMSArticleController {
  constructor(private readonly articleService: CMSArticleService) {}

  @Get(':tenantId')
  async findPublished(
    @Param('tenantId') tenantId: string,
    @Query('category') category?: string,
    @Query('limit') limit?: number
  ) {
    return this.articleService.findPublished(tenantId, category, limit);
  }

  @Get(':tenantId/:id')
  async findOne(
    @Param('id') id: string,
    @Param('tenantId') tenantId: string
  ) {
    return this.articleService.findOne(id, tenantId);
  }
}
