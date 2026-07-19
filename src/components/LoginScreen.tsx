import { useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, LogIn, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return
    setIsSigningIn(true)
    setError(null)

    const result = await signInWithGoogle()
    
    if (!result.success && result.error) {
      setError(result.error)
    }
    
    setIsSigningIn(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden px-4">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Glass card */}
        <div className="glass-card p-8 sm:p-10">
          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              GenQR
            </h1>
            <p className="mt-2 text-slate-400 text-sm text-center">
              Sign in to generate, customize, and manage your QR codes
            </p>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Google Sign In Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="relative w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-slate-900 font-semibold text-sm transition-all duration-200 shadow-lg shadow-white/10 hover:shadow-white/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 group"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Footer text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-center text-xs text-slate-500"
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </div>

        {/* Features hint */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500"
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
            Free to use
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
            Unlimited QR codes
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
            Save your history
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}
