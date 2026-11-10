import { useEffect } from "react"
import { IS_DEMO_MODE } from "../lib/supabase"
import { PRODUCT } from "../product"

const fields = [
  { key: "name", placeholder: "[제품 이름]" },
  { key: "concept", placeholder: "[제품 컨셉, 한 줄]" },
  { key: "description", placeholder: "[제품 설명, 2~3문장]" },
] as const

export default function ProductHeader() {
  useEffect(() => {
    document.title = PRODUCT.name || fields[0].placeholder
  }, [])

  return (
    <header className="product-header">
      <h1 className={`t-display ${PRODUCT.name ? "" : "placeholder"}`}>
        {PRODUCT.name || fields[0].placeholder}
      </h1>
      <p
        className={`product-concept t-label ${
          PRODUCT.concept ? "" : "placeholder"
        }`}
      >
        {PRODUCT.concept || fields[1].placeholder}
      </p>
      <p
        className={`product-description t-body ${
          PRODUCT.description ? "" : "placeholder"
        }`}
      >
        {PRODUCT.description || fields[2].placeholder}
      </p>
      {IS_DEMO_MODE && (
        <p className="demo-note t-caption">데모 데이터로 표시 중</p>
      )}
    </header>
  )
}
