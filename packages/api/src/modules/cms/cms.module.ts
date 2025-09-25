import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';
import { CMSBannerController, PublicCMSBannerController } from './controllers/cms-banner.controller';
import { CMSArticleController, PublicCMSArticleController } from './controllers/cms-article.controller';
import { CMSBannerService } from './services/cms-banner.service';
import { CMSArticleService } from './services/cms-article.service';
import { CMSContent } from '../../entities/cms-content.entity';
import { CMSBanner } from '../../entities/cms-banner.entity';
import { CMSArticle } from '../../entities/cms-article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CMSContent, CMSBanner, CMSArticle])],
  controllers: [
    CMSController,
    CMSBannerController,
    PublicCMSBannerController,
    CMSArticleController,
    PublicCMSArticleController,
  ],
  providers: [CMSService, CMSBannerService, CMSArticleService],
  exports: [CMSService, CMSBannerService, CMSArticleService],
})
export class CMSModule {}
