import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { getMessage, formatMessage, supportedLocales, defaultLocale, isLocaleSupported } from '../i18n';

export interface I18nHook {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
  supportedLocales: string[];
  isLocaleSupported: (locale: string) => boolean;
}

export const useI18n = (): I18nHook => {
  const [locale, setLocaleState] = useState<string>(() => {
    // Get locale from storage or default
    try {
      const savedLocale = Taro.getStorageSync('mobile-locale');
      return isLocaleSupported(savedLocale || '') ? savedLocale! : defaultLocale;
    } catch (error) {
      return defaultLocale;
    }
  });

  const setLocale = (newLocale: string) => {
    if (isLocaleSupported(newLocale)) {
      setLocaleState(newLocale);
      try {
        Taro.setStorageSync('mobile-locale', newLocale);
      } catch (error) {
        console.warn('Failed to save locale to storage:', error);
      }
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    return formatMessage(key, params, locale);
  };

  return {
    locale,
    setLocale,
    t,
    supportedLocales,
    isLocaleSupported,
  };
};
