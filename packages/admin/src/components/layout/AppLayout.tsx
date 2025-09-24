import { Layout, Menu, Typography, Button } from "antd"
import {
  AppstoreOutlined,
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  SettingOutlined,
  DatabaseOutlined,
  KeyOutlined,
  ControlOutlined,
  ShoppingOutlined,
  CalendarOutlined
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
    key: "platform",
    icon: <DatabaseOutlined />,
    label: "平台管理",
    children: [
      {
        key: "modules-catalog",
        icon: <AppstoreOutlined />,
        label: <Link to="/modules-catalog">模块目录</Link>,
      },
      {
        key: "tenant-entitlements",
        icon: <KeyOutlined />,
        label: <Link to="/tenant-entitlements">租户授权</Link>,
      },
    ],
  },
  {
    key: "tenant",
    icon: <TeamOutlined />,
    label: "租户管理",
    children: [
      {
        key: "tenants",
        icon: <TeamOutlined />,
        label: <Link to="/tenants">租户列表</Link>,
      },
      {
        key: "tenant-settings",
        icon: <SettingOutlined />,
        label: <Link to="/tenant-settings">租户设置</Link>,
      },
      {
        key: "module-config",
        icon: <ControlOutlined />,
        label: <Link to="/module-config">模块配置</Link>,
      },
      {
        key: "resources",
        icon: <AppstoreOutlined />,
        label: <Link to="/resources">资源管理</Link>,
      },
      {
        key: "orders",
        icon: <ShoppingOutlined />,
        label: <Link to="/orders">订单管理</Link>,
      },
      {
        key: "bookings",
        icon: <CalendarOutlined />,
        label: <Link to="/bookings">预约管理</Link>,
      },
    ],
  },
]

export const AppLayout: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith("/modules-catalog")) {
      return "modules-catalog"
    }
    if (location.pathname.startsWith("/tenant-entitlements")) {
      return "tenant-entitlements"
    }
    if (location.pathname.startsWith("/tenants")) {
      return "tenants"
    }
    if (location.pathname.startsWith("/tenant-settings")) {
      return "tenant-settings"
    }
    if (location.pathname.startsWith("/module-config")) {
      return "module-config"
    }
    if (location.pathname.startsWith("/resources")) {
      return "resources"
    }
    if (location.pathname.startsWith("/orders")) {
      return "orders"
    }
    if (location.pathname.startsWith("/bookings")) {
      return "bookings"
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
        <Header style={{ padding: "0 24px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography.Title level={3} style={{ margin: "12px 0" }}>
            MiniModules 管理后台
          </Typography.Title>
          <div>
            <span style={{ marginRight: 16 }}>欢迎，{user?.name ?? "管理员"}</span>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              登出
            </Button>
          </div>
        </Header>
        <Content style={{ margin: "24px", overflow: "initial" }}>
          <div style={{ padding: 24, background: "#fff", minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}