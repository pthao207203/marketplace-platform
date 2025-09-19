import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ open }) {
  return (
    <aside className={open ? 'sidebar sidebar--open' : 'sidebar sidebar--closed'}>
      <div className="sidebar__section">
        <div className="sidebar__title">Navigation</div>
        <NavLink to="/dashboard" className={({isActive}) => 'sidebar__link' + (isActive ? ' is-active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({isActive}) => 'sidebar__link' + (isActive ? ' is-active' : '')}>
          Products
        </NavLink>
      </div>
    </aside>
  )
}
