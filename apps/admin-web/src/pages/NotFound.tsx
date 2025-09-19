import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="page">
      <h1>404</h1>
      <p>Page not found.</p>
      <p><Link to="/dashboard">Go home</Link></p>
    </section>
  )
}
