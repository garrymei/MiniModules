import { useAuth } from '../auth/AuthContext'
import styles from './DashboardPage.module.css'

const DashboardPage = () => {
  const { user, logout } = useAuth()

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>仪表盘</h1>
          <p className={styles.subtitle}>欢迎回来，{user?.username ?? '管理员'}</p>
        </div>
        <button className={styles.logout} onClick={logout}>
          退出登录
        </button>
      </header>
      <section className={styles.cards}>
        <article className={styles.card}>
          <h2>下一步</h2>
          <p>使用顶部导航进入租户、模块、商品或场地管理页。</p>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
