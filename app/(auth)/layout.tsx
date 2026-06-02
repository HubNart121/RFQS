import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ — RFQ Procurement',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
    }}>
      {children}
    </main>
  )
}
