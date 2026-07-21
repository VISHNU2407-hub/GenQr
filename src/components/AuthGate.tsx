import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AuthGateProps {
  children: React.ReactNode
  message?: string
}

export default function AuthGate({ children, message }: AuthGateProps) {
  const { user, loading, signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
      </div>
    )
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card p-6 sm:p-8 text-center"
      >
        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-secondary/30 border border-border flex items-center justify-center">
            <Lock className="w-6 h-6 text-text-secondary" />
          </div>
          <p className="text-text-primary text-sm font-medium">
            {message || 'Sign in with Google to generate and manage your QR Codes.'}
          </p>
          <button
            onClick={async () => {
              setIsSigningIn(true)
              await signInWithGoogle()
              setIsSigningIn(false)
            }}
            disabled={isSigningIn}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-70"
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Continue with Google</span>
          </button>
        </div>
      </motion.div>
    )
  }

  return <>{children}</>
}
