import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { formatTimestamp, getUserProfile, type UserProfile } from '../utils/firestore'
import { QrCode, Download, Eye, LogOut, Calendar, Mail, Shield, User, Loader2, AlertCircle } from 'lucide-react'
import Toast from '../components/Toast'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fetch fresh profile data directly from Firestore on mount
  useEffect(() => {
    if (!user) return

    let cancelled = false
    setProfileLoading(true)
    setProfileError(null)

    getUserProfile(user.uid)
      .then((profile) => {
        if (!cancelled) {
          setLocalProfile(profile)
          setProfileLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to fetch profile:', err)
          setProfileError('Failed to load profile data')
          setProfileLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      setToast({ message: 'Logged out successfully', type: 'success' })
      setTimeout(() => navigate('/'), 500)
    } catch {
      setToast({ message: 'Failed to logout', type: 'error' })
    } finally {
      setLoggingOut(false)
    }
  }

  const stats = [
    { label: 'QR Generated', value: localProfile?.totalGeneratedQR ?? 0, icon: QrCode, color: 'from-primary/20 to-accent/20', iconColor: 'text-primary' },
    { label: 'Downloads', value: localProfile?.totalDownloads ?? 0, icon: Download, color: 'from-emerald-500/20 to-green-500/20', iconColor: 'text-emerald-400' },
    { label: 'Scans', value: localProfile?.totalScans ?? 0, icon: Eye, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
  ]

  return (
    <div className="min-h-screen bg-dark-bg pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-dark-bg shadow-xl">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-dark-bg flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center px-6 pb-6">
            <h1 className="text-xl font-bold text-white">
              {user?.displayName || 'User'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
            
            {/* Plan Badge */}
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-xs font-medium text-primary">
              <Shield className="w-3.5 h-3.5" />
              {localProfile?.plan || 'Free'} Plan
            </div>

            {/* Join Date */}
            {localProfile?.createdAt && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatTimestamp(localProfile.createdAt)}</span>
              </div>
            )}

            {/* Last Login */}
            {localProfile?.lastLogin && (
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5" />
                <span>Last login via Google</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Loading State */}
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : profileError ? (
            <div className="flex items-center justify-center gap-2 py-8 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{profileError}</span>
            </div>
          ) : (
            /* Stats */
            <div className="grid grid-cols-3 gap-4 p-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="text-center"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Actions */}
          <div className="p-6 space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all"
            >
              <QrCode className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => navigate('/my-qr-codes')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all"
            >
              <QrCode className="w-4 h-4" />
              My QR Codes
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-sm font-medium text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </motion.div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          isVisible={true}
          onClose={() => setToast(null)}
          type={toast.type}
        />
      )}
    </div>
  )
}
