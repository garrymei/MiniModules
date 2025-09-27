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
  message,
  Typography,
  Row,
  Col,
  Select,
  Divider,
  Timeline,
  Alert,
  Tooltip
} from 'antd';
import { 
  EyeOutlined, 
  RollbackOutlined, 
  DiffOutlined,
  SendOutlined,
  CheckOutlined,
  HistoryOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient'; // Assuming you have this

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

// Interfaces matching the DTOs
interface ConfigRevision {
  id: string;
  tenantId: string;
  version: string;
  status: 'draft' | 'submitted' | 'approved' | 'published' | 'rejected';
  changeReason?: string;
  submittedBy?: string;
  approvedBy?: string;
  reviewNote?: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConfigDiff {
  path: string;
  operation: 'add' | 'remove' | 'modify';
  oldValue?: any;
  newValue?: any;
}

export const ConfigVersioningPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>(); // Get tenantId from URL
  const [revisions, setRevisions] = useState<ConfigRevision[]>([]);
  const [currentPublishedVersion, setCurrentPublishedVersion] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [isDiffModalVisible, setIsDiffModalVisible] = useState(false);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRollbackModalVisible, setIsRollbackModalVisible] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<ConfigRevision | null>(null);
  const [diffTargetRevision, setDiffTargetRevision] = useState<ConfigRevision | null>(null);
  const [configDiff, setConfigDiff] = useState<ConfigDiff[]>([]);
  const [form] = Form.useForm();

  const statusMap: Record<string, { text: string, color: string }> = {
    draft: { text: '草稿', color: 'default' },
    submitted: { text: '待审核', color: 'processing' },
    approved: { text: '已审核', color: 'success' },
    published: { text: '已发布', color: 'green' },
    rejected: { text: '已拒绝', color: 'red' },
  };

  const loadRevisions = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/config/revisions/${tenantId}`);
      setRevisions(response.data.revisions || []);
      setCurrentPublishedVersion(response.data.currentPublishedVersion);
    } catch (error) {
      console.error('加载版本历史失败:', error);
      message.error('加载版本历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, [tenantId]);

  const handleSubmitForReview = async (values: any) => {
    if (!tenantId) return;
    try {
      await apiClient.post(`/admin/config/submit/${tenantId}`, { changeReason: values.reviewNote });
      message.success('配置已提交审核');
      setIsSubmitModalVisible(false);
      form.resetFields();
      loadRevisions();
    } catch (error) {
      message.error('提交失败，请重试');
    }
  };

  const handleApprove = async (values: any) => {
    if (!selectedRevision) return;
    try {
      await apiClient.post(`/admin/config/approve/${selectedRevision.id}`, { reviewNote: values.reviewNote });
      message.success('配置审核通过');
      setIsApproveModalVisible(false);
      form.resetFields();
      loadRevisions();
    } catch (error) {
      message.error('审核失败，请重试');
    }
  };

  const handlePublish = async (revision: ConfigRevision) => {
    try {
      await apiClient.post(`/admin/config/publish/${revision.id}`);
      message.success('配置已发布');
      loadRevisions();
    } catch (error) {
      message.error('发布失败，请重试');
    }
  };

  const handleRollback = async (values: any) => {
    if (!selectedRevision) return;
    try {
      await apiClient.post(`/admin/config/rollback/${selectedRevision.tenantId}/${selectedRevision.version}`, { reason: values.reason });
      message.success('已创建回滚草稿，请提交审核');
      setIsRollbackModalVisible(false);
      form.resetFields();
      loadRevisions();
    } catch (error) {
      message.error('回滚失败，请重试');
    }
  };

  const handleViewDiff = async (revision1: ConfigRevision, revision2: ConfigRevision) => {
    try {
      const response = await apiClient.get(`/admin/config/diff/${tenantId}/${revision1.version}/${revision2.version}`);
      setConfigDiff(response.data || []);
      setDiffTargetRevision(revision2);
      setIsDiffModalVisible(true);
    } catch (error) {
      message.error('获取差异失败');
    }
  };

  const columns = [
    { title: '版本', dataIndex: 'version', key: 'version', width: 80, render: (v: string) => <Text strong>v{v}</Text> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>
    },
    { title: '变更原因', dataIndex: 'changeReason', key: 'changeReason', ellipsis: true },
    { title: '审核备注', dataIndex: 'reviewNote', key: 'reviewNote', ellipsis: true },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 180, render: (d: string) => d ? new Date(d).toLocaleString() : '-' },
    { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 180, render: (d: string) => d ? new Date(d).toLocaleString() : '-' },
    {
      title: '操作', key: 'actions', width: 200,
      render: (_: any, record: ConfigRevision) => (
        <Space>
          {record.status === 'submitted' && (
            <Tooltip title="审核">
              <Button type="text" icon={<CheckOutlined />} size="small" onClick={() => { setSelectedRevision(record); setIsApproveModalVisible(true); }} />
            </Tooltip>
          )}
          {record.status === 'approved' && (
            <Tooltip title="发布">
              <Button type="text" icon={<SendOutlined />} size="small" onClick={() => handlePublish(record)} />
            </Tooltip>
          )}
          {record.status === 'published' && record.version !== currentPublishedVersion && (
            <Tooltip title="回滚到此版本">
              <Button type="text" icon={<HistoryOutlined />} size="small" onClick={() => { setSelectedRevision(record); setIsRollbackModalVisible(true); }} />
            </Tooltip>
          )}
          <Tooltip title="与线上版本对比">
            <Button 
              type="text" 
              icon={<DiffOutlined />} 
              size="small"
              onClick={() => {
                const currentRevision = revisions.find(r => r.version === currentPublishedVersion);
                if (currentRevision && currentRevision.id !== record.id) {
                  handleViewDiff(currentRevision, record);
                }
              }}
              disabled={!currentPublishedVersion || record.version === currentPublishedVersion}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3}>配置版本管理</Title>
      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>版本历史</Title>
              <Space>
                <Button type="primary" icon={<SendOutlined />} onClick={() => setIsSubmitModalVisible(true)}>提交审核</Button>
                <Button icon={<FileTextOutlined />} onClick={loadRevisions} loading={loading}>刷新</Button>
              </Space>
            </div>
            <Table dataSource={revisions} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="当前状态">
            <Timeline>
                <Timeline.Item color="green">已发布版本: v{currentPublishedVersion || 'N/A'}</Timeline.Item>
                <Timeline.Item color="blue">待审核: {revisions.filter(r => r.status === 'submitted').length}</Timeline.Item>
                <Timeline.Item color="default">草稿: {revisions.filter(r => r.status === 'draft').length}</Timeline.Item>
            </Timeline>
            <Divider />
            <Alert message="配置发布流程" description={<div><p>1. 在租户设置页修改配置并保存草稿</p><p>2. 在此页面提交草稿进入审核</p><p>3. 平台管理员审核通过后方可发布</p><p>4. 可随时回滚到任一历史已发布版本</p></div>} type="info" showIcon />
          </Card>
        </Col>
      </Row>

      <Modal title="提交配置审核" open={isSubmitModalVisible} onCancel={() => setIsSubmitModalVisible(false)} footer={null}>
        <Form form={form} onFinish={handleSubmitForReview} layout="vertical">
          <Form.Item name="changeReason" label="变更原因" rules={[{ required: true, message: '请输入变更原因' }]}>
            <TextArea rows={4} placeholder="请说明本次配置变更的内容和原因..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}><Space><Button onClick={() => setIsSubmitModalVisible(false)}>取消</Button><Button type="primary" htmlType="submit">提交审核</Button></Space></Form.Item>
        </Form>
      </Modal>

      <Modal title="审核配置" open={isApproveModalVisible} onCancel={() => setIsApproveModalVisible(false)} footer={null}>
        <Form form={form} onFinish={handleApprove} layout="vertical">
          <Form.Item name="reviewNote" label="审核备注" initialValue="配置审核通过">
            <TextArea rows={4} placeholder="请输入审核意见..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}><Space><Button onClick={() => setIsApproveModalVisible(false)}>取消</Button><Button type="primary" htmlType="submit" icon={<CheckOutlined />}>审核通过</Button></Space></Form.Item>
        </Form>
      </Modal>

      <Modal title={`回滚到版本 v${selectedRevision?.version}`} open={isRollbackModalVisible} onCancel={() => setIsRollbackModalVisible(false)} footer={null}>
        <Alert message="回滚操作将创建一个新的草稿，请确认。" type="warning" showIcon style={{ marginBottom: 16 }} />
        <Form form={form} onFinish={handleRollback} layout="vertical">
          <Form.Item name="reason" label="回滚原因" rules={[{ required: true, message: '请输入回滚原因' }]}>
            <TextArea rows={4} placeholder="请说明回滚的原因..." />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}><Space><Button onClick={() => setIsRollbackModalVisible(false)}>取消</Button><Button type="primary" htmlType="submit" icon={<HistoryOutlined />}>确认回滚</Button></Space></Form.Item>
        </Form>
      </Modal>

      <Modal title={`与线上版本 v${currentPublishedVersion} 的差异`} open={isDiffModalVisible} onCancel={() => setIsDiffModalVisible(false)} width={800} footer={[<Button key="close" onClick={() => setIsDiffModalVisible(false)}>关闭</Button>]}>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {configDiff.length > 0 ? configDiff.map((diff, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16}>
                <Col span={6}><Text strong>路径:</Text><br /><Text code>{diff.path}</Text></Col>
                <Col span={4}><Text strong>操作:</Text><br /><Tag color={diff.operation === 'add' ? 'green' : diff.operation === 'remove' ? 'red' : 'blue'}>{diff.operation}</Tag></Col>
                <Col span={7}><Text strong>原值 (线上):</Text><br /><Text code>{JSON.stringify(diff.oldValue)}</Text></Col>
                <Col span={7}><Text strong>新值 (v{diffTargetRevision?.version}):</Text><br /><Text code>{JSON.stringify(diff.newValue)}</Text></Col>
              </Row>
            </Card>
          )) : <Text>与线上版本无差异。</Text>}
        </div>
      </Modal>
    </div>
  );
};