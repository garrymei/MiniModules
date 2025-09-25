import React from 'react';
import { Select, Space, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useI18n } from '../contexts/I18nContext';

const { Option } = Select;
const { Text } = Typography;

interface LanguageSwitcherProps {
  size?: 'small' | 'middle' | 'large';
  showLabel?: boolean;
  style?: React.CSSProperties;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  size = 'middle',
  showLabel = true,
  style
}) => {
  const { locale, setLocale, t } = useI18n();

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { value: 'en-US', label: 'English', flag: '🇺🇸' },
  ];

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
  };

  return (
    <Space style={style}>
      {showLabel && (
        <Space size={4}>
          <GlobalOutlined />
          <Text type="secondary">{t('i18n.language')}:</Text>
        </Space>
      )}
      <Select
        value={locale}
        onChange={handleLocaleChange}
        size={size}
        style={{ minWidth: 120 }}
        dropdownMatchSelectWidth={false}
      >
        {languageOptions.map(option => (
          <Option key={option.value} value={option.value}>
            <Space>
              <span>{option.flag}</span>
              <span>{option.label}</span>
            </Space>
          </Option>
        ))}
      </Select>
    </Space>
  );
};
