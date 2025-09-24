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
  message,
  DatePicker,
  Typography,
  Row,
  Col,
  InputNumber
} from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface Order {
  id: string
  orderNumber: string
  customer: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  orderType: 'dine_in' | 'takeout'
  createdAt: string
}

export const OrderManagementPage = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD20240101001',
      customer: '张三',
      totalAmount: 89.5,
      status: 'completed',
      orderType: 'dine_in',
      createdAt: '2024-01-01 12:30:00'
    },
    {
      id: '2',
      orderNumber: 'ORD20240101002',
      customer: '李四',
      totalAmount: 56.0,
      status: 'preparing',
      orderType: 'takeout',
      createdAt: '2024-01-01 13:15:00'
    },
    {
      id: '3',
      orderNumber: 'ORD20240101003',
      customer: '王五',
      totalAmount: 128.0,
      status: 'pending',
      orderType: 'dine_in',
      createdAt: '2024-01-01 14:20:00'
    }
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [form] = Form.useForm()

  const statusMap: Record<string, { text: string, color: string }> = {
    pending: { text: '待处理', color: 'orange' },
    confirmed: { text: '已确认', color: 'blue' },
    preparing: { text: '制作中', color: 'gold' },
    ready: { text: '待取餐', color: 'cyan' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' }
  }

  const orderTypeMap: Record<string, string> = {
    dine_in: '堂食',
    takeout: '外卖'
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber'
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (type: string) => (
        <Tag color={type === 'dine_in' ? 'blue' : 'green'}>
          {orderTypeMap[type]}
        </Tag>
      )
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
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
          >
            查看
          </Button>
          <Button type="link" onClick={() => handleUpdateStatus(record)}>
            更新状态
          </Button>
        </Space>
      )
    }
  ]

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    form.setFieldsValue(order)
    setIsModalVisible(true)
  }

  const handleUpdateStatus = (order: Order) => {
    // 这里应该调用API更新订单状态
    message.success(`订单 ${order.orderNumber} 状态更新成功`)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      // 更新订单信息
      setOrders(orders.map(order => 
        order.id === selectedOrder?.id ? { ...order, ...values } : order
      ))
      
      message.success('订单更新成功')
      setIsModalVisible(false)
      form.resetFields()
      setSelectedOrder(null)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setSelectedOrder(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>订单管理</Title>
        <Paragraph type="secondary">
          管理所有订单，包括查看、更新状态等操作
        </Paragraph>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input placeholder="订单号" prefix={<SearchOutlined />} />
          </Col>
          <Col span={6}>
            <Input placeholder="客户姓名" prefix={<SearchOutlined />} />
          </Col>
          <Col span={6}>
            <Select placeholder="订单状态" style={{ width: '100%' }}>
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="preparing">制作中</Select.Option>
              <Select.Option value="ready">待取餐</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <DatePicker placeholder="下单日期" style={{ width: '100%' }} />
          </Col>
        </Row>

        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个订单`
          }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="orderNumber"
            label="订单号"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="customer"
            label="客户"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="totalAmount"
            label="订单金额"
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `¥${value}`}
              parser={value => value!.replace(/¥\s?|(,*)/g, '') as any}
            />
          </Form.Item>

          <Form.Item
            name="orderType"
            label="订单类型"
          >
            <Select>
              <Select.Option value="dine_in">堂食</Select.Option>
              <Select.Option value="takeout">外卖</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="订单状态"
          >
            <Select>
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="preparing">制作中</Select.Option>
              <Select.Option value="ready">待取餐</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="createdAt"
            label="下单时间"
          >
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}