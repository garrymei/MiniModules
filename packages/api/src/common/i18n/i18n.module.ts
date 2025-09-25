import { Module, Global } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { I18nInterceptor } from './i18n.interceptor';
import { FormattingService } from './formatting.service';

@Global()
@Module({
  providers: [I18nService, I18nInterceptor, FormattingService],
  exports: [I18nService, I18nInterceptor, FormattingService],
})
export class I18nModule {}
