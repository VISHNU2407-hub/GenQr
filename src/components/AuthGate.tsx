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
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 sm:p-8 text-center"
      >
        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <p className="text-slate-300 text-sm font-medium">
            {message || 'Sign in with Google to generate and manage your QR Codes.'}
          </p>
          <button
            onClick={async () => {
              setIsSigningIn(true)
              await signInWithGoogle()
              setIsSigningIn(false)
            }}
            disabled={isSigningIn}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-slate-900 font-semibold text-sm transition-all duration-200 shadow-lg active:scale-[0.98] disabled:opacity-70"
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
