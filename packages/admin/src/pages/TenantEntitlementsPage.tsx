import { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Select, 
  DatePicker, 
  message,
  Typography,
  Input,
  Row,
  Col
} from 'antd'
import { PlusOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { Search } = Input

interface Tenant {
  id: string
  name: string
  industry: string
  status: 'active' | 'inactive'
}

interface Entitlement {
  id: string
  tenantId: string
  moduleKey: string
  status: 'active' | 'inactive' | 'expired'
  expiresAt?: string
  createdAt: string
}

export const TenantEntitlementsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: '1', name: '美味餐厅', industry: 'restaurant', status: 'active' },
    { id: '2', name: '运动场馆', industry: 'fitness', status: 'active' },
    { id: '3', name: '数码商店', industry: 'retail', status: 'active' }
  ])

  const [entitlements, setEntitlements] = useState<Entitlement[]>([
    {
      id: '1',
      tenantId: '1',
      moduleKey: 'ordering',
      status: 'active',
      expiresAt: '2024-12-31',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      tenantId: '1',
      moduleKey: 'user',
      status: 'active',
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      tenantId: '2',
      moduleKey: 'booking',
      status: 'active',
      expiresAt: '2024-12-31',
      createdAt: '2024-01-01'
    }
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingEntitlement, setEditingEntitlement] = useState<Entitlement | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [form] = Form.useForm()

  const availableModules = [
    { key: 'ordering', name: '点餐模块' },
    { key: 'booking', name: '预约模块' },
    { key: 'ecommerce', name: '电商模块' },
    { key: 'ticketing', name: '票务模块' },
    { key: 'subscription', name: '会员模块' },
    { key: 'cms', name: 'CMS模块' },
    { key: 'user', name: '用户模块' },
    { key: 'payment', name: '支付模块' }
  ]

  const columns = [
    {
      title: '租户',
      dataIndex: 'tenantId',
      key: 'tenantId',
      render: (tenantId: string) => {
        const tenant = tenants.find(t => t.id === tenantId)
        return tenant ? (
          <div>
            <div>{tenant.name}</div>
            <Tag size="small" color="blue">{tenant.industry}</Tag>
          </div>
        ) : tenantId
      }
    },
    {
      title: '模块',
      dataIndex: 'moduleKey',
      key: 'moduleKey',
      render: (moduleKey: string) => {
        const module = availableModules.find(m => m.key === moduleKey)
        return module ? module.name : moduleKey
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          inactive: 'orange',
          expired: 'red'
        }
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>
      }
    },
    {
      title: '到期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (expiresAt: string) => expiresAt || '永久'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Entitlement) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<CheckOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
        </Space>
      )
    }
  ]

  const handleAdd = () => {
    setEditingEntitlement(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (entitlement: Entitlement) => {
    setEditingEntitlement(entitlement)
    form.setFieldsValue({
      ...entitlement,
      expiresAt: entitlement.expiresAt ? new Date(entitlement.expiresAt) : null
    })
    setIsModalVisible(true)
  }

  const handleToggleStatus = (entitlement: Entitlement) => {
    const newStatus = entitlement.status === 'active' ? 'inactive' : 'active'
    setEntitlements(entitlements.map(e => 
      e.id === entitlement.id ? { ...e, status: newStatus } : e
    ))
    message.success(`模块${newStatus === 'active' ? '启用' : '停用'}成功`)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingEntitlement) {
        // 编辑模式
        setEntitlements(entitlements.map(e => 
          e.id === editingEntitlement.id ? { 
            ...e, 
            ...values,
            expiresAt: values.expiresAt ? values.expiresAt.format('YYYY-MM-DD') : undefined
          } : e
        ))
        message.success('授权更新成功')
      } else {
        // 新增模式
        const newEntitlement: Entitlement = {
          id: Date.now().toString(),
          ...values,
          expiresAt: values.expiresAt ? values.expiresAt.format('YYYY-MM-DD') : undefined,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setEntitlements([...entitlements, newEntitlement])
        message.success('授权创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const filteredEntitlements = selectedTenant 
    ? entitlements.filter(e => e.tenantId === selectedTenant)
    : entitlements

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>租户模块授权</Title>
        <Paragraph type="secondary">
          管理租户的模块使用权限，包括授权状态、有效期和功能限制
        </Paragraph>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Select
              placeholder="选择租户筛选"
              style={{ width: '100%' }}
              allowClear
              value={selectedTenant}
              onChange={setSelectedTenant}
            >
              {tenants.map(tenant => (
                <Select.Option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.industry})
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={16} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增授权
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredEntitlements}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个授权`
          }}
        />
      </Card>

      <Modal
        title={editingEntitlement ? '编辑授权' : '新增授权'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active'
          }}
        >
          <Form.Item
            name="tenantId"
            label="租户"
            rules={[{ required: true, message: '请选择租户' }]}
          >
            <Select placeholder="选择租户">
              {tenants.map(tenant => (
                <Select.Option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.industry})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="moduleKey"
            label="模块"
            rules={[{ required: true, message: '请选择模块' }]}
          >
            <Select placeholder="选择模块">
              {availableModules.map(module => (
                <Select.Option key={module.key} value={module.key}>
                  {module.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="active">激活</Select.Option>
              <Select.Option value="inactive">未激活</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label="到期时间"
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择到期时间（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
