import { useEffect } from "react"
import { PRODUCT } from "../product"

export default function ProductHeader() {
  useEffect(() => {
    document.title = `${PRODUCT.name} — ${PRODUCT.concept}`
  }, [])

  return (
    <header className="product-header">
      <h1 className="t-display">{PRODUCT.name}</h1>
      <p className="product-concept t-concept">{PRODUCT.concept}</p>
      <p className="product-quote t-quote">“{PRODUCT.description}”</p>
    </header>
  )
}
