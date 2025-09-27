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
interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  metadata?: { customerName?: string };
  totalAmount: number;
  status: 'pending' | 'paid' | 'used' | 'refunding' | 'refunded' | 'cancelled';
  orderType: 'dine_in' | 'takeout';
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

export const OrderManagementPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [form] = Form.useForm();

  const statusMap: Record<string, { text: string, color: string }> = {
    pending: { text: '待支付', color: 'orange' },
    paid: { text: '已支付', color: 'blue' },
    used: { text: '已核销', color: 'purple' },
    refunding: { text: '退款中', color: 'gold' },
    refunded: { text: '已退款', color: 'default' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' },
  };

  const orderTypeMap: Record<string, string> = {
    dine_in: '堂食',
    takeout: '外卖',
  };

  const loadOrders = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/ordering/orders?tenantId=${tenantId}`);
      setOrders(response.data || []);
    } catch (error) {
      message.error('加载订单列表失败');
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

  const handleExportOrders = async () => {
    if (!tenantId) return;
    
    try {
      setExportLoading(true);
      const response = await apiClient.post('/export/job', {
        tenantId,
        type: 'orders',
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
                <p>订单导出已完成</p>
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
    loadOrders();
    loadExportJobs();
  }, [tenantId]);

  const columns = [
    { title: '订单号', dataIndex: 'orderNumber', key: 'orderNumber' },
    {
      title: '客户',
      dataIndex: ['metadata', 'customerName'],
      key: 'customer',
      render: (name: string, record: Order) => name || record.userId || '-',
    },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (amount: number) => `¥${amount.toFixed(2)}` },
    { 
      title: '订单类型', 
      dataIndex: 'orderType', 
      key: 'orderType', 
      render: (type: string) => <Tag color={type === 'dine_in' ? 'blue' : 'green'}>{orderTypeMap[type] || type}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>
    },
    { title: '下单时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewOrder(record)}>查看</Button>
        </Space>
      ),
    },
  ];

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    form.setFieldsValue({ ...order, customer: order.metadata?.customerName });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
  };

  const exportMenu = (
    <Menu>
      <Menu.Item key="export-orders" onClick={handleExportOrders} icon={<ExportOutlined />}>
        导出订单
      </Menu.Item>
      {/* 可以添加更多导出选项 */}
    </Menu>
  );

  return (
    <div>
      <Title level={3}>订单管理</Title>
      <Paragraph type="secondary">管理所有订单，包括查看、更新状态等操作</Paragraph>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Input placeholder="订单号" prefix={<SearchOutlined />} /></Col>
          <Col span={6}><Input placeholder="客户信息" prefix={<SearchOutlined />} /></Col>
          <Col span={6}><Select placeholder="订单状态" style={{ width: '100%' }} allowClear>{Object.entries(statusMap).map(([key, val]) => <Select.Option key={key} value={key}>{val.text}</Select.Option>)}</Select></Col>
          <Col span={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadOrders} loading={loading}>刷新</Button>
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
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个订单` }}
        />
      </Card>

      <Modal title="订单详情" open={isModalVisible} onCancel={handleModalCancel} footer={[<Button key="back" onClick={handleModalCancel}>关闭</Button>]}>
        <Form form={form} layout="vertical">
          <Form.Item name="orderNumber" label="订单号"><Input disabled /></Form.Item>
          <Form.Item name="customer" label="客户"><Input disabled /></Form.Item>
          <Form.Item name="totalAmount" label="订单金额"><InputNumber style={{ width: '100%' }} formatter={v => `¥ ${v}`} disabled /></Form.Item>
          <Form.Item name="orderType" label="订单类型"><Select disabled><Select.Option value="dine_in">堂食</Select.Option><Select.Option value="takeout">外卖</Select.Option></Select></Form.Item>
          <Form.Item name="status" label="订单状态"><Select disabled>{Object.entries(statusMap).map(([key, val]) => <Select.Option key={key} value={key}>{val.text}</Select.Option>)}</Select></Form.Item>
          <Form.Item name="createdAt" label="下单时间"><Input disabled /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};