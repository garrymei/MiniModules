import { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Typography, 
  Row,
  Col,
  Upload,
  ColorPicker,
  InputNumber,
  Select,
  Divider,
  Space,
  Alert,
  Tabs
} from 'antd'
import { 
  UploadOutlined, 
  SaveOutlined, 
  EyeOutlined,
  SyncOutlined,
  CheckOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

interface ThemeConfig {
  primaryColor: string
  buttonRadius: number
  logo: string
  name: string
  cssVariables: Record<string, string>
}

export const BrandThemePage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null)
  const [previewConfig, setPreviewConfig] = useState<ThemeConfig | null>(null)

  const loadThemeConfig = async () => {
    try {
      setLoading(true)
      // 模拟API调用
      const mockConfig: ThemeConfig = {
        primaryColor: '#FF6A00',
        buttonRadius: 10,
        logo: 'https://example.com/logo.png',
        name: '示例餐厅',
        cssVariables: {
          '--color-primary': '#FF6A00',
          '--radius-md': '10px',
          '--logo-url': 'url(https://example.com/logo.png)',
        }
      }
      setThemeConfig(mockConfig)
      setPreviewConfig(mockConfig)
      form.setFieldsValue(mockConfig)
    } catch (error) {
      console.error('加载主题配置失败:', error)
      message.error('加载主题配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadThemeConfig()
  }, [])

  const handleSave = async (values: any) => {
    try {
      setLoading(true)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newConfig: ThemeConfig = {
        ...values,
        cssVariables: {
          '--color-primary': values.primaryColor,
          '--radius-md': `${values.buttonRadius}px`,
          '--logo-url': values.logo ? `url(${values.logo})` : 'none',
        }
      }
      
      setThemeConfig(newConfig)
      message.success('主题配置保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    try {
      setPreviewLoading(true)
      const values = await form.validateFields()
      
      const newPreviewConfig: ThemeConfig = {
        ...values,
        cssVariables: {
          '--color-primary': values.primaryColor,
          '--radius-md': `${values.buttonRadius}px`,
          '--logo-url': values.logo ? `url(${values.logo})` : 'none',
        }
      }
      
      setPreviewConfig(newPreviewConfig)
      message.success('预览已更新')
    } catch (error) {
      message.error('请先完善配置信息')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSyncToMobile = async () => {
    try {
      setLoading(true)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('主题已同步到移动端')
    } catch (error) {
      message.error('同步失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    name: 'file',
    action: '/api/admin/files/upload',
    headers: {
      authorization: 'Bearer ' + localStorage.getItem('token'),
    },
    onChange(info: any) {
      if (info.file.status === 'done') {
        const logoUrl = info.file.response?.url
        if (logoUrl) {
          form.setFieldsValue({ logo: logoUrl })
          message.success('Logo上传成功')
        }
      } else if (info.file.status === 'error') {
        message.error('Logo上传失败')
      }
    },
  }

  const renderPreview = () => {
    if (!previewConfig) return null

    return (
      <div 
        style={{ 
          padding: 24, 
          background: '#f5f5f5', 
          borderRadius: 8,
          minHeight: 400
        }}
      >
        <div style={{ 
          background: 'white', 
          borderRadius: previewConfig.buttonRadius,
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* 模拟移动端首页预览 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {previewConfig.logo && (
              <img 
                src={previewConfig.logo} 
                alt="Logo" 
                style={{ 
                  height: 40, 
                  marginBottom: 16,
                  maxWidth: '100%'
                }} 
              />
            )}
            <h2 style={{ 
              color: previewConfig.primaryColor, 
              margin: 0,
              fontSize: 20
            }}>
              {previewConfig.name}
            </h2>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 16,
            marginBottom: 24
          }}>
            {['点餐', '预约', '商城', '会员'].map((item, index) => (
              <div 
                key={index}
                style={{
                  background: previewConfig.primaryColor,
                  color: 'white',
                  borderRadius: previewConfig.buttonRadius,
                  padding: 16,
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 8 }}>{item}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>功能描述</div>
              </div>
            ))}
          </div>

          <div style={{ 
            background: '#f0f0f0', 
            borderRadius: previewConfig.buttonRadius,
            padding: 16,
            marginBottom: 24
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 12 
            }}>
              <div style={{ fontWeight: 'bold' }}>推荐活动</div>
              <div style={{ color: '#1890ff', fontSize: 12 }}>更多 &gt;</div>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 12,
              overflowX: 'auto'
            }}>
              {[1, 2, 3].map((item) => (
                <div 
                  key={item}
                  style={{ 
                    minWidth: 120, 
                    height: 80, 
                    background: '#ddd',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: 12
                  }}
                >
                  Banner {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            预览效果，实际显示可能略有差异
          </div>
        </div>
        
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#fffbe6', 
          borderRadius: 4,
          fontSize: 12
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>预览说明</div>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            <li>此预览展示主题颜色和圆角效果</li>
            <li>Logo显示效果</li>
            <li>模块入口按钮样式</li>
            <li>实际效果以移动端为准</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>品牌与主题设置</Title>
        <Paragraph type="secondary">
          自定义租户的品牌标识和主题样式，支持实时预览和移动端同步
        </Paragraph>
      </div>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="主题配置">
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={handleSave}
              initialValues={{
                primaryColor: '#FF6A00',
                buttonRadius: 10,
                name: '示例餐厅'
              }}
            >
              <Form.Item
                name="name"
                label="租户名称"
                rules={[{ required: true, message: '请输入租户名称' }]}
              >
                <Input placeholder="请输入租户名称" />
              </Form.Item>

              <Form.Item
                name="logo"
                label="Logo"
              >
                <div>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>上传Logo</Button>
                  </Upload>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    支持 JPG、PNG、GIF 格式，建议尺寸 200x200px
                  </div>
                </div>
              </Form.Item>

              <Form.Item
                name="primaryColor"
                label="主色调"
                rules={[{ required: true, message: '请选择主色调' }]}
              >
                <ColorPicker 
                  showText 
                  format="hex"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="buttonRadius"
                label="按钮圆角"
                rules={[{ required: true, message: '请设置按钮圆角' }]}
              >
                <InputNumber 
                  min={0} 
                  max={20} 
                  style={{ width: '100%' }}
                  addonAfter="px"
                />
              </Form.Item>

              <Divider />

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    保存配置
                  </Button>
                  <Button 
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                    loading={previewLoading}
                  >
                    更新预览
                  </Button>
                  <Button 
                    type="default"
                    icon={<SyncOutlined />}
                    onClick={handleSyncToMobile}
                    loading={loading}
                  >
                    同步到移动端
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title="实时预览" 
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                移动端效果预览
              </Text>
            }
          >
            {renderPreview()}
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="CSS变量输出">
            <Alert
              message="CSS变量"
              description="以下CSS变量将应用到移动端，实现主题的动态切换"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              fontSize: 12,
              lineHeight: 1.5,
              margin: 0
            }}>
              {previewConfig ? Object.entries(previewConfig.cssVariables)
                .map(([key, value]) => `${key}: ${value};`)
                .join('\n') : '暂无配置'}
            </pre>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
