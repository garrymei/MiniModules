import { useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Upload, 
  Button, 
  message, 
  Typography, 
  Row, 
  Col,
  Divider,
  Switch
} from 'antd'
import { UploadOutlined, SaveOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { TextArea } = Input

export const TenantSettingsPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const industryOptions = [
    { value: 'restaurant', label: '餐饮' },
    { value: 'fitness', label: '健身' },
    { value: 'retail', label: '零售' },
    { value: 'entertainment', label: '娱乐' },
    { value: 'membership', label: '会员制' }
  ]

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      console.log('保存设置:', values)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      message.success('设置保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    name: 'file',
    action: '/api/upload',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info: any) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>租户设置</Title>
        <Paragraph type="secondary">
          配置租户基本信息、主题样式和域名设置
        </Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          industry: 'restaurant',
          primaryColor: '#FF6A00',
          buttonRadius: 8,
          cardStyle: 'elevated',
          showSearch: true,
          imageAspectRatio: '1:1'
        }}
      >
        <Card title="基本信息" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="租户名称"
                rules={[{ required: true, message: '请输入租户名称' }]}
              >
                <Input placeholder="例如：美味餐厅" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="industry"
                label="行业类型"
                rules={[{ required: true, message: '请选择行业类型' }]}
              >
                <Select options={industryOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="租户描述"
          >
            <TextArea rows={3} placeholder="简要描述您的业务..." />
          </Form.Item>

          <Form.Item
            name="domain"
            label="自定义域名"
          >
            <Input placeholder="例如：restaurant.minimodules.com" />
          </Form.Item>
        </Card>

        <Card title="主题配置" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="primaryColor"
                label="主色调"
              >
                <Input type="color" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="buttonRadius"
                label="按钮圆角"
              >
                <Input type="number" min={0} max={20} addonAfter="px" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="cardStyle"
                label="卡片样式"
              >
                <Select>
                  <Select.Option value="flat">扁平</Select.Option>
                  <Select.Option value="elevated">立体</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="logo"
            label="Logo"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>上传Logo</Button>
            </Upload>
          </Form.Item>
        </Card>

        <Card title="界面配置" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="homepageLayout"
                label="首页布局"
              >
                <Select>
                  <Select.Option value="grid-2">2列网格</Select.Option>
                  <Select.Option value="grid-3">3列网格</Select.Option>
                  <Select.Option value="list">列表</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="imageAspectRatio"
                label="图片比例"
              >
                <Select>
                  <Select.Option value="1:1">1:1</Select.Option>
                  <Select.Option value="4:3">4:3</Select.Option>
                  <Select.Option value="16:9">16:9</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="showSearch"
                label="显示搜索"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="国际化设置">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="locale"
                label="语言"
              >
                <Select>
                  <Select.Option value="zh-CN">简体中文</Select.Option>
                  <Select.Option value="zh-TW">繁体中文</Select.Option>
                  <Select.Option value="en-US">English</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timezone"
                label="时区"
              >
                <Select>
                  <Select.Option value="Asia/Shanghai">北京时间</Select.Option>
                  <Select.Option value="Asia/Hong_Kong">香港时间</Select.Option>
                  <Select.Option value="America/New_York">纽约时间</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Button 
            type="primary" 
            size="large" 
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSave}
          >
            保存设置
          </Button>
        </div>
      </Form>
    </div>
  )
}
