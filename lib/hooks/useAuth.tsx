'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { subscribeToAuthState } from '../firebase/auth'
import { AppUser } from '../types'

interface AuthContextType {
  user: User | null
  appUser: AppUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) {
          setAppUser({ uid: firebaseUser.uid, ...snap.data() } as AppUser)
        } else {
          // Create user doc if first login
          const newUser: Omit<AppUser, 'uid'> = {
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
            role: 'buyer',
            createdAt: null as never,
          }
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser)
          setAppUser({ uid: firebaseUser.uid, ...newUser })
        }
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
