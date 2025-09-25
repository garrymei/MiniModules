import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { I18nService } from './i18n.service';

@Injectable()
export class I18nInterceptor implements NestInterceptor {
  constructor(private readonly i18nService: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract locale from Accept-Language header
    const acceptLanguage = request.headers['accept-language'];
    let locale = 'zh-CN'; // default locale
    
    if (acceptLanguage) {
      // Parse Accept-Language header (e.g., "zh-CN,zh;q=0.9,en;q=0.8")
      const languages = acceptLanguage
        .split(',')
        .map(lang => {
          const [locale, qValue] = lang.trim().split(';q=');
          return {
            locale: locale.trim(),
            quality: qValue ? parseFloat(qValue) : 1.0
          };
        })
        .sort((a, b) => b.quality - a.quality);

      // Find the first supported locale
      for (const lang of languages) {
        if (this.i18nService.isLocaleSupported(lang.locale)) {
          locale = lang.locale;
          break;
        }
        // Check for language without region (e.g., "zh" from "zh-CN")
        const languageOnly = lang.locale.split('-')[0];
        if (this.i18nService.isLocaleSupported(languageOnly)) {
          locale = languageOnly;
          break;
        }
      }
    }

    // Add locale to request object for use in controllers
    request.locale = locale;
    
    return next.handle();
  }
}
