import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'
import { th } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'

// --- Date formatting ---
export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  return format(ts.toDate(), 'dd/MM/yyyy', { locale: th })
}

export function formatDateTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  return format(ts.toDate(), 'dd/MM/yyyy HH:mm', { locale: th })
}

export function formatRelative(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: th })
}

export function isOverdue(ts: Timestamp | null | undefined): boolean {
  if (!ts) return false
  return isBefore(ts.toDate(), new Date())
}

export function daysUntil(ts: Timestamp | null | undefined): number | null {
  if (!ts) return null
  const diff = ts.toDate().getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// --- Number formatting ---
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('th-TH').format(n)
}

// --- Document number generation ---
export function generateRFQNumber(count: number): string {
  const year = new Date().getFullYear()
  const seq = String(count + 1).padStart(4, '0')
  return `RFQ-${year}-${seq}`
}

export function generatePONumber(count: number): string {
  const year = new Date().getFullYear()
  const seq = String(count + 1).padStart(4, '0')
  return `PO-${year}-${seq}`
}

// --- Status labels (Thai) ---
export const RFQ_STATUS_LABELS: Record<string, string> = {
  draft:           'แบบร่าง',
  issued:          'ออกใบขอราคาแล้ว',
  quotes_received: 'ได้รับราคาแล้ว',
  compared:        'เปรียบเทียบแล้ว',
  converted_to_po: 'ออก PO แล้ว',
  cancelled:       'ยกเลิกแล้ว',
}

export const PO_STATUS_LABELS: Record<string, string> = {
  draft:         'แบบร่าง',
  issued:        'ออกใบสั่งซื้อแล้ว',
  confirmed:     'ยืนยันแล้ว',
  in_production: 'กำลังผลิต',
  in_transit:    'กำลังขนส่ง',
  delivered:     'ส่งมอบแล้ว',
  closed:        'ปิดงาน',
  cancelled:     'ยกเลิกแล้ว',
}

export const PO_STATUS_ORDER: string[] = [
  'draft', 'issued', 'confirmed', 'in_production', 'in_transit', 'delivered', 'closed'
]
