import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RFQ Procurement System',
  description: 'ระบบจัดซื้อจัดจ้างครบวงจร — ใบขอราคา, ใบสั่งซื้อ, ติดตามงาน',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
