import { Card, Empty, Typography } from "antd"

const { Title, Paragraph } = Typography

export const TenantsPage = () => {
  return (
    <Card>
      <Title level={3}>Tenants</Title>
      <Paragraph type="secondary">
        Manage tenant profiles, industries, and module activations here.
      </Paragraph>
      <Empty description="Tenant management is coming next." style={{ marginTop: 32 }} />
    </Card>
  )
}
