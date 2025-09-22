import { ProductStatus } from '../../entities/product.entity'

type SkuInput = {
  price: number
  stock: number
  spec?: Record<string, unknown>
}

export interface CreateProductDto {
  tenantId: string
  title: string
  description?: string | null
  images?: string[]
  status?: ProductStatus
  attrs?: Record<string, unknown> | null
  skus?: SkuInput[]
}
