import { Layout, Menu, Typography, Button, Space, Spin } from "antd"
import type { MenuProps } from "antd"
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
  CalendarOutlined,
  FundOutlined,
  ApiOutlined,
} from "@ant-design/icons"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useMemo, type FC } from "react"

import { useAuth } from "../../hooks/useAuth"
import { useI18n } from "../../contexts/I18nContext"
import { LanguageSwitcher } from "../LanguageSwitcher"

const { Header, Content, Sider } = Layout

interface MenuItemConfig {
  key: string
  icon?: React.ReactNode
  label?: React.ReactNode
  requiredModule?: string | null
  children?: MenuItemConfig[]
}

const rawMenuItems: MenuItemConfig[] = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: <Link to="/dashboard">Dashboard</Link>,
    requiredModule: null,
  },
  {
    key: "platform",
    icon: <DatabaseOutlined />,
    label: "平台管理",
    requiredModule: null,
    children: [
      {
        key: "modules-catalog",
        icon: <AppstoreOutlined />,
        label: <Link to="/modules-catalog">模块目录</Link>,
        requiredModule: null,
      },
      {
        key: "tenant-entitlements",
        icon: <KeyOutlined />,
        label: <Link to="/tenant-entitlements">租户授权</Link>,
        requiredModule: null,
      },
      {
        key: "platform-usage",
        icon: <FundOutlined />,
        label: <Link to="/platform-usage">用量与配额</Link>,
        requiredModule: "usage",
      },
      {
        key: "platform-webhooks",
        icon: <ApiOutlined />,
        label: <Link to="/platform-webhooks">Webhook 管理</Link>,
        requiredModule: "notify",
      },
    ],
  },
  {
    key: "tenant",
    icon: <TeamOutlined />,
    label: "租户管理",
    requiredModule: null,
    children: [
      {
        key: "tenants",
        icon: <TeamOutlined />,
        label: <Link to="/tenants">租户列表</Link>,
        requiredModule: null,
      },
      {
        key: "tenant-settings",
        icon: <SettingOutlined />,
        label: <Link to="/tenant-settings">租户设置</Link>,
        requiredModule: null,
      },
      {
        key: "verification",
        icon: <QrcodeOutlined />,
        label: <Link to="/verification">扫码核销</Link>,
        requiredModule: "booking", // Or a more generic module if it handles more than bookings
      },
      {
        key: "resources",
        icon: <AppstoreOutlined />,
        label: "资源管理",
        requiredModule: null,
        children: [
          {
            key: "resources",
            label: <Link to="/resources">资源管理</Link>,
            requiredModule: "booking",
          },
          {
            key: "cms",
            label: <Link to="/cms">CMS管理</Link>,
            requiredModule: "cms",
          },
        ],
      },
      {
        key: "orders",
        icon: <ShoppingOutlined />,
        label: <Link to="/orders">订单管理</Link>,
        requiredModule: "ordering",
      },
      {
        key: "bookings",
        icon: <CalendarOutlined />,
        label: <Link to="/bookings">预约管理</Link>,
        requiredModule: "booking",
      },
    ],
  },
]

const mapMenuItems = (items: MenuItemConfig[]): NonNullable<MenuProps['items']> =>
  items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children ? mapMenuItems(item.children) : undefined,
  }))

const filterMenuItems = (items: MenuItemConfig[], hasModule: (moduleKey: string | null | undefined) => boolean): MenuItemConfig[] => {
  return items
    .map((item) => {
      const matches = hasModule(item.requiredModule)
      const children = item.children ? filterMenuItems(item.children, hasModule) : undefined
      const shouldInclude = matches || (children && children.length > 0)
      if (!shouldInclude) {
        return null
      }
      return {
        ...item,
        children,
      }
    })
    .filter(Boolean) as MenuItemConfig[]
}

export const AppLayout: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasModule, enabledModules, activeTenantId, isLoading } = useAuth()
  const { t } = useI18n()

  const menuItems = useMemo(() => {
    const predicate = (moduleKey: string | null | undefined) => {
      if (!moduleKey) return true
      return hasModule(moduleKey)
    }
    return filterMenuItems(rawMenuItems, predicate)
  }, [hasModule, enabledModules])

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
    if (location.pathname.startsWith("/cms")) {
      return "cms"
    }
    if (location.pathname.startsWith("/orders")) {
      return "orders"
    }
    if (location.pathname.startsWith("/bookings")) {
      return "bookings"
    }
    if (location.pathname.startsWith("/platform-usage")) {
      return "platform-usage"
    }
    if (location.pathname.startsWith("/platform-webhooks")) {
      return "platform-webhooks"
    }
    return "dashboard"
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const menuData = useMemo<MenuProps['items']>(() => mapMenuItems(menuItems), [menuItems])

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="logo" style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>
          MiniModules
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuData} />
      </Sider>
      <Layout>
        <Header style={{ padding: "0 24px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography.Title level={3} style={{ margin: "12px 0" }}>
            MiniModules 管理后台
          </Typography.Title>
          <Space>
            <LanguageSwitcher size="small" showLabel={false} />
            {activeTenantId ? <span style={{ color: "#4b5563" }}>Tenant: {activeTenantId}</span> : null}
            <span style={{ marginRight: 16 }}>{t("auth.welcome", { name: user?.name ?? t("common.admin") })}</span>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              {t("auth.logout")}
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: "24px", overflow: "initial" }}>
          <div style={{ padding: 24, background: "#fff", minHeight: 360 }}>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
                <Spin size="large" />
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
