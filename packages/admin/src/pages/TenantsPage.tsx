import { useState } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message,
  Popconfirm,
  Typography
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface Tenant {
  id: string
  name: string
  industry: string
  domain: string
  status: 'active' | 'inactive'
}

export const TenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: '1',
      name: '美味餐厅',
      industry: 'restaurant',
      domain: 'restaurant.example.com',
      status: 'active'
    },
    {
      id: '2',
      name: '运动场馆',
      industry: 'fitness',
      domain: 'fitness.example.com',
      status: 'active'
    }
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [form] = Form.useForm()

  const industries = [
    { value: 'restaurant', label: '餐饮' },
    { value: 'fitness', label: '健身' },
    { value: 'retail', label: '零售' },
    { value: 'hotel', label: '酒店' },
    { value: 'education', label: '教育' },
    { value: 'healthcare', label: '医疗' }
  ]

  const columns = [
    {
      title: '租户名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      render: (industry: string) => {
        const industryMap: Record<string, string> = {
          restaurant: '餐饮',
          fitness: '健身',
          retail: '零售',
          hotel: '酒店',
          education: '教育',
          healthcare: '医疗'
        }
        return <Tag color="blue">{industryMap[industry] || industry}</Tag>
      }
    },
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string, color: string }> = {
          active: { text: '激活', color: 'green' },
          inactive: { text: '未激活', color: 'orange' }
        }
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Tenant) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此租户？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    form.setFieldsValue(tenant)
    setIsModalVisible(true)
  }

  const handleDelete = (id: string) => {
    setTenants(tenants.filter(tenant => tenant.id !== id))
    message.success('租户删除成功')
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingTenant) {
        // 更新租户
        setTenants(tenants.map(tenant => 
          tenant.id === editingTenant.id ? { ...values, id: editingTenant.id } : tenant
        ))
        message.success('租户更新成功')
      } else {
        // 创建租户
        const newTenant = {
          ...values,
          id: `${tenants.length + 1}`
        }
        setTenants([...tenants, newTenant])
        message.success('租户创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
      setEditingTenant(null)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setEditingTenant(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>租户管理</Title>
        <Paragraph type="secondary">
          管理平台租户，包括创建、编辑和删除租户
        </Paragraph>
      </div>

      <Card>
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTenant(null)
              form.resetFields()
              setIsModalVisible(true)
            }}
          >
            新增租户
          </Button>
        </div>

        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个租户`
          }}
        />
      </Card>

      <Modal
        title={editingTenant ? '编辑租户' : '新增租户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active'
          }}
        >
          <Form.Item
            name="name"
            label="租户名称"
            rules={[{ required: true, message: '请输入租户名称' }]}
          >
            <Input placeholder="例如: 美味餐厅" />
          </Form.Item>

          <Form.Item
            name="industry"
            label="行业"
            rules={[{ required: true, message: '请选择行业' }]}
          >
            <Select placeholder="请选择行业">
              {industries.map(industry => (
                <Select.Option key={industry.value} value={industry.value}>
                  {industry.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="domain"
            label="域名"
            rules={[
              { required: true, message: '请输入域名' },
              { type: 'url', message: '请输入有效的域名' }
            ]}
          >
            <Input placeholder="例如: restaurant.example.com" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="active">激活</Select.Option>
              <Select.Option value="inactive">未激活</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}