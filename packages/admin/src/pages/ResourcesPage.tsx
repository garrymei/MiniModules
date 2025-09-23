import { Card, Empty, Typography } from "antd"

const { Title, Paragraph } = Typography

export const ResourcesPage = () => {
  return (
    <Card>
      <Title level={3}>Resources</Title>
      <Paragraph type="secondary">
        Products and venue management will live here.
      </Paragraph>
      <Empty description="Resource management is on the roadmap." style={{ marginTop: 32 }} />
    </Card>
  )
}
