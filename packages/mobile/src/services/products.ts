import { request } from "./request"
import { getStoredTenantId } from "./config"

export interface ProductSku {
  id: string
  name: string
  price: number
  originalPrice?: number
  stock: number
  attributes?: Record<string, any>
}

export interface ProductItem {
  id: string
  tenantId: string
  name: string
  description?: string
  images?: string[]
  category?: string
  basePrice?: number
  type?: string
  status: string
  skus?: ProductSku[]
}

const mockProducts: ProductItem[] = [
  {
    id: "prod-burger",
    tenantId: "tenant_001",
    name: "招牌牛肉堡",
    description: "手工牛肉饼搭配秘制酱料，口感丰富。",
    images: ["https://cdn.minimodules.dev/demo/burger.jpg"],
    category: "主食",
    basePrice: 32.9,
    status: "active",
    skus: [
      {
        id: "sku-burger-regular",
        name: "标准",
        price: 32.9,
        stock: 88,
      },
      {
        id: "sku-burger-cheese",
        name: "加芝士",
        price: 36.9,
        stock: 64,
      },
    ],
  },
  {
    id: "prod-latte",
    tenantId: "tenant_001",
    name: "香草拿铁",
    description: "每日新鲜烘焙咖啡豆，融合丝滑牛奶。",
    images: ["https://cdn.minimodules.dev/demo/latte.jpg"],
    category: "饮品",
    basePrice: 18.0,
    status: "active",
    skus: [
      {
        id: "sku-latte-hot",
        name: "热饮",
        price: 18.0,
        stock: 120,
      },
      {
        id: "sku-latte-ice",
        name: "冰饮",
        price: 19.5,
        stock: 110,
      },
    ],
  },
]

export const fetchProducts = async (tenantId?: string): Promise<ProductItem[]> => {
  const resolvedTenant = tenantId || getStoredTenantId()
  const encodedTenant = encodeURIComponent(resolvedTenant)
  try {
    const result = await request<ProductItem[]>({
      path: `catalog/products?tenantId=${encodedTenant}`,
      method: "GET",
    })
    if (Array.isArray(result) && result.length > 0) {
      return result
    }
    return mockProducts.filter((product) => product.tenantId === resolvedTenant)
  } catch (error) {
    console.warn("Falling back to mock products", error)
    return mockProducts.filter((product) => product.tenantId === resolvedTenant)
  }
}

export const fetchProductDetail = async (productId: string, tenantId?: string): Promise<ProductItem | null> => {
  const resolvedTenant = tenantId || getStoredTenantId()
  const encodedTenant = encodeURIComponent(resolvedTenant)
  try {
    const result = await request<ProductItem>({
      path: `catalog/products/${productId}?tenantId=${encodedTenant}`,
      method: "GET",
    })
    if (result) {
      return result
    }
  } catch (error) {
    console.warn("Falling back to mock product detail", error)
  }

  return mockProducts.find((product) => product.id === productId && product.tenantId === resolvedTenant) || null
}
