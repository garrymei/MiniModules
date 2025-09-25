import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import { getMessage, formatMessage, supportedLocales, defaultLocale, isLocaleSupported } from '../i18n';

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
  supportedLocales: string[];
  isLocaleSupported: (locale: string) => boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(() => {
    // Get locale from localStorage or default
    const savedLocale = localStorage.getItem('admin-locale');
    return isLocaleSupported(savedLocale || '') ? savedLocale! : defaultLocale;
  });

  const setLocale = (newLocale: string) => {
    if (isLocaleSupported(newLocale)) {
      setLocaleState(newLocale);
      localStorage.setItem('admin-locale', newLocale);
      
      // Update dayjs locale
      if (newLocale === 'zh-CN') {
        dayjs.locale('zh-cn');
      } else if (newLocale === 'en-US') {
        dayjs.locale('en');
      }
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    return formatMessage(key, params, locale);
  };

  // Get Antd locale
  const getAntdLocale = () => {
    switch (locale) {
      case 'en-US':
        return enUS;
      case 'zh-CN':
      default:
        return zhCN;
    }
  };

  // Set dayjs locale on mount
  useEffect(() => {
    if (locale === 'zh-CN') {
      dayjs.locale('zh-cn');
    } else if (locale === 'en-US') {
      dayjs.locale('en');
    }
  }, [locale]);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    supportedLocales,
    isLocaleSupported,
  };

  return (
    <I18nContext.Provider value={value}>
      <ConfigProvider locale={getAntdLocale()}>
        {children}
      </ConfigProvider>
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
