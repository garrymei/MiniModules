import { useEffect, useMemo, useState } from "react"
import { View, Text, Image, Swiper, SwiperItem, Button } from "@tarojs/components"
import Taro from "@tarojs/taro"

import { fetchProductDetail, type ProductItem, type ProductSku } from "../../../services/products"
import { addItemToCart } from "../../../services/cart"
import { getStoredTenantId } from "../../../services/config"

import "./index.scss"

const ProductDetailPage: React.FC = () => {
  const { id } = Taro.getCurrentInstance().router?.params || {}
  const [product, setProduct] = useState<ProductItem | null>(null)
  const [selectedSku, setSelectedSku] = useState<ProductSku | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      Taro.showToast({ title: "未找到商品", icon: "none" })
      return
    }
    loadProduct(id).catch((error) => {
      console.error("Failed to load product", error)
      Taro.showToast({ title: "加载失败", icon: "none" })
    })
  }, [id])

  const loadProduct = async (productId: string) => {
    setLoading(true)
    try {
      const tenantId = getStoredTenantId()
      const detail = await fetchProductDetail(productId, tenantId)
      setProduct(detail)
      setSelectedSku(detail?.skus?.[0])
    } finally {
      setLoading(false)
    }
  }

  const price = useMemo(() => {
    if (!product) return 0
    if (selectedSku) return selectedSku.price
    return product.basePrice ?? 0
  }, [product, selectedSku])

  const handleChangeQuantity = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta
      if (next <= 1) {
        return 1
      }
      return next
    })
  }

  const handleAddToCart = () => {
    if (!product) return
    const item = addItemToCart(product, selectedSku, quantity)
    Taro.showToast({ title: `已加入购物车 (${item.quantity})`, icon: "success" })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    Taro.navigateTo({ url: "/pages/checkout/index" })
  }

  if (loading) {
    return (
      <View className="product-detail-page">
        <View className="product-detail__status">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!product) {
    return (
      <View className="product-detail-page">
        <View className="product-detail__status">
          <Text>商品不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="product-detail-page">
      <Swiper className="product-detail__gallery" autoplay circular>
        {(product.images ?? ["https://cdn.minimodules.dev/placeholder.png"]).map((url) => (
          <SwiperItem key={url}>
            <Image className="product-detail__image" src={url} mode="aspectFill" />
          </SwiperItem>
        ))}
      </Swiper>

      <View className="product-detail__info">
        <Text className="product-detail__name">{product.name}</Text>
        {product.category && <Text className="product-detail__category">{product.category}</Text>}
        <Text className="product-detail__price">¥{price.toFixed(2)}</Text>
        {product.description && <Text className="product-detail__desc">{product.description}</Text>}
      </View>

      {product.skus && product.skus.length > 0 ? (
        <View className="product-detail__section">
          <Text className="section-title">规格选择</Text>
          <View className="sku-list">
            {product.skus.map((sku) => (
              <View
                key={sku.id}
                className={`sku-item ${selectedSku?.id === sku.id ? "sku-item--active" : ""}`}
                onClick={() => setSelectedSku(sku)}
              >
                <Text className="sku-item__name">{sku.name}</Text>
                <Text className="sku-item__price">¥{sku.price.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="product-detail__section">
        <Text className="section-title">数量</Text>
        <View className="quantity-control">
          <Button className="quantity-btn" onClick={() => handleChangeQuantity(-1)}>-</Button>
          <Text className="quantity-value">{quantity}</Text>
          <Button className="quantity-btn" onClick={() => handleChangeQuantity(1)}>+</Button>
        </View>
      </View>

      <View className="product-detail__actions">
        <Button className="action-btn action-btn--cart" onClick={handleAddToCart}>
          加入购物车
        </Button>
        <Button className="action-btn action-btn--primary" onClick={handleBuyNow}>
          立即购买
        </Button>
      </View>
    </View>
  )
}

export default ProductDetailPage
