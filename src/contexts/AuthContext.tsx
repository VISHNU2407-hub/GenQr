/* oxlint-disable react/only-export-components — context + hook in same file is standard React pattern */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { createUserDocument, getUserProfile, type UserProfile } from '../utils/firestore'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Sync user document (create if new, update lastLogin if existing)
          await createUserDocument(firebaseUser)
          // Fetch the full profile
          const profile = await getUserProfile(firebaseUser.uid)
          setUserProfile(profile)
        } catch (err) {
          console.error('Failed to sync user document:', err)
          // Still set user even if profile fetch fails
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      })
      await signInWithPopup(auth, googleProvider)
      // Auth state listener will handle the rest
      return { success: true }
    } catch (error: any) {
      let message = 'An unexpected error occurred'

      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled. Please try again.'
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup was blocked. Please allow popups for this site.'
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in cancelled.'
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.'
      } else if (error.code?.includes('permission-denied')) {
        message = 'Permission denied. Please try again.'
      }

      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
