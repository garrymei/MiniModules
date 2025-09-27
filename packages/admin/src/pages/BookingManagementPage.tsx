import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  InputNumber,
  Dropdown,
  Menu,
  notification
} from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined, DownloadOutlined, ExportOutlined } from '@ant-design/icons';
import { apiClient } from '../services/apiClient';

const { Title, Paragraph } = Typography;

// This interface should ideally be imported from a shared types package
interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'completed';
  totalAmount: number;
  createdAt: string;
}

interface ExportJob {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fileName: string;
  fileUrl?: string;
  createdAt: string;
  recordCount?: number;
}

export const BookingManagementPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [form] = Form.useForm();

  const statusMap: Record<string, { text: string, color: string }> = {
    pending: { text: '待确认', color: 'orange' },
    confirmed: { text: '已确认', color: 'blue' },
    checked_in: { text: '已核销', color: 'purple' },
    cancelled: { text: '已取消', color: 'red' },
    completed: { text: '已完成', color: 'green' },
  };

  const loadBookings = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/booking?tenantId=${tenantId}`);
      setBookings(response.data || []);
    } catch (error) {
      message.error('加载预约列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadExportJobs = async () => {
    if (!tenantId) return;
    try {
      const response = await apiClient.get(`/export/jobs?tenantId=${tenantId}`);
      setExportJobs(response.data?.jobs || []);
    } catch (error) {
      console.error('加载导出任务失败:', error);
    }
  };

  const handleExportBookings = async () => {
    if (!tenantId) return;
    
    try {
      setExportLoading(true);
      const response = await apiClient.post('/export/job', {
        tenantId,
        type: 'bookings',
        format: 'csv',
        filters: {} // 可以添加筛选条件
      });
      
      if (response.data) {
        message.success('导出任务已创建');
        // 开始轮询任务状态
        pollExportJob(response.data.id);
      }
    } catch (error) {
      message.error('创建导出任务失败');
    } finally {
      setExportLoading(false);
    }
  };

  const pollExportJob = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/export/job/${jobId}`);
        const job = response.data;
        
        if (job.status === 'completed') {
          clearInterval(interval);
          notification.success({
            message: '导出完成',
            description: (
              <div>
                <p>预约导出已完成</p>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(job.fileUrl, '_blank')}
                >
                  下载文件
                </Button>
              </div>
            ),
            duration: 0
          });
        } else if (job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(interval);
          notification.error({
            message: '导出失败',
            description: job.errorMessage || '导出任务执行失败',
            duration: 0
          });
        }
      } catch (error) {
        console.error('轮询导出任务状态失败:', error);
        clearInterval(interval);
      }
    }, 3000); // 每3秒轮询一次
  };

  useEffect(() => {
    loadBookings();
    loadExportJobs();
  }, [tenantId]);

  const columns = [
    { title: '资源', dataIndex: 'resourceName', key: 'resourceName' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '时段', dataIndex: 'timeSlot', key: 'timeSlot' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '电话', dataIndex: 'customerPhone', key: 'customerPhone' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (amount: number) => `¥${amount.toFixed(2)}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>
    },
    { title: '预约时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewBooking(record)}>查看</Button>
        </Space>
      ),
    },
  ];

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    form.setFieldsValue(booking);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedBooking(null);
  };

  const exportMenu = (
    <Menu>
      <Menu.Item key="export-bookings" onClick={handleExportBookings} icon={<ExportOutlined />}>
        导出预约
      </Menu.Item>
      {/* 可以添加更多导出选项 */}
    </Menu>
  );

  return (
    <div>
      <Title level={3}>预约管理</Title>
      <Paragraph type="secondary">管理所有预约，包括查看、更新状态等操作</Paragraph>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Input placeholder="资源名称" prefix={<SearchOutlined />} /></Col>
          <Col span={6}><Input placeholder="客户姓名" prefix={<SearchOutlined />} /></Col>
          <Col span={6}><Select placeholder="预约状态" style={{ width: '100%' }} allowClear>{Object.entries(statusMap).map(([key, val]) => <Select.Option key={key} value={key}>{val.text}</Select.Option>)}</Select></Col>
          <Col span={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadBookings} loading={loading}>刷新</Button>
              <Dropdown overlay={exportMenu} trigger={['click']}>
                <Button 
                  icon={<ExportOutlined />} 
                  loading={exportLoading}
                >
                  导出
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={bookings}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个预约` }}
        />
      </Card>

      <Modal title="预约详情" open={isModalVisible} onCancel={handleModalCancel} footer={[<Button key="back" onClick={handleModalCancel}>关闭</Button>]}>
        <Form form={form} layout="vertical">
          <Form.Item name="resourceName" label="资源"><Input disabled /></Form.Item>
          <Form.Item name="date" label="日期"><Input disabled /></Form.Item>
          <Form.Item name="timeSlot" label="时段"><Input disabled /></Form.Item>
          <Form.Item name="customerName" label="客户姓名"><Input disabled /></Form.Item>
          <Form.Item name="customerPhone" label="客户电话"><Input disabled /></Form.Item>
          <Form.Item name="totalAmount" label="预约金额"><InputNumber style={{ width: '100%' }} formatter={v => `¥ ${v}`} disabled /></Form.Item>
          <Form.Item name="status" label="预约状态"><Select disabled>{Object.entries(statusMap).map(([key, val]) => <Select.Option key={key} value={key}>{val.text}</Select.Option>)}</Select></Form.Item>
          <Form.Item name="createdAt" label="预约时间"><Input disabled /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};