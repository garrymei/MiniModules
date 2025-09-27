import { Result, Spin } from "antd"
import type { ReactNode } from "react"

import { useAuth } from "../../hooks/useAuth"

interface ModuleGuardProps {
  moduleKey?: string | null
  children: ReactNode
}

export const ModuleGuard = ({ moduleKey, children }: ModuleGuardProps) => {
  const { hasModule, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (moduleKey && !hasModule(moduleKey)) {
    return <Result status="403" title="403" subTitle="您无权访问该模块，请联系管理员。" />
  }

  return <>{children}</>
}

export default ModuleGuard
