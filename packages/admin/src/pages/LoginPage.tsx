import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import { Alert, Button, Card, Form, Input, Typography } from "antd"
import { LockOutlined, MailOutlined } from "@ant-design/icons"
import { useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../hooks/useAuth"
import type { LoginPayload } from "../types/auth"

const { Title, Paragraph } = Typography

const layoutStyles: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #1d4ed8 0%, #9333ea 100%)",
  padding: "32px",
}

export const LoginPage = () => {
  const [error, setError] = useState<string | null>(null)
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (values: LoginPayload) => {
    setError(null)
    try {
      await login(values)
      const redirectPath = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard"
      navigate(redirectPath, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
    }
  }

  return (
    <div style={layoutStyles}>
      <Card style={{ width: 420, padding: "8px 16px" }}>
        <Title level={3}>MiniModules Admin</Title>
        <Paragraph type="secondary">Sign in to manage tenants, modules, and resources.</Paragraph>
        {error ? <Alert type="error" message={error} style={{ marginBottom: 16 }} /> : null}
        <Form<LoginPayload>
          layout="vertical"
          name="loginForm"
          onFinish={handleSubmit}
          initialValues={{ email: "admin@example.com", password: "admin123" }}
          requiredMark={false}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
