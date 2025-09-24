import { Form, Input, Select, Switch, InputNumber, DatePicker, Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { FC } from 'react'

const { TextArea } = Input

interface JsonSchemaFormProps {
  schema: Record<string, any>
  form: any
  initialValues?: Record<string, any>
}

export const JsonSchemaForm: FC<JsonSchemaFormProps> = ({ 
  schema, 
  form, 
  initialValues 
}) => {
  const renderField = (key: string, fieldSchema: any) => {
    const { type, options, default: defaultValue, description, required } = fieldSchema

    const commonProps = {
      key,
      name: key,
      label: getFieldLabel(key),
      tooltip: description,
      required,
      initialValue: initialValues?.[key] ?? defaultValue
    }

    switch (type) {
      case 'select':
        return (
          <Form.Item {...commonProps}>
            <Select placeholder={`请选择${getFieldLabel(key)}`}>
              {options?.map((option: any) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )
      
      case 'number':
        return (
          <Form.Item {...commonProps}>
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder={`请输入${getFieldLabel(key)}`}
            />
          </Form.Item>
        )
      
      case 'boolean':
        return (
          <Form.Item 
            {...commonProps}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )
      
      case 'date':
        return (
          <Form.Item {...commonProps}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        )
      
      case 'textarea':
        return (
          <Form.Item {...commonProps}>
            <TextArea rows={3} placeholder={`请输入${getFieldLabel(key)}`} />
          </Form.Item>
        )
      
      case 'upload':
        return (
          <Form.Item {...commonProps}>
            <Upload>
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
          </Form.Item>
        )
      
      case 'object':
        return (
          <Form.Item {...commonProps}>
            <TextArea 
              rows={4} 
              placeholder="请输入JSON格式的配置"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        )
      
      default:
        return (
          <Form.Item {...commonProps}>
            <Input placeholder={`请输入${getFieldLabel(key)}`} />
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
      maxBanners: '最大轮播数',
      primaryColor: '主色调',
      buttonRadius: '按钮圆角',
      cardStyle: '卡片样式',
      homepageLayout: '首页布局',
      imageAspectRatio: '图片比例',
      showSearch: '显示搜索',
      locale: '语言',
      timezone: '时区'
    }
    return labels[key] || key
  }

  return (
    <Form form={form} layout="vertical">
      {Object.entries(schema).map(([key, fieldSchema]) => 
        renderField(key, fieldSchema)
      )}
    </Form>
  )
}
