import { Layout, Menu, Typography, Button } from "antd"
import {
  AppstoreOutlined,
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
} from "@ant-design/icons"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useMemo, type FC } from "react"

import { useAuth } from "../../hooks/useAuth"

const { Header, Content, Sider } = Layout

const menuItems = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: <Link to="/dashboard">Dashboard</Link>,
  },
  {
    key: "tenants",
    icon: <TeamOutlined />,
    label: <Link to="/tenants">Tenants</Link>,
  },
  {
    key: "resources",
    icon: <AppstoreOutlined />,
    label: <Link to="/resources">Resources</Link>,
  },
]

export const AppLayout: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith("/tenants")) {
      return "tenants"
    }
    if (location.pathname.startsWith("/resources")) {
      return "resources"
    }
    return "dashboard"
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="logo" style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>
          MiniModules
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
            background: "#fff",
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            Admin Console
          </Typography.Title>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Typography.Text strong>{user?.name ?? "User"}</Typography.Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Header>
        <Content style={{ margin: "24px", minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
