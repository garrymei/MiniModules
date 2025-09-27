import zhCN from './zh-CN.json';
import enUS from './en-US.json';

export interface I18nMessages {
  [key: string]: any;
}

export const messages: Record<string, I18nMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const supportedLocales = Object.keys(messages);

export const defaultLocale = 'zh-CN';

export function getMessage(key: string, locale: string = defaultLocale): string {
  const keys = key.split('.');
  let result: any = messages[locale] || messages[defaultLocale];
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      // Fallback to default locale
      result = messages[defaultLocale];
      for (const fallbackKey of keys) {
        if (result && typeof result === 'object' && fallbackKey in result) {
          result = result[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }
  
  return typeof result === 'string' ? result : key;
}

export function formatMessage(key: string, params: Record<string, any> = {}, locale: string = defaultLocale): string {
  let message = getMessage(key, locale);
  
  // Replace parameters in message
  Object.keys(params).forEach(param => {
    message = message.replace(new RegExp(`{${param}}`, 'g'), params[param]);
  });
  
  return message;
}

export function isLocaleSupported(locale: string): boolean {
  return supportedLocales.includes(locale);
}