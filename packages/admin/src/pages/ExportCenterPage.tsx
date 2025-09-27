import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  message,
  Typography,
  Row,
  Col,
  Select,
  Input
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined, DeleteOutlined, StopOutlined } from '@ant-design/icons';
import { apiClient } from '../services/apiClient';

const { Title, Paragraph } = Typography;

interface ExportJob {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fileName: string;
  fileUrl?: string;
  createdAt: string;
  recordCount?: number;
  errorMessage?: string;
}

const jobTypeMap: Record<string, string> = {
  orders: '订单',
  bookings: '预约',
  users: '用户',
  products: '产品',
  resources: '资源',
  audit_logs: '审计日志',
  usage_stats: '使用统计'
};

const jobStatusMap: Record<string, { text: string, color: string }> = {
  pending: { text: '待处理', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
  failed: { text: '失败', color: 'red' },
  cancelled: { text: '已取消', color: 'default' }
};

export const ExportCenterPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const loadExportJobs = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/export/jobs?tenantId=${tenantId}`);
      setExportJobs(response.data?.jobs || []);
    } catch (error) {
      message.error('加载导出任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiClient.post(`/export/job/${jobId}/cancel`);
      message.success('任务已取消');
      loadExportJobs();
    } catch (error) {
      message.error('取消任务失败');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await apiClient.delete(`/export/job/${jobId}`);
      message.success('任务已删除');
      loadExportJobs();
    } catch (error) {
      message.error('删除任务失败');
    }
  };

  const startPolling = () => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Start new polling interval
    const interval = setInterval(() => {
      loadExportJobs();
    }, 5000); // Poll every 5 seconds
    
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  useEffect(() => {
    loadExportJobs();
    startPolling();
    
    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [tenantId]);

  const columns = [
    { 
      title: '任务类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => jobTypeMap[type] || type
    },
    { 
      title: '文件名', 
      dataIndex: 'fileName', 
      key: 'fileName'
    },
    { 
      title: '记录数', 
      dataIndex: 'recordCount', 
      key: 'recordCount',
      render: (count: number) => count || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={jobStatusMap[status]?.color}>{jobStatusMap[status]?.text || status}</Tag>
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ExportJob) => (
        <Space size="middle">
          {record.status === 'completed' && record.fileUrl && (
            <Button 
              type="link" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record.fileUrl!, record.fileName)}
            >
              下载
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'processing') && (
            <Button 
              type="link" 
              icon={<StopOutlined />} 
              onClick={() => handleCancelJob(record.id)}
              danger
            >
              取消
            </Button>
          )}
          <Button 
            type="link" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteJob(record.id)}
            danger
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>导出中心</Title>
      <Paragraph type="secondary">管理所有导出任务，包括查看状态、下载文件等操作</Paragraph>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Input placeholder="文件名" prefix={<SearchOutlined />} /></Col>
          <Col span={6}>
            <Select placeholder="任务状态" style={{ width: '100%' }} allowClear>
              {Object.entries(jobStatusMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select placeholder="任务类型" style={{ width: '100%' }} allowClear>
              {Object.entries(jobTypeMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadExportJobs} loading={loading}>刷新</Button>
              <Button onClick={startPolling}>开始轮询</Button>
              <Button onClick={stopPolling}>停止轮询</Button>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={exportJobs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total: number) => `共 ${total} 个任务` }}
        />
      </Card>
    </div>
  );
};