import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface I18nConfig {
  defaultLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
  namespace: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLocale = 'zh-CN';
  private fallbackLocale = 'en-US';
  private translations: Map<string, TranslationData> = new Map();
  private translationsSubject = new BehaviorSubject<TranslationData>({});
  public translations$ = this.translationsSubject.asObservable();

  private config: I18nConfig = {
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
    supportedLocales: ['zh-CN', 'en-US'],
    namespace: 'mobile'
  };

  constructor(private http: HttpClient) {
    this.loadInitialTranslations();
  }

  /**
   * 获取当前语言
   */
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * 设置当前语言
   */
  setLocale(locale: string): Observable<boolean> {
    if (!this.config.supportedLocales.includes(locale)) {
      console.warn(`Locale ${locale} is not supported`);
      return of(false);
    }

    this.currentLocale = locale;
    localStorage.setItem('preferred-locale', locale);
    
    return this.loadTranslations(locale).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * 获取翻译文本
   */
  translate(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key);
    return this.interpolate(translation, params);
  }

  /**
   * 获取翻译文本（异步）
   */
  translateAsync(key: string, params?: Record<string, any>): Observable<string> {
    return this.translations$.pipe(
      map(() => this.translate(key, params))
    );
  }

  /**
   * 批量获取翻译文本
   */
  translateBatch(keys: string[]): Observable<Record<string, string>> {
    return this.http.post<Record<string, string>>('/api/i18n/translations/batch', {
      keys,
      locale: this.currentLocale,
      namespace: this.config.namespace,
      fallbackLocale: this.fallbackLocale
    }).pipe(
      catchError(() => of({}))
    );
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }

  /**
   * 检查是否支持某个语言
   */
  isLocaleSupported(locale: string): boolean {
    return this.config.supportedLocales.includes(locale);
  }

  /**
   * 获取语言显示名称
   */
  getLocaleDisplayName(locale: string): string {
    const displayNames: Record<string, string> = {
      'zh-CN': '简体中文',
      'en-US': 'English',
      'zh-TW': '繁體中文',
      'ja-JP': '日本語',
      'ko-KR': '한국어'
    };
    return displayNames[locale] || locale;
  }

  /**
   * 获取语言方向
   */
  getLocaleDirection(locale: string): 'ltr' | 'rtl' {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    const localePrefix = locale.split('-')[0];
    return rtlLocales.includes(localePrefix) ? 'rtl' : 'ltr';
  }

  /**
   * 格式化数字
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(value);
  }

  /**
   * 格式化货币
   */
  formatCurrency(value: number, currency: string = 'CNY'): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency
    }).format(value);
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * 格式化相对时间
   */
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    const rtf = new Intl.RelativeTimeFormat(this.currentLocale, { numeric: 'auto' });
    return rtf.format(value, unit);
  }

  /**
   * 获取翻译文本
   */
  private getTranslation(key: string): string {
    const keys = key.split('.');
    let translation: any = this.translations.get(this.currentLocale) || {};

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // 尝试使用fallback语言
        const fallbackTranslation = this.translations.get(this.fallbackLocale) || {};
        let fallbackValue: any = fallbackTranslation;
        
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key; // 返回key作为fallback
          }
        }
        
        return typeof fallbackValue === 'string' ? fallbackValue : key;
      }
    }

    return typeof translation === 'string' ? translation : key;
  }

  /**
   * 插值替换
   */
  private interpolate(text: string, params?: Record<string, any>): string {
    if (!params) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * 加载初始翻译
   */
  private loadInitialTranslations(): void {
    const savedLocale = localStorage.getItem('preferred-locale');
    if (savedLocale && this.isLocaleSupported(savedLocale)) {
      this.currentLocale = savedLocale;
    }

    this.loadTranslations(this.currentLocale).subscribe();
  }

  /**
   * 加载翻译文件
   */
  private loadTranslations(locale: string): Observable<TranslationData> {
    // 先尝试从本地文件加载
    return this.http.get<TranslationData>(`/assets/i18n/${locale}.json`).pipe(
      tap(translations => {
        this.translations.set(locale, translations);
        this.translationsSubject.next(translations);
      }),
      catchError(() => {
        // 如果本地文件不存在，从API加载
        return this.http.get<Record<string, string>>(`/api/i18n/export/${locale}/${this.config.namespace}`).pipe(
          map(apiTranslations => {
            const nestedTranslations = this.nestTranslations(apiTranslations);
            this.translations.set(locale, nestedTranslations);
            this.translationsSubject.next(nestedTranslations);
            return nestedTranslations;
          }),
          catchError(() => {
            // 如果API也失败，使用空对象
            const emptyTranslations = {};
            this.translations.set(locale, emptyTranslations);
            this.translationsSubject.next(emptyTranslations);
            return of(emptyTranslations);
          })
        );
      })
    );
  }

  /**
   * 将扁平化的翻译对象转换为嵌套对象
   */
  private nestTranslations(flatTranslations: Record<string, string>): TranslationData {
    const nested: TranslationData = {};

    for (const [key, value] of Object.entries(flatTranslations)) {
      const keys = key.split('.');
      let current = nested;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k] as TranslationData;
      }

      current[keys[keys.length - 1]] = value;
    }

    return nested;
  }

  /**
   * 预加载翻译
   */
  preloadTranslations(locales: string[]): Observable<boolean> {
    const loadPromises = locales.map(locale => 
      this.loadTranslations(locale).pipe(
        map(() => true),
        catchError(() => of(false))
      )
    );

    return new Observable(observer => {
      let completed = 0;
      let allSuccess = true;

      loadPromises.forEach(promise => {
        promise.subscribe({
          next: (success) => {
            if (!success) allSuccess = false;
            completed++;
            if (completed === loadPromises.length) {
              observer.next(allSuccess);
              observer.complete();
            }
          },
          error: () => {
            allSuccess = false;
            completed++;
            if (completed === loadPromises.length) {
              observer.next(allSuccess);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * 获取翻译统计信息
   */
  getTranslationStats(): Observable<any> {
    return this.http.get('/api/i18n/stats');
  }

  /**
   * 检查翻译完整性
   */
  checkTranslationCompleteness(): Observable<{
    missing: string[];
    incomplete: string[];
  }> {
    return this.http.get<{
      missing: string[];
      incomplete: string[];
    }>('/api/i18n/completeness');
  }
}
