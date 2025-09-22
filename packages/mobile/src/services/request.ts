import Taro from "@tarojs/taro"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface RequestOptions<TBody> {
  path: string
  method?: HttpMethod
  data?: TBody
  header?: Record<string, string>
}

const API_BASE_STORAGE_KEY = "mm_api_base_url"
const AUTH_TOKEN_STORAGE_KEY = "mm_auth_token"
const DEFAULT_API_BASE_URL = "http://localhost:3000/api"

const normalizeUrl = (baseUrl: string, path: string): string => {
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${cleanBase}/${cleanPath}`
}

export const getApiBaseUrl = (): string => {
  const stored = Taro.getStorageSync<string>(API_BASE_STORAGE_KEY)
  return stored || DEFAULT_API_BASE_URL
}

export const setApiBaseUrl = (url: string): void => {
  if (!url) {
    return
  }

  Taro.setStorageSync(API_BASE_STORAGE_KEY, url)
}

export const setAuthToken = (token: string | null): void => {
  if (!token) {
    Taro.removeStorageSync(AUTH_TOKEN_STORAGE_KEY)
    return
  }

  Taro.setStorageSync(AUTH_TOKEN_STORAGE_KEY, token)
}

export const getAuthToken = (): string | null => {
  const stored = Taro.getStorageSync<string>(AUTH_TOKEN_STORAGE_KEY)
  return stored || null
}

export async function request<TResponse, TBody = Record<string, unknown>>(
  options: RequestOptions<TBody>,
): Promise<TResponse> {
  const { path, method = "GET", data, header } = options
  const url = normalizeUrl(getApiBaseUrl(), path)
  const token = getAuthToken()

  try {
    const response = await Taro.request<TResponse>({
      url,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header,
      },
    })

    if (response.statusCode === 401) {
      setAuthToken(null)
      throw new Error("Unauthorized. Please sign in again.")
    }

    if (response.statusCode >= 400) {
      const message =
        typeof response.data === "object" &&
        response.data !== null &&
        "message" in response.data
          ? String((response.data as { message?: string }).message)
          : `Request failed with status ${response.statusCode}`
      throw new Error(message)
    }

    return response.data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error("Network request failed")
  }
}
