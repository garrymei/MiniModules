export class FormattingUtils {
  static formatCurrency(amount: number, locale: string = 'zh-CN'): string {
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

  static formatDate(date: Date | string, locale: string = 'zh-CN'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(dateObj);
    } catch (error) {
      // Fallback formatting
      return dateObj.toLocaleString();
    }
  }

  static formatDateShort(date: Date | string, locale: string = 'zh-CN'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dateObj);
    } catch (error) {
      // Fallback formatting
      return dateObj.toLocaleDateString();
    }
  }

  static formatTime(date: Date | string, locale: string = 'zh-CN'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(dateObj);
    } catch (error) {
      // Fallback formatting
      return dateObj.toLocaleTimeString();
    }
  }

  static formatNumber(number: number, locale: string = 'zh-CN'): string {
    try {
      return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
      // Fallback formatting
      return number.toString();
    }
  }

  static formatPercentage(value: number, locale: string = 'zh-CN'): string {
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

  static getRelativeTime(date: Date | string, locale: string = 'zh-CN'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

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
      return this.formatDateShort(dateObj, locale);
    }
  }

  static formatFileSize(bytes: number, locale: string = 'zh-CN'): string {
    const units = locale === 'zh-CN' 
      ? ['B', 'KB', 'MB', 'GB', 'TB']
      : ['B', 'KB', 'MB', 'GB', 'TB'];
    
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  static formatDuration(seconds: number, locale: string = 'zh-CN'): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (locale === 'zh-CN') {
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else if (minutes > 0) {
        return `${minutes}分钟${remainingSeconds}秒`;
      } else {
        return `${remainingSeconds}秒`;
      }
    } else {
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }
    }
  }
}
