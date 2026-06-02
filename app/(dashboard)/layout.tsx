import { AuthProvider } from '@/lib/hooks/useAuth'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import styles from './dashboard.module.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className={styles.shell}>
        <Sidebar />
        <div className={styles.main}>
          <div className={styles.content}>
            {children}
          </div>
        </div>
        <BottomNav />
      </div>
    </AuthProvider>
  )
}
