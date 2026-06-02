'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.css'

const NAV_ITEMS = [
  { href: '/calendar',        icon: '📅', label: 'ปฏิทิน' },
  { href: '/rfqs',            icon: '📋', label: 'RFQ' },
  { href: '/purchase-orders', icon: '📦', label: 'PO' },
  { href: '/products',        icon: '🗂️', label: 'สินค้า' },
  { href: '/suppliers',       icon: '🏭', label: 'คู่ค้า' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.bottomNav} aria-label="เมนูหลัก">
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.icon} aria-hidden>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
