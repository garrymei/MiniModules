import { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  message,
  Typography,
  Row,
  Col,
  Select,
  Divider,
  Alert,
  Tooltip,
  Descriptions,
  Badge,
  Tabs
} from 'antd'
import { 
  EyeOutlined, 
  PlayCircleOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { TabPane } = Tabs

interface IndustryTemplate {
  industry: string
  name: string
  description: string
  config: Record<string, any>
  priority: string
}

interface TemplateApplyResult {
  mergedConfig: Record<string, any>
  warnings: string[]
  appliedTemplates: string[]
}

export const IndustryTemplatePage = () => {
  const [templates, setTemplates] = useState<IndustryTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false)
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null)
  const [previewResult, setPreviewResult] = useState<TemplateApplyResult | null>(null)
  const [form] = Form.useForm()

  const loadTemplates = async () => {
    try {
      setLoading(true)
      // 模拟API调用
      const mockTemplates: IndustryTemplate[] = [
        {
          industry: 'restaurant',
          name: '餐饮行业模板',
          description: '适用于餐厅、咖啡厅等餐饮业务',
          priority: '100',
          config: {
            enabledModules: ['ordering', 'user', 'pay', 'cms'],
            theme: {
              primaryColor: '#FF6A00',
              buttonRadius: 10,
              name: '示例餐厅',
            },
            modules: {
              ordering: {
                mode: 'both',
                specSchema: 'simple',
                minOrderAmount: 0,
                packageFee: 2,
                tableNumberRequired: false,
                showSpicyLevel: true,
                showCalories: false,
              },
            },
            ui: {
              homepageLayout: 'grid-2',
              showSearch: true,
              cardStyle: 'elevated',
              imageAspectRatio: '1:1',
            },
          },
        },
        {
          industry: 'fitness',
          name: '健身行业模板',
          description: '适用于健身房、瑜伽馆等健身业务',
          priority: '100',
          config: {
            enabledModules: ['booking', 'user', 'pay', 'cms'],
            theme: {
              primaryColor: '#4CAF50',
              buttonRadius: 8,
              name: '示例健身房',
            },
            modules: {
              booking: {
                slotMinutes: 60,
                maxBookableDays: 7,
                cancelPolicy: '24h',
                checkinMethod: 'qrcode',
              },
            },
            ui: {
              homepageLayout: 'grid-3',
              showSearch: true,
              cardStyle: 'flat',
              imageAspectRatio: '16:9',
            },
          },
        },
        {
          industry: 'retail',
          name: '零售行业模板',
          description: '适用于电商、零售等业务',
          priority: '100',
          config: {
            enabledModules: ['ecommerce', 'user', 'pay', 'cms'],
            theme: {
              primaryColor: '#2196F3',
              buttonRadius: 6,
              name: '示例商店',
            },
            modules: {
              ecommerce: {
                shippingTemplate: 'standard',
                freeShippingThreshold: 99,
                priceDisplay: 'simple',
                promotion: {
                  coupon: true,
                  fullReduction: true,
                  flashSale: false,
                },
              },
            },
            ui: {
              homepageLayout: 'grid-2',
              showSearch: true,
              cardStyle: 'elevated',
              imageAspectRatio: '1:1',
            },
          },
        },
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('加载模板失败:', error)
      message.error('加载模板失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handlePreviewTemplate = async (template: IndustryTemplate) => {
    try {
      setSelectedTemplate(template)
      // 模拟API调用
      const mockResult: TemplateApplyResult = {
        mergedConfig: template.config,
        warnings: [],
        appliedTemplates: [template.name],
      }
      setPreviewResult(mockResult)
      setIsPreviewModalVisible(true)
    } catch (error) {
      message.error('预览失败')
    }
  }

  const handleApplyTemplate = async (values: any) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('模板应用成功')
      setIsApplyModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('应用失败，请重试')
    }
  }

  const columns = [
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
      render: (industry: string) => (
        <Tag color="blue">{industry}</Tag>
      )
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Text strong>{name}</Text>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Badge count={priority} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '启用模块',
      key: 'enabledModules',
      width: 200,
      render: (_, record: IndustryTemplate) => {
        const modules = record.config.enabledModules || []
        return (
          <Space wrap>
            {modules.map((module: string) => (
              <Tag key={module} size="small">{module}</Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: IndustryTemplate) => (
        <Space>
          <Tooltip title="预览配置">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handlePreviewTemplate(record)}
            />
          </Tooltip>
          <Tooltip title="应用模板">
            <Button 
              type="text" 
              icon={<PlayCircleOutlined />} 
              size="small"
              onClick={() => {
                setSelectedTemplate(record)
                setIsApplyModalVisible(true)
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const renderConfigPreview = (config: Record<string, any>) => {
    return (
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: 16, 
          borderRadius: 4,
          fontSize: 12,
          lineHeight: 1.5
        }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>行业模板管理</Title>
        <Paragraph type="secondary">
          管理不同行业的默认配置模板，支持一键应用到租户配置
        </Paragraph>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>可用模板</Title>
          <Space>
            <Button 
              icon={<FileTextOutlined />}
              onClick={loadTemplates}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          dataSource={templates}
          columns={columns}
          rowKey="industry"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个模板`
          }}
        />
      </Card>

      {/* 预览模态框 */}
      <Modal
        title={`预览模板: ${selectedTemplate?.name}`}
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedTemplate && (
          <Tabs defaultActiveKey="config">
            <TabPane tab="配置预览" key="config">
              {renderConfigPreview(selectedTemplate.config)}
            </TabPane>
            <TabPane tab="模板信息" key="info">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="行业标识">
                  <Tag color="blue">{selectedTemplate.industry}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="模板名称">
                  {selectedTemplate.name}
                </Descriptions.Item>
                <Descriptions.Item label="描述">
                  {selectedTemplate.description}
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  <Badge count={selectedTemplate.priority} style={{ backgroundColor: '#52c41a' }} />
                </Descriptions.Item>
                <Descriptions.Item label="启用模块">
                  <Space wrap>
                    {(selectedTemplate.config.enabledModules || []).map((module: string) => (
                      <Tag key={module} size="small">{module}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* 应用模板模态框 */}
      <Modal
        title={`应用模板: ${selectedTemplate?.name}`}
        open={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        footer={null}
      >
        <Alert
          message="模板应用说明"
          description={
            <div>
              <p>• 模板将应用到租户配置的草稿版本</p>
              <p>• 现有配置将与模板进行深度合并</p>
              <p>• 租户自定义配置优先级高于模板配置</p>
              <p>• 应用后需要提交审核才能发布</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} onFinish={handleApplyTemplate}>
          <Form.Item
            name="tenantId"
            label="目标租户"
            rules={[{ required: true, message: '请选择目标租户' }]}
          >
            <Select placeholder="请选择要应用模板的租户">
              <Select.Option value="tenant-001">示例餐厅</Select.Option>
              <Select.Option value="tenant-002">示例健身房</Select.Option>
              <Select.Option value="tenant-003">示例商店</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="overrides"
            label="自定义覆盖"
          >
            <TextArea 
              rows={4} 
              placeholder="可选：输入JSON格式的自定义配置覆盖模板默认值"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsApplyModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />}>
                应用模板
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
