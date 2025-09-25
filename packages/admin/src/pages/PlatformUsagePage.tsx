import { useMemo, useState } from 'react'
import { Card, Table, Tag, Typography, Row, Col, Progress, Space, DatePicker, Button, Statistic } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { RangePicker } = DatePicker

type UsageMetric = 'orders' | 'bookings' | 'users' | 'storage' | 'api_calls'

interface UsageRow {
  key: string
  metric: UsageMetric
  period: 'daily' | 'monthly'
  current: number
  limit?: number
  percentage: number
  isOverLimit: boolean
  updatedAt: string
}

const metricCopy: Record<UsageMetric, string> = {
  orders: '订单',
  bookings: '预约',
  users: '用户',
  storage: '存储',
  api_calls: 'API 调用',
}

const initialUsage: UsageRow[] = [
  {
    key: 'orders_daily',
    metric: 'orders',
    period: 'daily',
    current: 86,
    limit: 120,
    percentage: 72,
    isOverLimit: false,
    updatedAt: '2024-06-12 09:20',
  },
  {
    key: 'bookings_daily',
    metric: 'bookings',
    period: 'daily',
    current: 42,
    limit: 50,
    percentage: 84,
    isOverLimit: false,
    updatedAt: '2024-06-12 09:20',
  },
  {
    key: 'orders_monthly',
    metric: 'orders',
    period: 'monthly',
    current: 1460,
    limit: 1800,
    percentage: 81,
    isOverLimit: false,
    updatedAt: '2024-06-01 00:00',
  },
  {
    key: 'api_calls_daily',
    metric: 'api_calls',
    period: 'daily',
    current: 9800,
    limit: 10000,
    percentage: 98,
    isOverLimit: true,
    updatedAt: '2024-06-12 09:20',
  },
]

const quotaTips: Record<UsageMetric, string> = {
  orders: '订单创建达到上限后将返回 429 状态码',
  bookings: '预约创建达到上限后将阻止新预约',
  users: '用户配额用于团队版席位控制',
  storage: '存储配额用于限制媒体文件大小',
  api_calls: 'API 配额用于限制开放平台调用次数',
}

export const PlatformUsagePage = () => {
  const [usageRows, setUsageRows] = useState<UsageRow[]>(initialUsage)
  const [range, setRange] = useState<any>()

  const summary = useMemo(() => {
    const totalQuota = usageRows.filter((row) => row.limit).length
    const overLimit = usageRows.filter((row) => row.isOverLimit).length
    const avgUtilization = usageRows.reduce((acc, row) => acc + row.percentage, 0) / usageRows.length
    return {
      totalQuota,
      overLimit,
      avgUtilization: Math.round(avgUtilization),
    }
  }, [usageRows])

  const columns = [
    {
      title: '指标',
      dataIndex: 'metric',
      width: 160,
      render: (metric: UsageMetric) => <span>{metricCopy[metric]}</span>,
    },
    {
      title: '周期',
      dataIndex: 'period',
      width: 120,
      render: (period: string) => (period === 'daily' ? '每日' : '每月'),
    },
    {
      title: '当前用量',
      dataIndex: 'current',
      width: 140,
      render: (value: number) => <Statistic value={value} suffix="次" valueStyle={{ fontSize: 16 }} />,
    },
    {
      title: '配额上限',
      dataIndex: 'limit',
      width: 160,
      render: (limit: number | undefined) => (limit ? `${limit} 次` : '未限制'),
    },
    {
      title: '使用率',
      dataIndex: 'percentage',
      render: (_: number, record: UsageRow) => (
        <Progress
          percent={record.percentage}
          status={record.isOverLimit ? 'exception' : record.percentage > 85 ? 'active' : 'normal'}
          size={['large', 6]}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'isOverLimit',
      width: 140,
      render: (over: boolean, record: UsageRow) => (
        over ? (
          <Tag color="red">已超限</Tag>
        ) : record.percentage > 85 ? (
          <Tag color="orange">接近上限</Tag>
        ) : (
          <Tag color="green">正常</Tag>
        )
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 200,
    },
  ]

  const handleRefresh = () => {
    // 模拟刷新数据
    setUsageRows((rows) =>
      rows.map((row) => ({
        ...row,
        current: row.current + Math.round(Math.random() * 5),
        percentage: Math.min(100, row.percentage + Math.round(Math.random() * 3)),
        isOverLimit: row.limit ? row.current >= row.limit : false,
      })),
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3}>用量与配额</Title>
          <Paragraph type="secondary">
            追踪租户的关键指标用量，及时发现超限风险并制定配额策略
          </Paragraph>
        </div>
        <Space>
          <RangePicker value={range} onChange={setRange} />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="配置配额数" value={summary.totalQuota} suffix="项" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="已超限指标" value={summary.overLimit} suffix="项" valueStyle={{ color: summary.overLimit ? '#ff4d4f' : undefined }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="平均使用率" value={summary.avgUtilization} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Card title="指标详情">
        <Table
          rowKey="key"
          columns={columns}
          dataSource={usageRows}
          pagination={false}
        />
      </Card>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {usageRows.map((row) => (
          <Col span={12} key={`quota-tip-${row.key}`} style={{ marginBottom: 16 }}>
            <Card size="small" title={`${metricCopy[row.metric]} · ${row.period === 'daily' ? '每日限额' : '每月限额'}`}>
              <Space direction="vertical">
                <div>{quotaTips[row.metric]}</div>
                <div style={{ color: '#888' }}>当前进度：{row.percentage}%</div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default PlatformUsagePage
