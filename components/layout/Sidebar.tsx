'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { href: '/calendar',        icon: '📅', label: 'ปฏิทินงาน' },
  { href: '/rfqs',            icon: '📋', label: 'ใบขอราคา (RFQ)' },
  { href: '/purchase-orders', icon: '📦', label: 'ใบสั่งซื้อ (PO)' },
  { href: '/products',        icon: '🗂️', label: 'คลังสินค้า' },
  { href: '/suppliers',       icon: '🏭', label: 'คู่ค้า' },
  { href: '/logistics',       icon: '🚚', label: 'การขนส่ง' },
  { href: '/logs',            icon: '🔒', label: 'Audit Logs' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar} aria-label="เมนูหลัก">
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logoMark}>RFQ</div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Procurement</span>
          <span className={styles.brandSub}>Management System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.icon} aria-hidden>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
              {isActive && <span className={styles.activeLine} aria-hidden />}
            </Link>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className={styles.bottom}>
        <Link
          href="/settings"
          className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`}
        >
          <span className={styles.icon} aria-hidden>⚙️</span>
          <span className={styles.label}>ตั้งค่าบัญชี</span>
        </Link>
      </div>
    </aside>
  )
}
