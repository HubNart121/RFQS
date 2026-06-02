'use client'

import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './config'

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('ไม่พบข้อมูลผู้ใช้')

  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser(): User | null {
  return auth.currentUser
}
