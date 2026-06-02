'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithEmail } from '@/lib/firebase/auth'
import { logAction } from '@/lib/hooks/useAuditLog'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cred = await loginWithEmail(email, password)
      // Set cookie for middleware
      document.cookie = `auth-token=${await cred.user.getIdToken()}; path=/; max-age=3600; SameSite=Strict`
      await logAction({ action: 'USER_LOGIN', targetType: 'auth', details: `เข้าสู่ระบบจาก ${email}` })
      router.push('/calendar')
    } catch {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo / Brand */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <span>RFQ</span>
          </div>
          <h1 className={styles.title}>ระบบจัดซื้อ</h1>
          <p className={styles.subtitle}>Procurement Management System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>อีเมล</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              placeholder="user@company.com"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>รหัสผ่าน</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className={styles.spinner} aria-label="กำลังเข้าสู่ระบบ" />
            ) : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className={styles.footer}>
          Procurement System v1.0 &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
