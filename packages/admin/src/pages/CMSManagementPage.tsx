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
  Select, 
  message,
  Upload,
  Switch,
  DatePicker,
  Typography,
  Row,
  Col,
  Divider,
  InputNumber
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  EyeOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Title, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

interface CMSContent {
  id: string
  title: string
  type: 'banner' | 'article' | 'announcement' | 'activity'
  status: 'draft' | 'published' | 'archived'
  category?: string
  coverImage?: string
  sortOrder: number
  jumpType?: 'page' | 'url' | 'internal' | 'none'
  jumpUrl?: string
  createdAt: string
  updatedAt: string
}

export const CMSManagementPage = () => {
  const [contents, setContents] = useState<CMSContent[]>([
    {
      id: '1',
      title: '夏日特惠活动',
      type: 'banner',
      status: 'published',
      coverImage: 'https://example.com/banner1.jpg',
      sortOrder: 1,
      jumpType: 'page',
      createdAt: '2024-01-01 10:30:00',
      updatedAt: '2024-01-01 10:30:00'
    },
    {
      id: '2',
      title: '新品上市公告',
      type: 'announcement',
      status: 'published',
      sortOrder: 1,
      createdAt: '2024-01-02 09:15:00',
      updatedAt: '2024-01-02 09:15:00'
    },
    {
      id: '3',
      title: '如何选择适合自己的健身计划',
      type: 'article',
      status: 'published',
      category: '健身指南',
      coverImage: 'https://example.com/article1.jpg',
      sortOrder: 1,
      createdAt: '2024-01-03 14:20:00',
      updatedAt: '2024-01-03 14:20:00'
    }
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingContent, setEditingContent] = useState<CMSContent | null>(null)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState<'banner' | 'article' | 'announcement' | 'activity'>('banner')
  const [loading, setLoading] = useState(false)

  const contentTypes = [
    { value: 'banner', label: '轮播图' },
    { value: 'article', label: '文章' },
    { value: 'announcement', label: '公告' },
    { value: 'activity', label: '活动' }
  ]

  const statusMap: Record<string, { text: string, color: string }> = {
    draft: { text: '草稿', color: 'gold' },
    published: { text: '已发布', color: 'green' },
    archived: { text: '已归档', color: 'gray' }
  }

  const jumpTypes = [
    { value: 'none', label: '无跳转' },
    { value: 'page', label: '页面跳转' },
    { value: 'url', label: '链接跳转' },
    { value: 'internal', label: '内部跳转' }
  ]

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeInfo = contentTypes.find(t => t.value === type)
        return typeInfo?.label || type
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      render: (sortOrder: number, record: CMSContent) => (
        <Space>
          <Button 
            type="text" 
            icon={<UpOutlined />} 
            size="small"
            onClick={() => handleMoveUp(record)}
          />
          <span>{sortOrder}</span>
          <Button 
            type="text" 
            icon={<DownOutlined />} 
            size="small"
            onClick={() => handleMoveDown(record)}
          />
        </Space>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: CMSContent) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            danger
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const handleMoveUp = (record: CMSContent) => {
    setContents(prev => prev.map(content => 
      content.id === record.id 
        ? { ...content, sortOrder: Math.max(1, content.sortOrder - 1) } 
        : content
    ))
    message.success('排序已更新')
  }

  const handleMoveDown = (record: CMSContent) => {
    setContents(prev => prev.map(content => 
      content.id === record.id 
        ? { ...content, sortOrder: content.sortOrder + 1 } 
        : content
    ))
    message.success('排序已更新')
  }

  const handlePreview = (record: CMSContent) => {
    message.info(`预览内容: ${record.title}`)
  }

  const handleEdit = (record: CMSContent) => {
    setEditingContent(record)
    form.setFieldsValue(record)
    setIsModalVisible(true)
  }

  const handleDelete = (record: CMSContent) => {
    setContents(prev => prev.filter(content => content.id !== record.id))
    message.success('删除成功')
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingContent) {
        // 更新内容
        setContents(prev => prev.map(content => 
          content.id === editingContent.id 
            ? { ...content, ...values, updatedAt: new Date().toISOString() } 
            : content
        ))
        message.success('内容更新成功')
      } else {
        // 新增内容
        const newContent: CMSContent = {
          id: `${contents.length + 1}`,
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setContents(prev => [...prev, newContent])
        message.success('内容创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
      setEditingContent(null)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setEditingContent(null)
  }

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/admin/files/upload',
    headers: {
      authorization: 'Bearer ' + localStorage.getItem('token'),
    },
    onChange(info) {
      if (info.file.status === 'done') {
        const url = info.file.response?.url
        if (url) {
          form.setFieldsValue({ coverImage: url })
          message.success('图片上传成功')
        }
      } else if (info.file.status === 'error') {
        message.error('图片上传失败')
      }
    },
  }

  const renderContentForm = () => {
    const contentType = form.getFieldValue('type') || activeTab
    
    return (
      <>
        <Form.Item
          name="type"
          label="内容类型"
          rules={[{ required: true, message: '请选择内容类型' }]}
        >
          <Select options={contentTypes} />
        </Form.Item>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入标题" />
        </Form.Item>

        {contentType !== 'banner' && (
          <Form.Item
            name="category"
            label="分类"
          >
            <Input placeholder="请输入分类" />
          </Form.Item>
        )}

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select>
            <Option value="draft">草稿</Option>
            <Option value="published">已发布</Option>
            <Option value="archived">已归档</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="sortOrder"
          label="排序"
          rules={[{ required: true, message: '请输入排序' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="jumpType"
          label="跳转类型"
        >
          <Select options={jumpTypes} />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.jumpType !== currentValues.jumpType}
        >
          {({ getFieldValue }) => 
            getFieldValue('jumpType') === 'url' ? (
              <Form.Item
                name="jumpUrl"
                label="跳转链接"
                rules={[{ required: true, message: '请输入跳转链接' }]}
              >
                <Input placeholder="请输入跳转链接" />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item
          name="coverImage"
          label="封面图片"
        >
          <div>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>上传图片</Button>
            </Upload>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              支持 JPG、PNG、GIF 格式，建议尺寸 800x600px
            </div>
          </div>
        </Form.Item>

        {contentType !== 'banner' && (
          <Form.Item
            name="content"
            label="内容"
          >
            <TextArea rows={6} placeholder="请输入内容" />
          </Form.Item>
        )}
      </>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>CMS内容管理</Title>
        <Paragraph type="secondary">
          管理轮播图、文章、公告和活动内容
        </Paragraph>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Select 
            style={{ width: 120 }}
            value={activeTab}
            onChange={setActiveTab}
          >
            <Select.Option value="banner">轮播图</Select.Option>
            <Select.Option value="article">文章</Select.Option>
            <Select.Option value="announcement">公告</Select.Option>
            <Select.Option value="activity">活动</Select.Option>
          </Select>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingContent(null)
              form.resetFields()
              form.setFieldsValue({ 
                type: activeTab,
                status: 'draft',
                sortOrder: Math.max(0, ...contents.filter(c => c.type === activeTab).map(c => c.sortOrder)) + 1
              })
              setIsModalVisible(true)
            }}
          >
            新增内容
          </Button>
        </div>

        <Table
          dataSource={contents.filter(content => content.type === activeTab)}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条内容`
          }}
        />
      </Card>

      <Modal
        title={editingContent ? '编辑内容' : '新增内容'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'draft',
            sortOrder: 1,
            jumpType: 'none'
          }}
        >
          {renderContentForm()}
        </Form>
      </Modal>
    </div>
  )
}