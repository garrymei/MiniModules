import { useState, useEffect } from 'react'
import { 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Select, 
  Switch, 
  InputNumber, 
  Button, 
  message, 
  Typography, 
  Space,
  Tag,
  Divider
} from 'antd'
import { SaveOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { TextArea } = Input

interface ModuleConfig {
  moduleId: string
  config: Record<string, any>
  version: number
  status: 'draft' | 'published'
  lastModified: string
}

export const ModuleConfigPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('ordering')

  const modules = [
    {
      key: 'ordering',
      name: '点餐模块',
      schema: {
        mode: { type: 'select', options: ['dine_in', 'takeaway', 'both'], default: 'both' },
        specSchema: { type: 'select', options: ['simple', 'grouped'], default: 'simple' },
        minOrderAmount: { type: 'number', default: 0 },
        packageFee: { type: 'number', default: 0 },
        tableNumberRequired: { type: 'boolean', default: false },
        showSpicyLevel: { type: 'boolean', default: true },
        showCalories: { type: 'boolean', default: false }
      }
    },
    {
      key: 'booking',
      name: '预约模块',
      schema: {
        slotMinutes: { type: 'select', options: [30, 45, 60], default: 60 },
        maxBookableDays: { type: 'number', default: 7 },
        cancelPolicy: { type: 'select', options: ['free', '24h', '48h', 'no_cancel'], default: '24h' },
        checkinMethod: { type: 'select', options: ['qrcode', 'staff'], default: 'qrcode' }
      }
    },
    {
      key: 'ecommerce',
      name: '电商模块',
      schema: {
        shippingTemplate: { type: 'select', options: ['standard', 'express', 'free'], default: 'standard' },
        freeShippingThreshold: { type: 'number', default: 99 },
        priceDisplay: { type: 'select', options: ['withMarketPrice', 'simple'], default: 'simple' }
      }
    },
    {
      key: 'cms',
      name: 'CMS模块',
      schema: {
        autoPublish: { type: 'boolean', default: false },
        reviewRequired: { type: 'boolean', default: true },
        maxBanners: { type: 'number', default: 5 }
      }
    }
  ]

  const [configs, setConfigs] = useState<ModuleConfig[]>([
    {
      moduleId: 'ordering',
      config: {
        mode: 'both',
        specSchema: 'simple',
        minOrderAmount: 20,
        packageFee: 2,
        tableNumberRequired: false,
        showSpicyLevel: true,
        showCalories: false
      },
      version: 1,
      status: 'published',
      lastModified: '2024-01-15 10:30:00'
    },
    {
      moduleId: 'booking',
      config: {
        slotMinutes: 60,
        maxBookableDays: 7,
        cancelPolicy: '24h',
        checkinMethod: 'qrcode'
      },
      version: 1,
      status: 'published',
      lastModified: '2024-01-15 10:30:00'
    }
  ])

  const currentModule = modules.find(m => m.key === activeTab)
  const currentConfig = configs.find(c => c.moduleId === activeTab)

  useEffect(() => {
    if (currentConfig) {
      form.setFieldsValue(currentConfig.config)
    } else {
      form.resetFields()
    }
  }, [activeTab, currentConfig, form])

  const renderFormField = (key: string, fieldSchema: any) => {
    const { type, options, default: defaultValue } = fieldSchema

    switch (type) {
      case 'select':
        return (
          <Form.Item
            key={key}
            name={key}
            label={getFieldLabel(key)}
            initialValue={defaultValue}
          >
            <Select>
              {options.map((option: any) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )
      
      case 'number':
        return (
          <Form.Item
            key={key}
            name={key}
            label={getFieldLabel(key)}
            initialValue={defaultValue}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        )
      
      case 'boolean':
        return (
          <Form.Item
            key={key}
            name={key}
            label={getFieldLabel(key)}
            valuePropName="checked"
            initialValue={defaultValue}
          >
            <Switch />
          </Form.Item>
        )
      
      default:
        return (
          <Form.Item
            key={key}
            name={key}
            label={getFieldLabel(key)}
            initialValue={defaultValue}
          >
            <Input />
          </Form.Item>
        )
    }
  }

  const getFieldLabel = (key: string) => {
    const labels: Record<string, string> = {
      mode: '点餐模式',
      specSchema: '规格模式',
      minOrderAmount: '最低起送金额',
      packageFee: '打包费',
      tableNumberRequired: '需要桌号',
      showSpicyLevel: '显示辣度',
      showCalories: '显示卡路里',
      slotMinutes: '时段长度',
      maxBookableDays: '可预约天数',
      cancelPolicy: '取消政策',
      checkinMethod: '核销方式',
      shippingTemplate: '运费模板',
      freeShippingThreshold: '免运费门槛',
      priceDisplay: '价格显示',
      autoPublish: '自动发布',
      reviewRequired: '需要审核',
      maxBanners: '最大轮播数'
    }
    return labels[key] || key
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      const updatedConfigs = configs.map(config => {
        if (config.moduleId === activeTab) {
          return {
            ...config,
            config: values,
            version: config.version + 1,
            status: 'draft' as const,
            lastModified: new Date().toLocaleString()
          }
        }
        return config
      })

      // 如果没有配置，创建新的
      if (!currentConfig) {
        const newConfig: ModuleConfig = {
          moduleId: activeTab,
          config: values,
          version: 1,
          status: 'draft',
          lastModified: new Date().toLocaleString()
        }
        updatedConfigs.push(newConfig)
      }

      setConfigs(updatedConfigs)
      message.success('配置保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      setLoading(true)
      
      const updatedConfigs = configs.map(config => {
        if (config.moduleId === activeTab) {
          return {
            ...config,
            status: 'published' as const,
            lastModified: new Date().toLocaleString()
          }
        }
        return config
      })

      setConfigs(updatedConfigs)
      message.success('配置发布成功')
    } catch (error) {
      console.error('发布失败:', error)
      message.error('发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const tabItems = modules.map(module => {
    const config = configs.find(c => c.moduleId === module.key)
    const status = config?.status || 'not_configured'
    
    return {
      key: module.key,
      label: (
        <Space>
          {module.name}
          {status === 'published' && <Tag color="green">已发布</Tag>}
          {status === 'draft' && <Tag color="orange">草稿</Tag>}
          {status === 'not_configured' && <Tag color="gray">未配置</Tag>}
        </Space>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>{module.name}配置</Title>
            <Paragraph type="secondary">
              配置{module.name}的功能参数和业务规则
            </Paragraph>
          </div>

          <Card>
            <Form form={form} layout="vertical">
              {Object.entries(module.schema).map(([key, fieldSchema]) => 
                renderFormField(key, fieldSchema)
              )}
            </Form>

            <Divider />

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<EyeOutlined />}>
                  预览
                </Button>
                <Button icon={<HistoryOutlined />}>
                  版本历史
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={handleSave}
                >
                  保存草稿
                </Button>
                {config?.status === 'draft' && (
                  <Button 
                    type="primary" 
                    loading={loading}
                    onClick={handlePublish}
                  >
                    发布配置
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </div>
      )
    }
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>模块配置</Title>
        <Paragraph type="secondary">
          配置各业务模块的功能参数，支持草稿保存和版本发布
        </Paragraph>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
      />
    </div>
  )
}
