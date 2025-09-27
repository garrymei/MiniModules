import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nTranslation } from '../../entities/i18n-translation.entity';

export interface TranslationKey {
  key: string;
  namespace: string;
  locale: string;
}

export interface TranslationValue {
  key: string;
  namespace: string;
  locale: string;
  value: string;
  context?: string;
  description?: string;
}

export interface BulkTranslationUpdate {
  locale: string;
  namespace: string;
  translations: Record<string, string>;
}

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private readonly cache = new Map<string, Map<string, string>>();

  constructor(
    @InjectRepository(I18nTranslation)
    private i18nTranslationRepository: Repository<I18nTranslation>,
  ) {}

  /**
   * 获取翻译文本
   */
  async getTranslation(
    key: string,
    locale: string,
    namespace: string = 'default',
    fallbackLocale: string = 'en-US',
  ): Promise<string> {
    // 先从缓存获取
    const cacheKey = `${locale}:${namespace}`;
    if (this.cache.has(cacheKey)) {
      const translations = this.cache.get(cacheKey);
      if (translations?.has(key)) {
        return translations.get(key) || key;
      }
    }

    // 从数据库获取
    let translation = await this.i18nTranslationRepository.findOne({
      where: { key, locale, namespace },
    });

    // 如果没找到，尝试使用fallback语言
    if (!translation && fallbackLocale !== locale) {
      translation = await this.i18nTranslationRepository.findOne({
        where: { key, locale: fallbackLocale, namespace },
      });
    }

    const value = translation?.value || key;

    // 更新缓存
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, new Map());
    }
    this.cache.get(cacheKey)?.set(key, value);

    return value;
  }

  /**
   * 批量获取翻译文本
   */
  async getTranslations(
    keys: string[],
    locale: string,
    namespace: string = 'default',
    fallbackLocale: string = 'en-US',
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    // 先从缓存获取
    const cacheKey = `${locale}:${namespace}`;
    const cachedTranslations = this.cache.get(cacheKey);

    for (const key of keys) {
      if (cachedTranslations?.has(key)) {
        result[key] = cachedTranslations.get(key) || key;
      } else {
        result[key] = await this.getTranslation(key, locale, namespace, fallbackLocale);
      }
    }

    return result;
  }

  /**
   * 设置翻译文本
   */
  async setTranslation(
    key: string,
    locale: string,
    value: string,
    namespace: string = 'default',
    context?: string,
    description?: string,
  ): Promise<I18nTranslation> {
    let translation = await this.i18nTranslationRepository.findOne({
      where: { key, locale, namespace },
    });

    if (translation) {
      translation.value = value;
      translation.context = context;
      translation.description = description;
      translation.updatedAt = new Date();
    } else {
      translation = this.i18nTranslationRepository.create({
        key,
        locale,
        value,
        namespace,
        context,
        description,
      });
    }

    const savedTranslation = await this.i18nTranslationRepository.save(translation);

    // 更新缓存
    const cacheKey = `${locale}:${namespace}`;
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, new Map());
    }
    this.cache.get(cacheKey)?.set(key, value);

    return savedTranslation;
  }

  /**
   * 批量设置翻译文本
   */
  async setTranslations(
    translations: TranslationValue[],
  ): Promise<I18nTranslation[]> {
    const results: I18nTranslation[] = [];

    for (const translation of translations) {
      const result = await this.setTranslation(
        translation.key,
        translation.locale,
        translation.value,
        translation.namespace,
        translation.context,
        translation.description,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 删除翻译文本
   */
  async deleteTranslation(
    key: string,
    locale: string,
    namespace: string = 'default',
  ): Promise<void> {
    await this.i18nTranslationRepository.delete({
      key,
      locale,
      namespace,
    });

    // 从缓存中移除
    const cacheKey = `${locale}:${namespace}`;
    this.cache.get(cacheKey)?.delete(key);
  }

  /**
   * 获取命名空间的所有翻译
   */
  async getNamespaceTranslations(
    namespace: string,
    locale: string,
  ): Promise<Record<string, string>> {
    const translations = await this.i18nTranslationRepository.find({
      where: { namespace, locale },
    });

    const result: Record<string, string> = {};
    for (const translation of translations) {
      result[translation.key] = translation.value;
    }

    return result;
  }

  /**
   * 获取所有支持的语言
   */
  async getSupportedLocales(): Promise<string[]> {
    const result = await this.i18nTranslationRepository
      .createQueryBuilder('translation')
      .select('DISTINCT translation.locale', 'locale')
      .getRawMany();

    return result.map(item => item.locale);
  }

  /**
   * 获取所有命名空间
   */
  async getNamespaces(): Promise<string[]> {
    const result = await this.i18nTranslationRepository
      .createQueryBuilder('translation')
      .select('DISTINCT translation.namespace', 'namespace')
      .getRawMany();

    return result.map(item => item.namespace);
  }

  /**
   * 获取翻译统计信息
   */
  async getTranslationStats(): Promise<{
    totalTranslations: number;
    byLocale: Record<string, number>;
    byNamespace: Record<string, number>;
    missingTranslations: Array<{
      key: string;
      namespace: string;
      missingLocales: string[];
    }>;
  }> {
    const totalTranslations = await this.i18nTranslationRepository.count();

    const byLocale = await this.i18nTranslationRepository
      .createQueryBuilder('translation')
      .select('translation.locale', 'locale')
      .addSelect('COUNT(*)', 'count')
      .groupBy('translation.locale')
      .getRawMany();

    const byNamespace = await this.i18nTranslationRepository
      .createQueryBuilder('translation')
      .select('translation.namespace', 'namespace')
      .addSelect('COUNT(*)', 'count')
      .groupBy('translation.namespace')
      .getRawMany();

    // 查找缺失的翻译
    const allKeys = await this.i18nTranslationRepository
      .createQueryBuilder('translation')
      .select('DISTINCT translation.key, translation.namespace', 'keyNamespace')
      .getRawMany();

    const allLocales = await this.getSupportedLocales();
    const missingTranslations = [];

    for (const keyNamespace of allKeys) {
      const key = keyNamespace.key;
      const namespace = keyNamespace.namespace;
      const existingTranslations = await this.i18nTranslationRepository.find({
        where: { key, namespace },
        select: ['locale'],
      });

      const existingLocales = existingTranslations.map(t => t.locale);
      const missingLocales = allLocales.filter(locale => !existingLocales.includes(locale));

      if (missingLocales.length > 0) {
        missingTranslations.push({
          key,
          namespace,
          missingLocales,
        });
      }
    }

    return {
      totalTranslations,
      byLocale: byLocale.reduce((acc, item) => ({ ...acc, [item.locale]: parseInt(item.count) }), {}),
      byNamespace: byNamespace.reduce((acc, item) => ({ ...acc, [item.namespace]: parseInt(item.count) }), {}),
      missingTranslations,
    };
  }

  /**
   * 导入翻译文件
   */
  async importTranslations(
    locale: string,
    namespace: string,
    translations: Record<string, string>,
  ): Promise<number> {
    let importedCount = 0;

    for (const [key, value] of Object.entries(translations)) {
      await this.setTranslation(key, locale, value, namespace);
      importedCount++;
    }

    return importedCount;
  }

  /**
   * 导出翻译文件
   */
  async exportTranslations(
    locale: string,
    namespace: string,
  ): Promise<Record<string, string>> {
    return this.getNamespaceTranslations(namespace, locale);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 预加载翻译到缓存
   */
  async preloadTranslations(locale: string, namespace: string): Promise<void> {
    const translations = await this.getNamespaceTranslations(namespace, locale);
    const cacheKey = `${locale}:${namespace}`;
    
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, new Map());
    }

    const cacheMap = this.cache.get(cacheKey);
    for (const [key, value] of Object.entries(translations)) {
      cacheMap?.set(key, value);
    }
  }

  /**
   * 获取翻译建议（基于相似键）
   */
  async getTranslationSuggestions(
    key: string,
    locale: string,
    namespace: string = 'default',
  ): Promise<Array<{
    key: string;
    value: string;
    similarity: number;
  }>> {
    const allTranslations = await this.i18nTranslationRepository.find({
      where: { locale, namespace },
    });

    const suggestions = allTranslations
      .map(translation => ({
        key: translation.key,
        value: translation.value,
        similarity: this.calculateSimilarity(key, translation.key),
      }))
      .filter(suggestion => suggestion.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return suggestions;
  }

  /**
   * 计算字符串相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
