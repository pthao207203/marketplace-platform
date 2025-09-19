import React from 'react'
import { useParams, Link } from 'react-router-dom'

export default function ProductDetail() {
  const { id } = useParams()
  return (
    <section className="page">
      <h1>Product: {id}</h1>
      <p>This is a placeholder detail page. Replace with real data fetching.</p>
      <p><Link to="/products">← Back to Products</Link></p>
    </section>
  )
}
