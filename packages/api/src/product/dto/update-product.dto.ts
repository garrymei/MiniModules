import { ProductStatus } from '../../entities/product.entity'

interface SkuInput {
  id?: string
  price: number
  stock: number
  spec?: Record<string, unknown>
}

export interface UpdateProductDto {
  title?: string
  description?: string | null
  images?: string[]
  status?: ProductStatus
  attrs?: Record<string, unknown> | null
  skus?: SkuInput[]
}
