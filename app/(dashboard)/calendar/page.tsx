import type { Metadata } from 'next'
import Topbar from '@/components/layout/Topbar'

export const metadata: Metadata = { title: 'ปฏิทินติดตามงาน — RFQ Procurement' }

export default function CalendarPage() {
  return (
    <>
      <Topbar title="ปฏิทินติดตามงาน" />
      <section style={{ paddingTop: 'var(--space-4)' }}>
        <div style={{
          padding: 'var(--space-6)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sharp)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <p style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>📅</p>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text)' }}>
            ปฏิทินติดตามงาน
          </p>
          <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
            Phase 5 — กำลังพัฒนา
          </p>
        </div>
      </section>
    </>
  )
}
