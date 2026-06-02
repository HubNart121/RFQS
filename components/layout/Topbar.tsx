'use client'

import { useRouter } from 'next/navigation'
import { logout } from '@/lib/firebase/auth'
import { logAction } from '@/lib/hooks/useAuditLog'
import { useAuth } from '@/lib/hooks/useAuth'
import styles from './Topbar.module.css'

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter()
  const { appUser } = useAuth()

  async function handleLogout() {
    await logAction({ action: 'USER_LOGOUT', targetType: 'auth', details: 'ออกจากระบบ' })
    await logout()
    document.cookie = 'auth-token=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <header className={styles.topbar}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.right}>
        <span className={styles.userInfo}>
          <span className={styles.userEmail}>{appUser?.email}</span>
          <span className={styles.userRole}>{appUser?.role}</span>
        </span>
        <button
          onClick={handleLogout}
          className={styles.logoutBtn}
          title="ออกจากระบบ"
          aria-label="ออกจากระบบ"
        >
          ↩ ออก
        </button>
      </div>
    </header>
  )
}
