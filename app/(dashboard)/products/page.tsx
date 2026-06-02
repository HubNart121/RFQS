import Topbar from '@/components/layout/Topbar'
import Link from 'next/link'
export default function ProductsPage() {
  return (
    <>
      <Topbar title="คลังสินค้า" />
      <section style={{ paddingTop: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>คลังสินค้า</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>รายการสินค้าและวัสดุในระบบ</p>
          </div>
          <Link href="/products/new" id="add-product-btn" style={{
            display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
            background: 'var(--color-orange)', color: '#000', fontWeight: 600,
            fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sharp)', textDecoration: 'none',
          }}>
            + เพิ่มสินค้า
          </Link>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 32px', background: 'var(--color-surface)', border: '1px dashed var(--color-border-light)', borderRadius: 'var(--radius-sharp)' }}>
          <p style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🗂️</p>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>ยังไม่มีสินค้าในระบบ</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>กดปุ่ม "เพิ่มสินค้า" เพื่อเริ่มต้น</p>
        </div>
      </section>
    </>
  )
}
