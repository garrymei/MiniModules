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
  Timeline,
  Alert,
  Tooltip
} from 'antd'
import { 
  EyeOutlined, 
  RollbackOutlined, 
  DiffOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

interface ConfigRevision {
  id: string
  tenantId: string
  version: string
  status: 'draft' | 'submitted' | 'approved' | 'published' | 'rejected'
  approvedBy?: string
  reviewNote?: string
  submittedAt?: string
  approvedAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

interface ConfigDiff {
  path: string
  operation: 'add' | 'remove' | 'modify'
  oldValue?: any
  newValue?: any
}

export const ConfigVersioningPage = () => {
  const [revisions, setRevisions] = useState<ConfigRevision[]>([])
  const [currentPublishedVersion, setCurrentPublishedVersion] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [isDiffModalVisible, setIsDiffModalVisible] = useState(false)
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false)
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false)
  const [isRollbackModalVisible, setIsRollbackModalVisible] = useState(false)
  const [selectedRevision, setSelectedRevision] = useState<ConfigRevision | null>(null)
  const [configDiff, setConfigDiff] = useState<ConfigDiff[]>([])
  const [form] = Form.useForm()

  const statusMap: Record<string, { text: string, color: string }> = {
    draft: { text: '草稿', color: 'default' },
    submitted: { text: '待审核', color: 'processing' },
    approved: { text: '已审核', color: 'success' },
    published: { text: '已发布', color: 'green' },
    rejected: { text: '已拒绝', color: 'red' }
  }

  const loadRevisions = async () => {
    try {
      setLoading(true)
      // 模拟API调用
      const mockRevisions: ConfigRevision[] = [
        {
          id: '1',
          tenantId: 'tenant-001',
          version: '3',
          status: 'published',
          approvedBy: 'admin-001',
          reviewNote: '配置审核通过',
          submittedAt: '2024-01-15T10:00:00Z',
          approvedAt: '2024-01-15T11:00:00Z',
          publishedAt: '2024-01-15T12:00:00Z',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z'
        },
        {
          id: '2',
          tenantId: 'tenant-001',
          version: '2',
          status: 'published',
          approvedBy: 'admin-001',
          reviewNote: '主题配置更新',
          submittedAt: '2024-01-10T10:00:00Z',
          approvedAt: '2024-01-10T11:00:00Z',
          publishedAt: '2024-01-10T12:00:00Z',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-10T12:00:00Z'
        },
        {
          id: '3',
          tenantId: 'tenant-001',
          version: '1',
          status: 'published',
          approvedBy: 'admin-001',
          reviewNote: '初始配置',
          submittedAt: '2024-01-01T10:00:00Z',
          approvedAt: '2024-01-01T11:00:00Z',
          publishedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z'
        }
      ]
      setRevisions(mockRevisions)
      setCurrentPublishedVersion('3')
    } catch (error) {
      console.error('加载版本历史失败:', error)
      message.error('加载版本历史失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRevisions()
  }, [])

  const handleSubmitForReview = async (values: any) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('配置已提交审核')
      setIsSubmitModalVisible(false)
      form.resetFields()
      loadRevisions()
    } catch (error) {
      message.error('提交失败，请重试')
    }
  }

  const handleApprove = async (values: any) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('配置审核通过')
      setIsApproveModalVisible(false)
      form.resetFields()
      loadRevisions()
    } catch (error) {
      message.error('审核失败，请重试')
    }
  }

  const handlePublish = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('配置已发布')
      loadRevisions()
    } catch (error) {
      message.error('发布失败，请重试')
    }
  }

  const handleRollback = async (values: any) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('配置已回滚')
      setIsRollbackModalVisible(false)
      form.resetFields()
      loadRevisions()
    } catch (error) {
      message.error('回滚失败，请重试')
    }
  }

  const handleViewDiff = async (revision1: ConfigRevision, revision2: ConfigRevision) => {
    try {
      // 模拟API调用获取差异
      const mockDiff: ConfigDiff[] = [
        {
          path: 'theme.primaryColor',
          operation: 'modify',
          oldValue: '#1890ff',
          newValue: '#FF6A00'
        },
        {
          path: 'modules.ordering.mode',
          operation: 'add',
          newValue: 'both'
        }
      ]
      setConfigDiff(mockDiff)
      setIsDiffModalVisible(true)
    } catch (error) {
      message.error('获取差异失败')
    }
  }

  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version: string) => (
        <Text strong>v{version}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusInfo = statusMap[status]
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '审核人',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      width: 120,
      render: (approvedBy: string) => approvedBy || '-'
    },
    {
      title: '审核备注',
      dataIndex: 'reviewNote',
      key: 'reviewNote',
      ellipsis: true,
      render: (reviewNote: string) => reviewNote || '-'
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 180,
      render: (submittedAt: string) => submittedAt ? new Date(submittedAt).toLocaleString() : '-'
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 180,
      render: (publishedAt: string) => publishedAt ? new Date(publishedAt).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: ConfigRevision) => (
        <Space>
          <Tooltip title="查看配置">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip>
          {record.status === 'submitted' && (
            <Tooltip title="审核">
              <Button 
                type="text" 
                icon={<CheckOutlined />} 
                size="small"
                onClick={() => {
                  setSelectedRevision(record)
                  setIsApproveModalVisible(true)
                }}
              />
            </Tooltip>
          )}
          {record.status === 'approved' && (
            <Tooltip title="发布">
              <Button 
                type="text" 
                icon={<SendOutlined />} 
                size="small"
                onClick={handlePublish}
              />
            </Tooltip>
          )}
          {record.status === 'published' && record.version !== currentPublishedVersion && (
            <Tooltip title="回滚到此版本">
              <Button 
                type="text" 
                icon={<RollbackOutlined />} 
                size="small"
                onClick={() => {
                  setSelectedRevision(record)
                  setIsRollbackModalVisible(true)
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="对比差异">
            <Button 
              type="text" 
              icon={<DiffOutlined />} 
              size="small"
              onClick={() => {
                const currentRevision = revisions.find(r => r.version === currentPublishedVersion)
                if (currentRevision) {
                  handleViewDiff(currentRevision, record)
                }
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>配置版本管理</Title>
        <Paragraph type="secondary">
          管理租户配置的版本历史，支持草稿、审核、发布和回滚流程
        </Paragraph>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>版本历史</Title>
              <Space>
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={() => setIsSubmitModalVisible(true)}
                >
                  提交审核
                </Button>
                <Button 
                  icon={<FileTextOutlined />}
                  onClick={loadRevisions}
                >
                  刷新
                </Button>
              </Space>
            </div>

            <Table
              dataSource={revisions}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个版本`
              }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="当前状态">
            <Timeline>
              <Timeline.Item color="green">
                <Text strong>已发布版本: v{currentPublishedVersion}</Text>
                <br />
                <Text type="secondary">配置已生效</Text>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text>待审核版本: 0</Text>
                <br />
                <Text type="secondary">等待平台审核</Text>
              </Timeline.Item>
              <Timeline.Item color="default">
                <Text>草稿版本: 1</Text>
                <br />
                <Text type="secondary">正在编辑中</Text>
              </Timeline.Item>
            </Timeline>

            <Divider />

            <Alert
              message="配置发布流程"
              description={
                <div>
                  <p>1. 编辑配置并保存为草稿</p>
                  <p>2. 提交审核等待平台审批</p>
                  <p>3. 审核通过后发布到生产环境</p>
                  <p>4. 可随时回滚到历史版本</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        </Col>
      </Row>

      {/* 提交审核模态框 */}
      <Modal
        title="提交配置审核"
        open={isSubmitModalVisible}
        onCancel={() => setIsSubmitModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmitForReview}>
          <Form.Item
            name="reviewNote"
            label="审核备注"
          >
            <TextArea 
              rows={4} 
              placeholder="请说明本次配置变更的内容和原因..."
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsSubmitModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交审核
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 审核模态框 */}
      <Modal
        title="审核配置"
        open={isApproveModalVisible}
        onCancel={() => setIsApproveModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleApprove}>
          <Form.Item
            name="reviewNote"
            label="审核备注"
            initialValue="配置审核通过"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入审核意见..."
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsApproveModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                审核通过
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 回滚模态框 */}
      <Modal
        title={`回滚到版本 ${selectedRevision?.version}`}
        open={isRollbackModalVisible}
        onCancel={() => setIsRollbackModalVisible(false)}
        footer={null}
      >
        <Alert
          message="回滚警告"
          description="回滚操作将创建新版本并立即发布，请确认操作。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={form} onFinish={handleRollback}>
          <Form.Item
            name="reason"
            label="回滚原因"
            rules={[{ required: true, message: '请输入回滚原因' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请说明回滚的原因..."
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsRollbackModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<RollbackOutlined />}>
                确认回滚
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 差异对比模态框 */}
      <Modal
        title="配置差异对比"
        open={isDiffModalVisible}
        onCancel={() => setIsDiffModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsDiffModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {configDiff.map((diff, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong>路径:</Text>
                  <br />
                  <Text code>{diff.path}</Text>
                </Col>
                <Col span={4}>
                  <Text strong>操作:</Text>
                  <br />
                  <Tag color={
                    diff.operation === 'add' ? 'green' : 
                    diff.operation === 'remove' ? 'red' : 'blue'
                  }>
                    {diff.operation === 'add' ? '新增' : 
                     diff.operation === 'remove' ? '删除' : '修改'}
                  </Tag>
                </Col>
                <Col span={7}>
                  <Text strong>原值:</Text>
                  <br />
                  <Text code>{JSON.stringify(diff.oldValue)}</Text>
                </Col>
                <Col span={7}>
                  <Text strong>新值:</Text>
                  <br />
                  <Text code>{JSON.stringify(diff.newValue)}</Text>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  )
}
