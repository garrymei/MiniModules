import type { FC } from "react"
import { Card, Col, Row, Statistic, Typography } from "antd"
import { CalendarOutlined, ShoppingCartOutlined, TeamOutlined } from "@ant-design/icons"

import { useAuth } from "../hooks/useAuth"

const { Title, Paragraph } = Typography

export const DashboardPage: FC = () => {
  const { user } = useAuth()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          Welcome back, {user?.name ?? "Admin"}
        </Title>
        <Paragraph type="secondary">
          Monitor tenant activity, configure modules, and manage resources from this control center.
        </Paragraph>
      </div>
      <Row gutter={24}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Active Tenants" value={6} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Enabled Modules" value={14} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Upcoming Bookings" value={23} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
