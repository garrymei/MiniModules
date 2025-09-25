import { useCallback, useState } from "react"
import { View, Text, Input, ScrollView } from "@tarojs/components"
import Taro from "@tarojs/taro"

import { searchContent, type SearchResultItem } from "../../services/search"
import { getStoredTenantId } from "../../services/config"

import "./index.scss"

const SearchPage: React.FC = () => {
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const tenantId = getStoredTenantId()

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      Taro.showToast({ title: "请输入搜索关键词", icon: "none" })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await searchContent(keyword, tenantId || undefined)
      setResults(data)
      if (data.length === 0) {
        setError("未找到相关结果")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "搜索失败"
      setError(message)
      Taro.showToast({ title: message, icon: "none" })
    } finally {
      setLoading(false)
    }
  }, [keyword, tenantId])

  const handleInput = (event: any) => {
    setKeyword(event.detail.value)
  }

  const handleConfirm = () => {
    handleSearch().catch(() => {})
  }

  const renderResult = (item: SearchResultItem) => (
    <View className="search-result" key={`${item.type}-${item.id}`}>
      <View className="search-result__header">
        <Text className={`search-result__tag search-result__tag--${item.type}`}>
          {item.type === "product" ? "商品" : item.type === "resource" ? "场地" : "文章"}
        </Text>
        <Text className="search-result__score">得分 {item.score}</Text>
      </View>
      <Text className="search-result__title">{item.title}</Text>
      {item.description ? <Text className="search-result__desc">{item.description}</Text> : null}
      {item.metadata ? (
        <View className="search-result__meta">
          {Object.entries(item.metadata)
            .filter(([_, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => (
              <Text key={key} className="search-result__meta-item">
                {key}: {String(value)}
              </Text>
            ))}
        </View>
      ) : null}
    </View>
  )

  return (
    <View className="search-page">
      <View className="search-bar">
        <Input
          className="search-input"
          value={keyword}
          placeholder="搜索商品、场地或资讯"
          onInput={handleInput}
          onConfirm={handleConfirm}
          confirmType="search"
        />
        <View className="search-button" onClick={() => handleSearch().catch(() => {})}>
          <Text>搜索</Text>
        </View>
      </View>

      {loading ? <Text className="search-status">正在搜索...</Text> : null}
      {error && !loading ? <Text className="search-status search-status__error">{error}</Text> : null}

      <ScrollView scrollY className="search-list">
        {results.map(renderResult)}
      </ScrollView>
    </View>
  )
}

export default SearchPage
