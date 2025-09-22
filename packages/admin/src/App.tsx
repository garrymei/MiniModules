import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
