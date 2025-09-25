import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Product } from '../../entities/product.entity';
import { Resource } from '../../entities/resource.entity';
import { CMSArticle } from '../../entities/cms-article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Resource, CMSArticle])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
