import Taro from "@tarojs/taro"

import type { ProductItem, ProductSku } from "./products"

export interface CartItem {
  id: string
  productId: string
  skuId?: string
  productName: string
  skuName?: string
  quantity: number
  price: number
  image?: string
}

const CART_STORAGE_KEY = "mm_cart"

type CartSnapshot = Record<string, CartItem>

const readCart = (): CartSnapshot => {
  return Taro.getStorageSync<CartSnapshot>(CART_STORAGE_KEY) || {}
}

const writeCart = (snapshot: CartSnapshot) => {
  Taro.setStorageSync(CART_STORAGE_KEY, snapshot)
}

export const listCartItems = (): CartItem[] => {
  const cart = readCart()
  return Object.values(cart)
}

export const clearCart = (): void => {
  Taro.removeStorageSync(CART_STORAGE_KEY)
}

export const addItemToCart = (product: ProductItem, sku: ProductSku | undefined, quantity: number): CartItem => {
  const cart = readCart()
  const itemId = sku ? `${product.id}_${sku.id}` : product.id
  const existing = cart[itemId]
  const price = sku?.price ?? product.basePrice ?? 0

  cart[itemId] = {
    id: itemId,
    productId: product.id,
    skuId: sku?.id,
    productName: product.name,
    skuName: sku?.name,
    quantity: existing ? existing.quantity + quantity : quantity,
    price,
    image: product.images?.[0],
  }

  writeCart(cart)
  return cart[itemId]
}

export const updateCartItemQuantity = (itemId: string, quantity: number): void => {
  const cart = readCart()
  if (!cart[itemId]) {
    return
  }

  if (quantity <= 0) {
    delete cart[itemId]
  } else {
    cart[itemId].quantity = quantity
  }

  writeCart(cart)
}

export const removeCartItem = (itemId: string): void => {
  const cart = readCart()
  if (cart[itemId]) {
    delete cart[itemId]
    writeCart(cart)
  }
}
