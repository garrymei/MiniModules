
import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Table, Space, Tag, Modal, Form, Input, Select, DatePicker, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import { ImageUpload } from '../components/ImageUpload';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkType: 'product' | 'resource' | 'url' | 'article' | 'none';
  linkPayload?: any;
  sort: number;
  status: 'draft' | 'published' | 'archived';
  startAt?: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Article {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: string;
  coverImage?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  sort: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CMSManagementPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [bannerForm] = Form.useForm();
  const [articleForm] = Form.useForm();

  const tenantId = 'current-tenant'; // In a real app, get this from context

  useEffect(() => {
    loadBanners();
    loadArticles();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/cms/banners?tenantId=${tenantId}`);
      setBanners(response.data);
    } catch (error) {
      message.error('加载轮播图失败');
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/cms/articles?tenantId=${tenantId}`);
      setArticles(response.data || []);
    } catch (error) {
      message.error('加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanner = async (values: any) => {
    try {
      const bannerData = {
        ...values,
        tenantId,
        startAt: values.startAt?.toISOString(),
        endAt: values.endAt?.toISOString(),
      };

      if (editingBanner) {
        await apiClient.put(`/admin/cms/banners/${editingBanner.id}`, bannerData);
        message.success('轮播图更新成功');
      } else {
        await apiClient.post('/admin/cms/banners', bannerData);
        message.success('轮播图创建成功');
      }

      setBannerModalVisible(false);
      loadBanners();
    } catch (error) {
      message.error('保存轮播图失败');
    }
  };

    const handleSaveArticle = async (values: any) => {
    try {
      const articleData = {
        ...values,
        tenantId,
        publishedAt: values.publishedAt?.toISOString(),
      };

      if (editingArticle) {
        await apiClient.put(`/admin/cms/articles/${editingArticle.id}`, articleData);
        message.success('文章更新成功');
      } else {
        await apiClient.post('/admin/cms/articles', articleData);
        message.success('文章创建成功');
      }

      setArticleModalVisible(false);
      loadArticles();
    } catch (error) {
      message.error('保存文章失败');
    }
  };

  // ... other handlers

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs defaultActiveKey="banners">
          <TabPane tab="轮播图管理" key="banners">
            {/* ... Banner Table ... */}
          </TabPane>
          <TabPane tab="文章管理" key="articles">
            {/* ... Article Table ... */}
          </TabPane>
        </Tabs>
      </Card>

      <Modal title={editingBanner ? '编辑轮播图' : '新建轮播图'} open={bannerModalVisible} onCancel={() => setBannerModalVisible(false)} footer={null} width={800}>
        <Form form={bannerForm} layout="vertical" onFinish={handleSaveBanner}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input placeholder="请输入标题" /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={3} placeholder="请输入描述" /></Form.Item>
          <Form.Item name="imageUrl" label="图片" rules={[{ required: true, message: '请上传图片' }]}><ImageUpload /></Form.Item>
          <Form.Item name="linkType" label="链接类型" rules={[{ required: true, message: '请选择链接类型' }]}>
            <Select placeholder="请选择链接类型">
              <Option value="none">无跳转</Option>
              <Option value="product">商品</Option>
              <Option value="resource">场地</Option>
              <Option value="article">文章</Option>
              <Option value="url">外部链接</Option>
            </Select>
          </Form.Item>
          <Form.Item name="linkPayload" label="链接数据"><TextArea rows={3} placeholder='请输入链接数据（JSON格式，例如：{"id":"prod_123"} 或 {"url":"https://example.com"})' /></Form.Item>
          <Form.Item name="sort" label="排序"><Input type="number" placeholder="排序数字，越小越靠前" /></Form.Item>
          <Form.Item name="status" label="状态" initialValue="draft">
            <Select><Option value="draft">草稿</Option><Option value="published">已发布</Option><Option value="archived">已归档</Option></Select>
          </Form.Item>
          <Form.Item name="startAt" label="开始时间"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="endAt" label="结束时间"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editingBanner ? '更新' : '创建'}</Button><Button onClick={() => setBannerModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingArticle ? '编辑文章' : '新建文章'} open={articleModalVisible} onCancel={() => setArticleModalVisible(false)} footer={null} width={800}>
        <Form form={articleForm} layout="vertical" onFinish={handleSaveArticle}>
            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input placeholder="请输入标题" /></Form.Item>
            <Form.Item name="summary" label="摘要"><TextArea rows={3} placeholder="请输入摘要" /></Form.Item>
            <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}><TextArea rows={10} placeholder="请输入内容" /></Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true, message: '请输入分类' }]}><Input placeholder="请输入分类" /></Form.Item>
            <Form.Item name="coverImage" label="封面图片"><ImageUpload /></Form.Item>
            <Form.Item name="tags" label="标签"><Select mode="tags" placeholder="请输入标签" /></Form.Item>
            <Form.Item name="status" label="状态" initialValue="draft">
                <Select><Option value="draft">草稿</Option><Option value="published">已发布</Option><Option value="archived">已归档</Option></Select>
            </Form.Item>
            <Form.Item name="publishedAt" label="发布时间"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
            <Form.Item><Space><Button type="primary" htmlType="submit">{editingArticle ? '更新' : '创建'}</Button><Button onClick={() => setArticleModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CMSManagementPage;
