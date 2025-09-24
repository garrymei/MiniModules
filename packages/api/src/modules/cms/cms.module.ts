import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';
import { CMSContent } from '../../entities/cms-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CMSContent])],
  controllers: [CMSController],
  providers: [CMSService],
  exports: [CMSService],
})
export class CMSModule {}
