import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "./components/layout/AppLayout"
import { RequireAuth } from "./components/layout/RequireAuth"
import { useAuth } from "./hooks/useAuth"
import { DashboardPage } from "./pages/DashboardPage"
import { LoginPage } from "./pages/LoginPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { ResourcesPage } from "./pages/ResourcesPage"
import { TenantsPage } from "./pages/TenantsPage"

const App = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
        </Route>
      </Route>
      <Route path="*" element={isAuthenticated ? <NotFoundPage /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
