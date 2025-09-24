import { useState } from 'react'
import { 
  Card, 
  Tabs, 
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
  Typography,
  InputNumber
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive'
}

interface BookingResource {
  id: string
  name: string
  capacity: number
  status: 'active' | 'inactive'
}

interface Article {
  id: string
  title: string
  category: string
  status: 'published' | 'draft'
}

export const ResourcesPage = () => {
  const [activeTab, setActiveTab] = useState('products')
  
  // 商品数据
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: '招牌汉堡',
      category: '主食',
      price: 29.9,
      stock: 100,
      status: 'active'
    },
    {
      id: '2',
      name: '可乐',
      category: '饮品',
      price: 8.0,
      stock: 200,
      status: 'active'
    }
  ])

  // 预约资源数据
  const [bookingResources, setBookingResources] = useState<BookingResource[]>([
    {
      id: '1',
      name: '大厅A区',
      capacity: 20,
      status: 'active'
    },
    {
      id: '2',
      name: '包间B',
      capacity: 10,
      status: 'active'
    }
  ])

  // 文章数据
  const [articles, setArticles] = useState<Article[]>([
    {
      id: '1',
      title: '新品上市通知',
      category: '公告',
      status: 'published'
    },
    {
      id: '2',
      title: '餐厅优惠活动',
      category: '活动',
      status: 'draft'
    }
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingResource, setEditingResource] = useState<any>(null)
  const [resourceType, setResourceType] = useState('product')
  const [form] = Form.useForm()

  // 商品列定义
  const productColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string, color: string }> = {
          active: { text: '上架', color: 'green' },
          inactive: { text: '下架', color: 'orange' }
        }
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditResource('product', record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此商品？"
            onConfirm={() => handleDeleteResource('product', record.id)}
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

  // 预约资源列定义
  const bookingResourceColumns = [
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string, color: string }> = {
          active: { text: '启用', color: 'green' },
          inactive: { text: '停用', color: 'orange' }
        }
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: BookingResource) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditResource('bookingResource', record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此资源？"
            onConfirm={() => handleDeleteResource('bookingResource', record.id)}
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

  // 文章列定义
  const articleColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string, color: string }> = {
          published: { text: '已发布', color: 'green' },
          draft: { text: '草稿', color: 'orange' }
        }
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Article) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditResource('article', record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此文章？"
            onConfirm={() => handleDeleteResource('article', record.id)}
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

  const handleEditResource = (type: string, resource: any) => {
    setResourceType(type)
    setEditingResource(resource)
    form.setFieldsValue(resource)
    setIsModalVisible(true)
  }

  const handleDeleteResource = (type: string, id: string) => {
    switch (type) {
      case 'product':
        setProducts(products.filter(item => item.id !== id))
        break
      case 'bookingResource':
        setBookingResources(bookingResources.filter(item => item.id !== id))
        break
      case 'article':
        setArticles(articles.filter(item => item.id !== id))
        break
    }
    message.success('删除成功')
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingResource) {
        // 更新资源
        switch (resourceType) {
          case 'product':
            setProducts(products.map(item => 
              item.id === editingResource.id ? { ...values, id: editingResource.id } : item
            ))
            break
          case 'bookingResource':
            setBookingResources(bookingResources.map(item => 
              item.id === editingResource.id ? { ...values, id: editingResource.id } : item
            ))
            break
          case 'article':
            setArticles(articles.map(item => 
              item.id === editingResource.id ? { ...values, id: editingResource.id } : item
            ))
            break
        }
        message.success('更新成功')
      } else {
        // 创建资源
        const newResource = {
          ...values,
          id: `${Date.now()}`
        }
        switch (resourceType) {
          case 'product':
            setProducts([...products, newResource])
            break
          case 'bookingResource':
            setBookingResources([...bookingResources, newResource])
            break
          case 'article':
            setArticles([...articles, newResource])
            break
        }
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
      setEditingResource(null)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setEditingResource(null)
  }

  const renderProductForm = () => (
    <>
      <Form.Item
        name="name"
        label="商品名称"
        rules={[{ required: true, message: '请输入商品名称' }]}
      >
        <Input placeholder="例如: 招牌汉堡" />
      </Form.Item>

      <Form.Item
        name="category"
        label="分类"
        rules={[{ required: true, message: '请输入分类' }]}
      >
        <Input placeholder="例如: 主食" />
      </Form.Item>

      <Form.Item
        name="price"
        label="价格"
        rules={[{ required: true, message: '请输入价格' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="例如: 29.9"
          min={0}
          step={0.1}
          formatter={value => `¥${value}`}
          parser={value => value!.replace(/¥\s?|(,*)/g, '') as any}
        />
      </Form.Item>

      <Form.Item
        name="stock"
        label="库存"
        rules={[{ required: true, message: '请输入库存' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="例如: 100"
          min={0}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="状态"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select>
          <Select.Option value="active">上架</Select.Option>
          <Select.Option value="inactive">下架</Select.Option>
        </Select>
      </Form.Item>
    </>
  )

  const renderBookingResourceForm = () => (
    <>
      <Form.Item
        name="name"
        label="资源名称"
        rules={[{ required: true, message: '请输入资源名称' }]}
      >
        <Input placeholder="例如: 大厅A区" />
      </Form.Item>

      <Form.Item
        name="capacity"
        label="容量"
        rules={[{ required: true, message: '请输入容量' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="例如: 20"
          min={1}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="状态"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select>
          <Select.Option value="active">启用</Select.Option>
          <Select.Option value="inactive">停用</Select.Option>
        </Select>
      </Form.Item>
    </>
  )

  const renderArticleForm = () => (
    <>
      <Form.Item
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入标题' }]}
      >
        <Input placeholder="例如: 新品上市通知" />
      </Form.Item>

      <Form.Item
        name="category"
        label="分类"
        rules={[{ required: true, message: '请输入分类' }]}
      >
        <Input placeholder="例如: 公告" />
      </Form.Item>

      <Form.Item
        name="status"
        label="状态"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select>
          <Select.Option value="published">已发布</Select.Option>
          <Select.Option value="draft">草稿</Select.Option>
        </Select>
      </Form.Item>
    </>
  )

  const tabItems = [
    {
      key: 'products',
      label: '商品管理',
      children: (
        <Card>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setResourceType('product')
                setEditingResource(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              新增商品
            </Button>
          </div>

          <Table
            dataSource={products}
            columns={productColumns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个商品`
            }}
          />
        </Card>
      )
    },
    {
      key: 'bookingResources',
      label: '预约资源',
      children: (
        <Card>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setResourceType('bookingResource')
                setEditingResource(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              新增资源
            </Button>
          </div>

          <Table
            dataSource={bookingResources}
            columns={bookingResourceColumns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个资源`
            }}
          />
        </Card>
      )
    },
    {
      key: 'articles',
      label: '内容管理',
      children: (
        <Card>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setResourceType('article')
                setEditingResource(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              新增文章
            </Button>
          </div>

          <Table
            dataSource={articles}
            columns={articleColumns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 篇文章`
            }}
          />
        </Card>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>资源管理</Title>
        <Paragraph type="secondary">
          管理商品、预约资源和内容文章
        </Paragraph>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={editingResource ? '编辑资源' : '新增资源'}
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
          {resourceType === 'product' && renderProductForm()}
          {resourceType === 'bookingResource' && renderBookingResourceForm()}
          {resourceType === 'article' && renderArticleForm()}
        </Form>
      </Modal>
    </div>
  )
}