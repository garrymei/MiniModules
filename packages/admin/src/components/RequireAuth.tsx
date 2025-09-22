import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export const RequireAuth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
