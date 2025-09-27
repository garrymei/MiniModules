import React, { useState, useEffect } from 'react';
import { Card, Switch, Form, Button, message, Typography, Divider, Alert, Space, Tag, Table, Modal, Input, Select } from 'antd';
import { SettingOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { apiClient } from '../services/apiClient';

const { Title, Paragraph } = Typography;
const { Option } = Select;

// Matches the backend ApprovalConfig entity
interface ApprovalConfig {
  id: string;
  scope: string;
  type: string;
  moduleKey?: string;
  tenantId?: string;
  status: 'enabled' | 'disabled' | 'gradual_rollout';
  approvalRoles: string[];
  requiredApprovals: number;
  updatedAt: string;
}

export const ApprovalWorkflowPage = () => {
  const [form] = Form.useForm();
  const [configs, setConfigs] = useState<ApprovalConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApprovalConfig | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/platform/approval/configs');
      setConfigs(response.data || []);
    } catch (error) {
      message.error('加载审批配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (config: ApprovalConfig, enabled: boolean) => {
    try {
      await apiClient.post('/platform/approval/toggle', {
        scope: config.scope,
        type: config.type,
        moduleKey: config.moduleKey,
        tenantId: config.tenantId,
        enabled,
      });
      message.success(`审批流程已${enabled ? '启用' : '禁用'}`);
      loadConfigs(); // Refresh list
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = (config: ApprovalConfig) => {
    setEditingConfig(config);
    form.setFieldsValue(config);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!editingConfig) return;

      await apiClient.put(`/platform/approval/configs/${editingConfig.id}`, values);
      message.success('配置更新成功');
      setIsModalVisible(false);
      loadConfigs(); // Refresh list
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    { title: '范围', dataIndex: 'scope', key: 'scope', render: (scope: string) => <Tag color="cyan">{scope}</Tag> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color="geekblue">{type}</Tag> },
    { title: '模块', dataIndex: 'moduleKey', key: 'moduleKey', render: (key?: string) => key ? <Tag>{key}</Tag> : '通用' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ApprovalConfig) => (
        <Switch
          checked={status === 'enabled'}
          onChange={(checked) => handleToggleStatus(record, checked)}
          loading={loading}
        />
      ),
    },
    { title: '需要审批数', dataIndex: 'requiredApprovals', key: 'requiredApprovals' },
    { 
      title: '审批角色', 
      dataIndex: 'approvalRoles', 
      key: 'approvalRoles', 
      render: (roles: string[]) => roles?.map(role => <Tag color="purple" key={role}>{role}</Tag>)
    },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', render: (date: string) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ApprovalConfig) => <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
    },
  ];

  return (
    <div>
      <Title level={2}><SettingOutlined /> 审批流程配置</Title>
      <Paragraph>配置平台级别的审批流程，控制租户配置发布的审批机制。</Paragraph>
      <Alert message="所有审批相关的操作都会被记录在审计日志中。" type="info" showIcon style={{ marginBottom: 24 }} />

      <Card title="模块审批配置">
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingConfig ? '编辑审批配置' : '新建审批配置'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="范围"><Input disabled value={editingConfig?.scope} /></Form.Item>
          <Form.Item label="类型"><Input disabled value={editingConfig?.type} /></Form.Item>
          <Form.Item name="requiredApprovals" label="需要审批数" rules={[{ required: true, message: '请输入需要几人审批' }]}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="approvalRoles" label="审批角色" rules={[{ required: true, message: '请至少选择一个审批角色' }]}>
            <Select mode="tags" placeholder="输入角色名后按回车添加" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};