import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { I18nProvider } from "./contexts/I18nContext"
import { AppLayout } from "./components/layout/AppLayout"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"
import { ModulesCatalogPage } from "./pages/ModulesCatalogPage"
import { TenantEntitlementsPage } from "./pages/TenantEntitlementsPage"
import { TenantSettingsPage } from "./pages/TenantSettingsPage"
import { ModuleConfigPage } from "./pages/ModuleConfigPage"
import { TenantsPage } from "./pages/TenantsPage"
import { ResourcesPage } from "./pages/ResourcesPage"
import { OrderManagementPage } from "./pages/OrderManagementPage"
import { BookingManagementPage } from "./pages/BookingManagementPage"
import { CMSManagementPage } from "./pages/CMSManagementPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { PlatformUsagePage } from "./pages/PlatformUsagePage"
import { PlatformWebhookPage } from "./pages/PlatformWebhookPage"

import { AuthProvider } from "./providers/AuthProvider"

export const App = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="modules-catalog" element={<ModulesCatalogPage />} />
              <Route path="tenant-entitlements" element={<TenantEntitlementsPage />} />
              <Route path="platform-usage" element={<PlatformUsagePage />} />
              <Route path="platform-webhooks" element={<PlatformWebhookPage />} />
              <Route path="tenant-settings" element={<TenantSettingsPage />} />
              <Route path="module-config" element={<ModuleConfigPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="cms" element={<CMSManagementPage />} />
              <Route path="orders" element={<OrderManagementPage />} />
              <Route path="bookings" element={<BookingManagementPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
