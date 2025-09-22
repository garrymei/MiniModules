import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Product, ProductStatus } from '../entities/product.entity'
import { Sku } from '../entities/sku.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

const formatPrice = (value: number | string): string => {
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num)) {
    throw new BadRequestException('Invalid price value')
  }
  return (Math.round(num * 100) / 100).toFixed(2)
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Sku)
    private readonly skuRepository: Repository<Sku>,
  ) {}

  async create(dto: CreateProductDto) {
    if (!dto.tenantId || !dto.title) {
      throw new BadRequestException('tenantId and title are required')
    }

    const product = this.productRepository.create({
      tenantId: dto.tenantId,
      title: dto.title,
      description: dto.description ?? null,
      images: dto.images ?? [],
      status: dto.status ?? ProductStatus.Draft,
      attrs: dto.attrs ?? null,
    })

    if (dto.skus?.length) {
      product.skus = dto.skus.map(sku => {
        const entity = this.skuRepository.create({
          price: formatPrice(sku.price),
          stock: sku.stock,
          spec: sku.spec ?? null,
        })
        entity.product = product
        return entity
      })
    }

    const saved = await this.productRepository.save(product)
    return this.findById(saved.id)
  }

  async findById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { skus: true },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    return product
  }

  async listByTenant(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required')
    }

    return this.productRepository.find({
      where: { tenantId },
      relations: { skus: true },
      order: { createdAt: 'DESC' },
    })
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { skus: true },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    if (dto.title !== undefined) product.title = dto.title
    if (dto.description !== undefined) product.description = dto.description
    if (dto.images !== undefined) product.images = dto.images
    if (dto.status !== undefined) product.status = dto.status
    if (dto.attrs !== undefined) product.attrs = dto.attrs

    if (dto.skus) {
      await this.syncSkus(product, dto.skus)
    }

    await this.productRepository.save(product)
    return this.findById(id)
  }

  private async syncSkus(product: Product, skuInputs: UpdateProductDto['skus']) {
    const existing = await this.skuRepository.find({
      where: { productId: product.id },
    })
    const existingMap = new Map(existing.map(sku => [sku.id, sku]))
    const seenIds = new Set<string>()
    const skusToSave: Sku[] = []

    for (const input of skuInputs ?? []) {
      if (input.id) {
        const current = existingMap.get(input.id)
        if (!current) {
          throw new BadRequestException(`SKU ${input.id} not found`)
        }
        current.price = formatPrice(input.price)
        current.stock = input.stock
        current.spec = input.spec ?? null
        skusToSave.push(current)
        seenIds.add(input.id)
      } else {
        const created = this.skuRepository.create({
          productId: product.id,
          price: formatPrice(input.price),
          stock: input.stock,
          spec: input.spec ?? null,
        })
        skusToSave.push(created)
      }
    }

    const toRemove = existing.filter(sku => !seenIds.has(sku.id))
    if (toRemove.length) {
      await this.skuRepository.remove(toRemove)
    }

    if (skusToSave.length) {
      await this.skuRepository.save(skusToSave)
    }
  }

  async delete(id: string) {
    const product = await this.productRepository.findOne({ where: { id } })
    if (!product) {
      return
    }
    await this.productRepository.remove(product)
  }
}
