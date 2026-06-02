import type { Metadata } from 'next'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import styles from './rfqs.module.css'

export const metadata: Metadata = { title: 'ใบขอราคา (RFQ) — Procurement' }

export default function RFQsPage() {
  return (
    <>
      <Topbar title="ใบขอราคา (RFQ)" />
      <section className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>ใบขอราคา</h1>
            <p className={styles.pageDesc}>จัดการคำขอราคาสินค้าจากคู่ค้า</p>
          </div>
          <Link href="/rfqs/new" className={styles.createBtn} id="create-rfq-btn">
            + สร้างใบขอราคาใหม่
          </Link>
        </div>

        {/* Placeholder for Phase 3 */}
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyTitle}>ยังไม่มีใบขอราคา</p>
          <p className={styles.emptyDesc}>กดปุ่ม "สร้างใบขอราคาใหม่" เพื่อเริ่มต้น</p>
        </div>
      </section>
    </>
  )
}
