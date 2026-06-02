import Topbar from '@/components/layout/Topbar'
export default function LogsPage() {
  return (
    <>
      <Topbar title="Audit Logs" />
      <section style={{ paddingTop: 'var(--space-4)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>Audit Logs</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>ประวัติการทำงานทั้งหมดในระบบ</p>
        </div>
        <div style={{
          background: '#0D0D0D', border: '1px solid var(--color-border-light)',
          borderTop: '2px solid var(--color-green)', borderRadius: 'var(--radius-sharp)',
          padding: 'var(--space-6)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)',
          color: '#00C851', minHeight: 300,
        }}>
          <p style={{ opacity: 0.5, marginBottom: 'var(--space-4)' }}>
            {'>'} AUDIT LOG TERMINAL v1.0 — Procurement System
          </p>
          <p style={{ opacity: 0.4 }}>{'>'} Phase 5 — กำลังพัฒนา...</p>
          <p style={{ opacity: 0.4 }}>{'>'} logs ทั้งหมดจะแสดงที่นี่หลังจาก Phase 1 เสร็จสมบูรณ์</p>
          <span className="animate-pulse" style={{ display: 'inline-block', marginTop: 'var(--space-4)' }}>█</span>
        </div>
      </section>
    </>
  )
}
