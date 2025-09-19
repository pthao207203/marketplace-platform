import React from 'react'
import { Link } from 'react-router-dom'

const FAKE_PRODUCTS = [
  { id: 101, name: 'Keyboard' },
  { id: 102, name: 'Mouse' },
  { id: 103, name: 'Monitor' },
]

export default function Products() {
  return (
    <section className="page">
      <h1>Products</h1>
      <ul className="list">
        {FAKE_PRODUCTS.map(p => (
          <li key={p.id} className="list__item">
            <Link to={`/products/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
