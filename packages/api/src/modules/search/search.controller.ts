import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '综合搜索商品、场地与文章' })
  @ApiQuery({ name: 'q', required: true, description: '搜索关键词' })
  @ApiQuery({ name: 'tenantId', required: false, description: '租户ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回结果数量限制' })
  async search(
    @Query('q') q: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ) {
    if (!q || !q.trim()) {
      throw new BadRequestException('Query parameter q is required');
    }

    const limitValue = limit ? Number.parseInt(limit, 10) : undefined;
    return this.searchService.search(q, tenantId, Number.isNaN(limitValue) ? undefined : limitValue);
  }
}
