'use client'

import { useState, FormEvent } from 'react'
import { changePassword } from '@/lib/firebase/auth'
import { logAction } from '@/lib/hooks/useAuditLog'
import { useAuth } from '@/lib/hooks/useAuth'
import Topbar from '@/components/layout/Topbar'
import styles from './settings.module.css'

export default function SettingsPage() {
  const { appUser } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setStatus('error'); setMessage('รหัสผ่านใหม่ไม่ตรงกัน'); return }
    if (next.length < 8) { setStatus('error'); setMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return }

    setStatus('loading')
    try {
      await changePassword(current, next)
      await logAction({ action: 'CHANGE_PASSWORD', targetType: 'auth', details: 'เปลี่ยนรหัสผ่านสำเร็จ' })
      setStatus('success')
      setMessage('เปลี่ยนรหัสผ่านสำเร็จ')
      setCurrent(''); setNext(''); setConfirm('')
    } catch {
      setStatus('error')
      setMessage('รหัสผ่านปัจจุบันไม่ถูกต้อง')
    }
  }

  return (
    <>
      <Topbar title="ตั้งค่าบัญชี" />
      <section style={{ paddingTop: 'var(--space-4)', maxWidth: 500 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>ตั้งค่าบัญชี</h1>

        {/* User Info */}
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>อีเมล</span>
            <span className={styles.infoValue}>{appUser?.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>ชื่อ</span>
            <span className={styles.infoValue}>{appUser?.displayName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>สิทธิ์</span>
            <span className={`${styles.infoValue} ${styles.badge}`}>{appUser?.role}</span>
          </div>
        </div>

        {/* Change Password */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>เปลี่ยนรหัสผ่าน</h2>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="current-password" className={styles.label}>รหัสผ่านปัจจุบัน</label>
              <input id="current-password" type="password" required value={current}
                onChange={e => setCurrent(e.target.value)} className={styles.input}
                placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className={styles.field}>
              <label htmlFor="new-password" className={styles.label}>รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label>
              <input id="new-password" type="password" required value={next}
                onChange={e => setNext(e.target.value)} className={styles.input}
                placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirm-password" className={styles.label}>ยืนยันรหัสผ่านใหม่</label>
              <input id="confirm-password" type="password" required value={confirm}
                onChange={e => setConfirm(e.target.value)} className={styles.input}
                placeholder="••••••••" autoComplete="new-password" />
            </div>

            {status === 'error' && <div className={styles.error}>⚠ {message}</div>}
            {status === 'success' && <div className={styles.success}>✓ {message}</div>}

            <button type="submit" className={styles.submitBtn}
              disabled={status === 'loading' || !current || !next || !confirm}>
              {status === 'loading' ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
