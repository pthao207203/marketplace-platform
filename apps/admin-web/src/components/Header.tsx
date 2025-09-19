import React from 'react'
import { Link } from 'react-router-dom'

export default function Header({ onToggleSidebar, sidebarOpen }) {
  return (
    <header className="header">
      <button className="header__toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        {sidebarOpen ? '⟨' : '⟩'}
      </button>
      <Link to="/dashboard" className="header__brand">My App</Link>
      <div className="header__spacer" />
      <nav className="header__nav">
        <Link to="/login" className="header__link">Login</Link>
      </nav>
    </header>
  )
}
