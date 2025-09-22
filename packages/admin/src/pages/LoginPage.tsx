import { FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import styles from './LoginPage.module.css'

interface LocationState {
  from?: Location
}

const LoginPage = () => {
  const { login, token } = useAuth()
  const location = useLocation()
  const state = location.state as LocationState | undefined
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (token) {
    const redirectTo = state?.from?.pathname ?? '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(username, password)
    } catch (err) {
      console.error(err)
      setError('登录失败，请检查账号和密码')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>MiniModules 管理后台</h1>
        <label className={styles.label}>
          用户名
          <input
            className={styles.input}
            value={username}
            onChange={event => setUsername(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label className={styles.label}>
          密码
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <div className={styles.error}>{error}</div> : null}
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
