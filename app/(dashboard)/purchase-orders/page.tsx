import Topbar from '@/components/layout/Topbar'
import Link from 'next/link'
export default function POsPage() {
  return (
    <>
      <Topbar title="ใบสั่งซื้อ (PO)" />
      <section style={{ paddingTop: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>ใบสั่งซื้อ</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>ติดตามสถานะการสั่งซื้อสินค้า</p>
          </div>
          <Link href="/purchase-orders/new" style={{
            display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
            background: 'var(--color-orange)', color: '#000', fontWeight: 600,
            fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sharp)', textDecoration: 'none',
          }}>
            + สร้าง PO ใหม่
          </Link>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 32px', background: 'var(--color-surface)', border: '1px dashed var(--color-border-light)', borderRadius: 'var(--radius-sharp)' }}>
          <p style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>📦</p>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>ยังไม่มีใบสั่งซื้อ</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>แปลงใบขอราคาเป็นใบสั่งซื้อได้ที่หน้า RFQ</p>
        </div>
      </section>
    </>
  )
}
