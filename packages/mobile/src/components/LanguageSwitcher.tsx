import React from 'react';
import { View, Text, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useI18n } from '../hooks/useI18n';
import './LanguageSwitcher.scss';

interface LanguageSwitcherProps {
  showLabel?: boolean;
  size?: 'small' | 'normal' | 'large';
  style?: React.CSSProperties;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showLabel = true,
  size = 'normal',
  style
}) => {
  const { locale, setLocale, t } = useI18n();

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { value: 'en-US', label: 'English', flag: '🇺🇸' },
  ];

  const handleLocaleChange = (e: any) => {
    const newLocale = e.detail.value;
    setLocale(newLocale);
    Taro.showToast({
      title: t('messages.operationSuccess'),
      icon: 'success',
      duration: 1500
    });
  };

  const currentLanguage = languageOptions.find(option => option.value === locale);

  return (
    <View className={`language-switcher language-switcher--${size}`} style={style}>
      {showLabel && (
        <Text className="language-switcher__label">
          {t('common.language')}:
        </Text>
      )}
      <Picker
        mode="selector"
        range={languageOptions}
        rangeKey="label"
        value={languageOptions.findIndex(option => option.value === locale)}
        onChange={handleLocaleChange}
      >
        <View className="language-switcher__picker">
          <Text className="language-switcher__flag">
            {currentLanguage?.flag}
          </Text>
          <Text className="language-switcher__text">
            {currentLanguage?.label}
          </Text>
        </View>
      </Picker>
    </View>
  );
};
