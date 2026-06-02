import Topbar from '@/components/layout/Topbar'
export default function LogisticsPage() {
  return (
    <>
      <Topbar title="การขนส่ง (Logistics)" />
      <section style={{ paddingTop: 'var(--space-4)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>ช่องทางการขนส่ง</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>จัดการผู้ให้บริการขนส่งที่ใช้งาน</p>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 32px', background: 'var(--color-surface)', border: '1px dashed var(--color-border-light)', borderRadius: 'var(--radius-sharp)' }}>
          <p style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>🚚</p>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Phase 2 — กำลังพัฒนา</p>
        </div>
      </section>
    </>
  )
}
