'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PiSquaresFour,
  PiChartLineUp,
  PiUsersThree,
} from 'react-icons/pi'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: PiSquaresFour,
    match: (path) => path === '/dashboard' || path === '/',
  },
  {
    href: '/analysis',
    label: 'Analysis',
    icon: PiChartLineUp,
    match: (path) => path.startsWith('/analysis'),
  },
  {
    href: '/users',
    label: 'Users',
    icon: PiUsersThree,
    adminOnly: true,
    match: (path) => path.startsWith('/users'),
  },
]

export function Sidebar ({ collapsed, isAdmin, docCount = 0 }) {
  const pathname = usePathname()

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      className={`shell-sidebar${collapsed ? ' shell-sidebar--collapsed' : ''}`}
      aria-label="Main navigation"
    >
      <div className="shell-sidebar__section">
        <p className="shell-sidebar__label">Workspace</p>
        <ul className="shell-nav">
          {items.map((item) => {
            const Icon = item.icon
            const active = item.match(pathname)
            return (
              <li key={item.href} className="shell-nav__item">
                <Link
                  href={item.href}
                  className={`shell-nav__link${active ? ' shell-nav__link--active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="shell-nav__icon" aria-hidden />
                  <span className="shell-nav__text">{item.label}</span>
                  {item.href === '/analysis' && docCount > 0 ? (
                    <span className="shell-nav__badge tabular-nums">{docCount}</span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
