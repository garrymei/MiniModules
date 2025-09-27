import { useEffect, useState } from "react"
import { View, Text, ScrollView, Input } from "@tarojs/components"
import Taro from "@tarojs/taro"

import { ProductCard } from "../../components/cards/ProductCard"
import { fetchProducts, type ProductItem } from "../../services/products"
import { getStoredTenantId } from "../../services/config"

import "./index.scss"

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [filtered, setFiltered] = useState<ProductItem[]>([])
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProducts().catch((error) => {
      console.error("failed to load products", error)
    })
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const tenantId = getStoredTenantId()
      const list = await fetchProducts(tenantId)
      setProducts(list)
      setFiltered(list)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    if (!value) {
      setFiltered(products)
      return
    }
    const lower = value.toLowerCase()
    setFiltered(
      products.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          (item.description?.toLowerCase().includes(lower) ?? false) ||
          (item.category?.toLowerCase().includes(lower) ?? false),
      ),
    )
  }

  const handleProductClick = (product: ProductItem) => {
    Taro.navigateTo({ url: `/pages/products/detail/index?id=${product.id}` })
  }

  return (
    <View className="products-page">
      <View className="products-header">
        <Text className="products-title">精选商品</Text>
        <Input
          className="products-search"
          placeholder="搜索商品或分类"
          value={keyword}
          onInput={(event) => handleSearch(event.detail.value)}
        />
      </View>

      {loading ? (
        <View className="products-status">
          <Text className="products-status__text">加载中...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View className="products-status">
          <Text className="products-status__text">暂无商品</Text>
        </View>
      ) : (
        <ScrollView scrollY className="products-list">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onClick={handleProductClick} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default ProductsPage
