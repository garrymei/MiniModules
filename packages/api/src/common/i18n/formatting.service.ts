import { Injectable } from '@nestjs/common';

@Injectable()
export class FormattingService {
  formatCurrency(amount: number, locale: string = 'zh-CN'): string {
    const currencyMap = {
      'zh-CN': 'CNY',
      'zh-TW': 'TWD',
      'en-US': 'USD',
    };

    const currency = currencyMap[locale] || 'CNY';
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  formatDate(date: Date, locale: string = 'zh-CN'): string {
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch (error) {
      // Fallback formatting
      return date.toLocaleString();
    }
  }

  formatDateShort(date: Date, locale: string = 'zh-CN'): string {
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch (error) {
      // Fallback formatting
      return date.toLocaleDateString();
    }
  }

  formatTime(date: Date, locale: string = 'zh-CN'): string {
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch (error) {
      // Fallback formatting
      return date.toLocaleTimeString();
    }
  }

  formatNumber(number: number, locale: string = 'zh-CN'): string {
    try {
      return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
      // Fallback formatting
      return number.toString();
    }
  }

  formatPercentage(value: number, locale: string = 'zh-CN'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value / 100);
    } catch (error) {
      // Fallback formatting
      return `${value}%`;
    }
  }

  getRelativeTime(date: Date, locale: string = 'zh-CN'): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return locale === 'zh-CN' ? '刚刚' : 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return locale === 'zh-CN' ? `${minutes}分钟前` : `${minutes} minutes ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return locale === 'zh-CN' ? `${hours}小时前` : `${hours} hours ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return locale === 'zh-CN' ? `${days}天前` : `${days} days ago`;
    } else {
      return this.formatDateShort(date, locale);
    }
  }
}
