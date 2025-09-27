import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  message, 
  Typography, 
  Row, 
  Col,
  Spin,
  Image,
  Space,
  Modal
} from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { apiClient, getAuthToken } from '../services/apiClient';
import { API_BASE_URL } from '../config';
import { useI18n } from '../contexts/I18nContext';
import { ImageUpload } from '../components/ImageUpload';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export const TenantSettingsPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [submitForm] = Form.useForm();

  useEffect(() => {
    const fetchLatestConfig = async () => {
      if (!tenantId) return;
      try {
        setPageLoading(true);
        const response = await apiClient.get(`/api/tenant-config/${tenantId}`);
        if (response.data) {
          form.setFieldsValue(response.data);
        }
      } catch (error) {
        message.error(t('messages.loadFailed'));
      } finally {
        setPageLoading(false);
      }
    };
    fetchLatestConfig();
  }, [tenantId, form, t]);

  const handleSaveDraft = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const values = await form.validateFields();
      await apiClient.post(`/admin/config/draft/${tenantId}`, values);
      message.success(t('tenantSettings.draftSaveSuccess'));
    } catch (error) {
      message.error(t('tenantSettings.draftSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const showSubmitModal = () => {
    setIsSubmitModalVisible(true);
  };

  const handleCancelSubmit = () => {
    setIsSubmitModalVisible(false);
    submitForm.resetFields();
  };

  const handleConfirmSubmit = async (submitValues: { changeReason: string }) => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const values = await form.validateFields();
      // First, save the latest changes as a draft
      await apiClient.post(`/admin/config/draft/${tenantId}`, values);
      // Then, submit that draft for review
      await apiClient.post(`/admin/config/submit/${tenantId}`, { changeReason: submitValues.changeReason });
      
      message.success(t('tenantSettings.submitSuccess'));
      handleCancelSubmit();
    } catch (error) {
        message.error(t('messages.operationFailed'));
    } finally {
        setLoading(false);
    }
  }

  if (pageLoading) {
      return <Spin size="large" />;
  }

  return (
    <div>
      <Title level={3}>{t('tenantSettings.title')}</Title>
      <Paragraph type="secondary">{t('tenantSettings.description')}</Paragraph>
      <Form form={form} layout="vertical">
        <Card title={t('tenantSettings.basicInfo')} style={{ marginBottom: 24 }}>
            <Form.Item name="name" label={t('tenantSettings.tenantName')} rules={[{ required: true }]}>
                <Input placeholder={t('tenantSettings.tenantNamePlaceholder')} />
            </Form.Item>
        </Card>

        <Card title={t('tenantSettings.themeSettings')} style={{ marginBottom: 24 }}>
            <Form.Item name={['theme', 'primaryColor']} label={t('theme.primaryColor')}>
                <Input type="color" />
            </Form.Item>
            <Form.Item name={['theme', 'logo']} label={t('theme.logo')} shouldUpdate>
                <ImageUpload />
            </Form.Item>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Space size="large">
            <Button size="large" icon={<SaveOutlined />} loading={loading} onClick={handleSaveDraft}>
                {t('tenantSettings.saveDraft')}
            </Button>
            <Button type="primary" size="large" icon={<SendOutlined />} loading={loading} onClick={showSubmitModal}>
                {t('tenantSettings.saveAndSubmit')}
            </Button>
          </Space>
        </div>
      </Form>

      <Modal
        title={t('tenantSettings.submitModalTitle')}
        open={isSubmitModalVisible}
        onCancel={handleCancelSubmit}
        footer={null}
      >
        <Form form={submitForm} onFinish={handleConfirmSubmit} layout="vertical">
            <Form.Item name="changeReason" label={t('tenantSettings.changeReason')} rules={[{ required: true, message: t('validation.required') }]}>
                <TextArea rows={4} placeholder={t('tenantSettings.changeReasonPlaceholder')} />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
                <Space>
                    <Button onClick={handleCancelSubmit}>{t('common.cancel')}</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>{t('common.submit')}</Button>
                </Space>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}