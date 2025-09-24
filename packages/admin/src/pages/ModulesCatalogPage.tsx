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
const { TextArea } = Input

interface ModuleCatalog {
  id: string
  key: string
  name: string
  version: string
  status: 'active' | 'inactive' | 'deprecated'
  category: 'core' | 'business' | 'ui'
  capabilities: string[]
  description: string
}

export const ModulesCatalogPage = () => {
  const [modules, setModules] = useState<ModuleCatalog[]>([
    {
      id: '1',
      key: 'ordering',
      name: '点餐模块',
      version: '1.0.0',
      status: 'active',
      category: 'business',
      capabilities: ['menu_display', 'cart_management', 'order_creation'],
      description: '餐厅点餐功能模块'
    },
    {
      id: '2',
      key: 'booking',
      name: '预约模块',
      version: '1.0.0',
      status: 'active',
      category: 'business',
      capabilities: ['slot_management', 'booking_creation', 'availability_check'],
      description: '场馆预约功能模块'
    }
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingModule, setEditingModule] = useState<ModuleCatalog | null>(null)
  const [form] = Form.useForm()

  const columns = [
    {
      title: '模块标识',
      dataIndex: 'key',
      key: 'key',
      render: (text: string) => <code>{text}</code>
    },
    {
      title: '模块名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => <Tag color="blue">{version}</Tag>
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const colors = {
          core: 'red',
          business: 'green',
          ui: 'purple'
        }
        return <Tag color={colors[category as keyof typeof colors]}>{category}</Tag>
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
          deprecated: 'red'
        }
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>
      }
    },
    {
      title: '功能',
      dataIndex: 'capabilities',
      key: 'capabilities',
      render: (capabilities: string[]) => (
        <div>
          {capabilities.slice(0, 2).map(cap => (
            <Tag key={cap} size="small">{cap}</Tag>
          ))}
          {capabilities.length > 2 && <Tag size="small">+{capabilities.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ModuleCatalog) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个模块吗？"
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

  const handleAdd = () => {
    setEditingModule(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (module: ModuleCatalog) => {
    setEditingModule(module)
    form.setFieldsValue(module)
    setIsModalVisible(true)
  }

  const handleDelete = (id: string) => {
    setModules(modules.filter(m => m.id !== id))
    message.success('模块删除成功')
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingModule) {
        // 编辑模式
        setModules(modules.map(m => 
          m.id === editingModule.id ? { ...m, ...values } : m
        ))
        message.success('模块更新成功')
      } else {
        // 新增模式
        const newModule: ModuleCatalog = {
          id: Date.now().toString(),
          ...values
        }
        setModules([...modules, newModule])
        message.success('模块创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>模块目录管理</Title>
        <Paragraph type="secondary">
          管理平台所有可用模块，包括版本控制、状态管理和功能配置
        </Paragraph>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增模块
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={modules}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个模块`
          }}
        />
      </Card>

      <Modal
        title={editingModule ? '编辑模块' : '新增模块'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active',
            category: 'business'
          }}
        >
          <Form.Item
            name="key"
            label="模块标识"
            rules={[{ required: true, message: '请输入模块标识' }]}
          >
            <Input placeholder="例如: ordering" />
          </Form.Item>

          <Form.Item
            name="name"
            label="模块名称"
            rules={[{ required: true, message: '请输入模块名称' }]}
          >
            <Input placeholder="例如: 点餐模块" />
          </Form.Item>

          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如: 1.0.0" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select>
              <Select.Option value="core">核心模块</Select.Option>
              <Select.Option value="business">业务模块</Select.Option>
              <Select.Option value="ui">界面模块</Select.Option>
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
              <Select.Option value="deprecated">已废弃</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入模块描述' }]}
          >
            <TextArea rows={3} placeholder="模块功能描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
