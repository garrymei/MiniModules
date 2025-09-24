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
  Col
} from 'antd'
import { SearchOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface Booking {
  id: string
  customer: string
  resource: string
  bookingDate: string
  timeSlot: string
  peopleCount: number
  status: 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'completed'
  createdAt: string
}

export const BookingManagementPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      customer: '张三',
      resource: '大厅A区',
      bookingDate: '2024-01-10',
      timeSlot: '18:00-19:00',
      peopleCount: 4,
      status: 'confirmed',
      createdAt: '2024-01-01 10:30:00'
    },
    {
      id: '2',
      customer: '李四',
      resource: '包间B',
      bookingDate: '2024-01-10',
      timeSlot: '19:00-20:00',
      peopleCount: 6,
      status: 'pending',
      createdAt: '2024-01-01 14:20:00'
    },
    {
      id: '3',
      customer: '王五',
      resource: '大厅A区',
      bookingDate: '2024-01-11',
      timeSlot: '12:00-13:00',
      peopleCount: 2,
      status: 'checked_in',
      createdAt: '2024-01-02 09:15:00'
    }
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [form] = Form.useForm()

  const statusMap: Record<string, { text: string, color: string }> = {
    pending: { text: '待确认', color: 'orange' },
    confirmed: { text: '已确认', color: 'blue' },
    checked_in: { text: '已入场', color: 'green' },
    cancelled: { text: '已取消', color: 'red' },
    completed: { text: '已完成', color: 'purple' }
  }

  const columns = [
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource'
    },
    {
      title: '预约日期',
      dataIndex: 'bookingDate',
      key: 'bookingDate'
    },
    {
      title: '时段',
      dataIndex: 'timeSlot',
      key: 'timeSlot'
    },
    {
      title: '人数',
      dataIndex: 'peopleCount',
      key: 'peopleCount'
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
      title: '预约时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewBooking(record)}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <Button 
              type="link" 
              icon={<CheckOutlined />}
              onClick={() => handleConfirmBooking(record)}
            >
              确认
            </Button>
          )}
          <Button type="link" onClick={() => handleCheckIn(record)}>
            核销
          </Button>
        </Space>
      )
    }
  ]

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    form.setFieldsValue(booking)
    setIsModalVisible(true)
  }

  const handleConfirmBooking = (booking: Booking) => {
    // 更新预约状态为已确认
    setBookings(bookings.map(b => 
      b.id === booking.id ? { ...b, status: 'confirmed' } : b
    ))
    message.success(`预约 ${booking.id} 已确认`)
  }

  const handleCheckIn = (booking: Booking) => {
    // 更新预约状态为已入场
    setBookings(bookings.map(b => 
      b.id === booking.id ? { ...b, status: 'checked_in' } : b
    ))
    message.success(`预约 ${booking.id} 已核销`)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      // 更新预约信息
      setBookings(bookings.map(booking => 
        booking.id === selectedBooking?.id ? { ...booking, ...values } : booking
      ))
      
      message.success('预约更新成功')
      setIsModalVisible(false)
      form.resetFields()
      setSelectedBooking(null)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setSelectedBooking(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>预约管理</Title>
        <Paragraph type="secondary">
          管理所有预约，包括查看、确认、核销等操作
        </Paragraph>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input placeholder="客户姓名" prefix={<SearchOutlined />} />
          </Col>
          <Col span={6}>
            <Input placeholder="资源名称" prefix={<SearchOutlined />} />
          </Col>
          <Col span={6}>
            <Select placeholder="预约状态" style={{ width: '100%' }}>
              <Select.Option value="pending">待确认</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="checked_in">已入场</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <DatePicker placeholder="预约日期" style={{ width: '100%' }} />
          </Col>
        </Row>

        <Table
          dataSource={bookings}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个预约`
          }}
        />
      </Card>

      <Modal
        title="预约详情"
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
            name="customer"
            label="客户"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="resource"
            label="资源"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="bookingDate"
            label="预约日期"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="timeSlot"
            label="时段"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="peopleCount"
            label="人数"
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="status"
            label="预约状态"
          >
            <Select>
              <Select.Option value="pending">待确认</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="checked_in">已入场</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="createdAt"
            label="预约时间"
          >
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}