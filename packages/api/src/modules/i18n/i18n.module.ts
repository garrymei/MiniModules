import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nTranslation } from '../../entities/i18n-translation.entity';
import { I18nService } from './i18n.service';
import { I18nController } from './i18n.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([I18nTranslation]),
    AuthModule,
  ],
  controllers: [I18nController],
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
