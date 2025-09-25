import { request } from "./request"

export type SearchResultType = "product" | "resource" | "article"

export interface SearchResultItem {
  type: SearchResultType
  id: string
  title: string
  description?: string
  score: number
  metadata?: Record<string, any>
}

export const searchContent = async (
  keyword: string,
  tenantId?: string,
  limit: number = 15,
): Promise<SearchResultItem[]> => {
  const params = new URLSearchParams({ q: keyword.trim(), limit: String(limit) })
  if (tenantId) {
    params.append("tenantId", tenantId)
  }

  return request<SearchResultItem[]>({
    path: `search?${params.toString()}`,
    method: "GET",
  })
}
