import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { LogAction, LogSeverity, LogTargetType } from '../types'

interface LogParams {
  action: LogAction
  targetId?: string
  targetType?: LogTargetType
  details: string
  severity?: LogSeverity
}

export async function logAction({
  action,
  targetId = '',
  targetType = 'auth',
  details,
  severity = 'info',
}: LogParams): Promise<void> {
  const user = auth.currentUser
  if (!user) return

  try {
    await addDoc(collection(db, 'logs'), {
      timestamp: serverTimestamp(),
      userId: user.uid,
      userEmail: user.email ?? '',
      action,
      targetId,
      targetType,
      details,
      severity,
    })
  } catch (err) {
    // Fail silently — don't block user actions for logging errors
    console.warn('[AuditLog] Failed to write log:', err)
  }
}
