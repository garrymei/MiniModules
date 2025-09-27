import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { I18nService } from './i18n.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('i18n')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('translation/:key')
  @Permission({ resource: 'i18n', action: 'read' })
  async getTranslation(
    @Param('key') key: string,
    @Query('locale') locale: string,
    @Query('namespace') namespace: string = 'default',
    @Query('fallback') fallbackLocale: string = 'en-US',
  ) {
    return {
      key,
      value: await this.i18nService.getTranslation(key, locale, namespace, fallbackLocale),
    };
  }

  @Post('translations/batch')
  @Permission({ resource: 'i18n', action: 'read' })
  async getTranslations(
    @Body() body: {
      keys: string[];
      locale: string;
      namespace?: string;
      fallbackLocale?: string;
    },
  ) {
    const { keys, locale, namespace = 'default', fallbackLocale = 'en-US' } = body;
    return await this.i18nService.getTranslations(keys, locale, namespace, fallbackLocale);
  }

  @Put('translation')
  @Permission({ resource: 'i18n', action: 'write' })
  async setTranslation(
    @Body() body: {
      key: string;
      locale: string;
      value: string;
      namespace?: string;
      context?: string;
      description?: string;
    },
  ) {
    const { key, locale, value, namespace = 'default', context, description } = body;
    return await this.i18nService.setTranslation(key, locale, value, namespace, context, description);
  }

  @Post('translations')
  @Permission({ resource: 'i18n', action: 'write' })
  async setTranslations(
    @Body() body: {
      translations: Array<{
        key: string;
        locale: string;
        value: string;
        namespace?: string;
        context?: string;
        description?: string;
      }>;
    },
  ) {
    return await this.i18nService.setTranslations(body.translations);
  }

  @Delete('translation/:key')
  @Permission({ resource: 'i18n', action: 'delete' })
  async deleteTranslation(
    @Param('key') key: string,
    @Query('locale') locale: string,
    @Query('namespace') namespace: string = 'default',
  ) {
    await this.i18nService.deleteTranslation(key, locale, namespace);
    return { success: true };
  }

  @Get('namespace/:namespace/:locale')
  @Permission({ resource: 'i18n', action: 'read' })
  async getNamespaceTranslations(
    @Param('namespace') namespace: string,
    @Param('locale') locale: string,
  ) {
    return await this.i18nService.getNamespaceTranslations(namespace, locale);
  }

  @Get('locales')
  @Permission({ resource: 'i18n', action: 'read' })
  async getSupportedLocales() {
    return await this.i18nService.getSupportedLocales();
  }

  @Get('namespaces')
  @Permission({ resource: 'i18n', action: 'read' })
  async getNamespaces() {
    return await this.i18nService.getNamespaces();
  }

  @Get('stats')
  @Permission({ resource: 'i18n', action: 'read' })
  async getTranslationStats() {
    return await this.i18nService.getTranslationStats();
  }

  @Post('import')
  @Permission({ resource: 'i18n', action: 'write' })
  async importTranslations(
    @Body() body: {
      locale: string;
      namespace: string;
      translations: Record<string, string>;
    },
  ) {
    const { locale, namespace, translations } = body;
    const importedCount = await this.i18nService.importTranslations(locale, namespace, translations);
    return { importedCount, message: `Successfully imported ${importedCount} translations` };
  }

  @Get('export/:locale/:namespace')
  @Permission({ resource: 'i18n', action: 'read' })
  async exportTranslations(
    @Param('locale') locale: string,
    @Param('namespace') namespace: string,
  ) {
    return await this.i18nService.exportTranslations(locale, namespace);
  }

  @Post('preload')
  @Permission({ resource: 'i18n', action: 'read' })
  async preloadTranslations(
    @Body() body: {
      locale: string;
      namespace: string;
    },
  ) {
    await this.i18nService.preloadTranslations(body.locale, body.namespace);
    return { success: true, message: 'Translations preloaded successfully' };
  }

  @Get('suggestions/:key')
  @Permission({ resource: 'i18n', action: 'read' })
  async getTranslationSuggestions(
    @Param('key') key: string,
    @Query('locale') locale: string,
    @Query('namespace') namespace: string = 'default',
  ) {
    return await this.i18nService.getTranslationSuggestions(key, locale, namespace);
  }

  @Post('cache/clear')
  @Permission({ resource: 'i18n', action: 'write' })
  async clearCache() {
    this.i18nService.clearCache();
    return { success: true, message: 'Cache cleared successfully' };
  }
}
