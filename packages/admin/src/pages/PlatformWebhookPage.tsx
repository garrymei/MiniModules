import { useMemo, useState, type ReactNode } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
  Drawer,
  Descriptions,
  Row,
  Col
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined, LinkOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface WebhookItem {
  id: string
  event: string
  url: string
  secret?: string
  isActive: boolean
  createdAt: string
}

interface WebhookDeliveryLog {
  id: string
  statusCode?: number
  success: boolean
  durationMs: number
  attemptedAt: string
  errorMessage?: string
}

const initialWebhooks: WebhookItem[] = [
  {
    id: 'wh_1',
    event: 'order.created',
    url: 'https://demo-partner.io/hooks/order',
    secret: 'demo-secret',
    isActive: true,
    createdAt: '2024-05-29 14:20',
  },
  {
    id: 'wh_2',
    event: 'payment.success',
    url: 'https://integration.example.com/payment',
    isActive: false,
    createdAt: '2024-05-10 09:05',
  },
]

const initialLogs: Record<string, WebhookDeliveryLog[]> = {
  wh_1: [
    {
      id: 'log_1',
      statusCode: 200,
      success: true,
      durationMs: 324,
      attemptedAt: '2024-06-12 09:24:11',
    },
    {
      id: 'log_2',
      statusCode: 500,
      success: false,
      durationMs: 280,
      attemptedAt: '2024-06-12 08:14:42',
      errorMessage: '服务器内部错误',
    },
  ],
  wh_2: [
    {
      id: 'log_3',
      statusCode: 200,
      success: true,
      durationMs: 198,
      attemptedAt: '2024-05-28 17:03:15',
    },
  ],
}

export const PlatformWebhookPage = () => {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(initialWebhooks)
  const [selected, setSelected] = useState<WebhookItem | null>(null)
  const [form] = Form.useForm<WebhookItem>()
  const [logsDrawer, setLogsDrawer] = useState<{ visible: boolean; webhook?: WebhookItem }>({ visible: false })
  const [editorVisible, setEditorVisible] = useState(false)

  const deliveries = useMemo(() => {
    if (!logsDrawer.webhook) return []
    return initialLogs[logsDrawer.webhook.id] || []
  }, [logsDrawer])

  const columns = [
    {
      title: '事件',
      dataIndex: 'event',
      render: (event: string) => (
        <Space>
          <Tag color="blue">{event}</Tag>
        </Space>
      ),
    },
    {
      title: '回调地址',
      dataIndex: 'url',
      render: (url: string) => (
        <Space>
          <LinkOutlined />
          <span>{url}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 120,
      render: (active: boolean) => (active ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: any, record: WebhookItem) => (
        <Space size="middle">
          <Button type="link" icon={<PlayCircleOutlined />} onClick={() => openLogs(record)}>
            调用记录
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openModal(record)}>
            编辑
          </Button>
          <Button danger type="link" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const openModal = (record?: WebhookItem) => {
    if (record) {
      setSelected(record)
      form.setFieldsValue(record)
    } else {
      setSelected(null)
      form.resetFields()
      form.setFieldsValue({ isActive: true } as any)
    }
    setEditorVisible(true)
  }

  const handleModalOk = async () => {
    const values = await form.validateFields()
    handleSave(values)
    setEditorVisible(false)
    form.resetFields()
  }

  const handleModalCancel = () => {
    setEditorVisible(false)
  }

  const handleSave = (values: WebhookItem) => {
    if (selected) {
      setWebhooks((items) => items.map((item) => (item.id === selected.id ? { ...selected, ...values } : item)))
      message.success('Webhook 更新成功')
      setSelected(null)
    } else {
      const newWebhook: WebhookItem = {
        ...values,
        id: `wh_${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      }
      setWebhooks((items) => [newWebhook, ...items])
      message.success('Webhook 创建成功')
    }
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确定删除该 Webhook？',
      onOk: () => {
        setWebhooks((items) => items.filter((item) => item.id !== id))
        message.success('Webhook 已删除')
        if (selected?.id === id) {
          setSelected(null)
        }
      },
    })
  }

  const openLogs = (webhook: WebhookItem) => {
    setLogsDrawer({ visible: true, webhook })
  }

  const closeLogs = () => setLogsDrawer({ visible: false })

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3}>Webhook 配置</Title>
          <Paragraph type="secondary">
            通过订阅事件将订单、预约、支付等重要行为推送至合作方系统
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新建 Webhook
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <ColCard
          title="建议事件"
          icon={<ApiOutlined />}
          description="order.created · booking.created · payment.success"
        />
        <ColCard
          title="签名规则"
          icon={<LinkOutlined />}
          description="X-MM-Signature = HMAC_SHA256(secret, timestamp.payload)"
        />
      </Row>

      <Card>
        <Table<WebhookItem>
          rowKey="id"
          dataSource={webhooks}
          columns={columns}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title={selected ? '编辑 Webhook' : '新增 Webhook'}
        open={editorVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="event" label="事件" rules={[{ required: true, message: '请选择事件类型' }]}>
            <Input placeholder="例如：order.created" />
          </Form.Item>
          <Form.Item name="url" label="回调地址" rules={[{ required: true, message: '请输入回调地址' }]}>
            <Input placeholder="https://example.com/webhooks" />
          </Form.Item>
          <Form.Item name="secret" label="签名密钥" tooltip="用于生成 X-MM-Signature">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`调用记录 · ${logsDrawer.webhook?.event ?? ''}`}
        onClose={closeLogs}
        open={logsDrawer.visible}
        width={520}
      >
        {logsDrawer.webhook ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="回调地址">{logsDrawer.webhook.url}</Descriptions.Item>
              <Descriptions.Item label="签名密钥">{logsDrawer.webhook.secret || '未配置'}</Descriptions.Item>
            </Descriptions>
            <Table<WebhookDeliveryLog>
              rowKey="id"
              dataSource={deliveries}
              pagination={false}
              columns={[
                {
                  title: '时间',
                  dataIndex: 'attemptedAt',
                  width: 180,
                },
                {
                  title: '状态码',
                  dataIndex: 'statusCode',
                  width: 100,
                  render: (code: number | undefined) => code ?? '-',
                },
                {
                  title: '耗时',
                  dataIndex: 'durationMs',
                  width: 100,
                  render: (value: number) => `${value} ms`,
                },
                {
                  title: '结果',
                  dataIndex: 'success',
                  render: (success: boolean, record: WebhookDeliveryLog) => (
                    success ? (
                      <Tag color="green">成功</Tag>
                    ) : (
                      <Tag color="red">失败 {record.errorMessage ? `· ${record.errorMessage}` : ''}</Tag>
                    )
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

const ColCard = ({ title, description, icon }: { title: string; description: string; icon: ReactNode }) => (
  <Card style={{ flex: 1 }}>
    <Space align="start">
      <span style={{ fontSize: 20, color: '#1677ff' }}>{icon}</span>
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </Space>
    </Space>
  </Card>
)

export default PlatformWebhookPage
