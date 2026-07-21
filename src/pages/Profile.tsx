import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRefresh } from '../contexts/RefreshContext'
import { formatTimestamp, getUserProfile, type UserProfile } from '../utils/firestore'
import { QrCode, Download, Eye, LogOut, Calendar, Mail, Shield, User, Loader2, AlertCircle } from 'lucide-react'
import Toast from '../components/Toast'

export default function Profile() {
  const { user, logout } = useAuth()
  const { refreshSignal } = useRefresh()
  const navigate = useNavigate()
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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

    return () => { cancelled = true }
  }, [user, refreshSignal])

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
    { label: 'QR Generated', value: localProfile?.totalGeneratedQR ?? 0, icon: QrCode, bgColor: 'bg-primary-light', iconColor: 'text-primary' },
    { label: 'Downloads', value: localProfile?.totalDownloads ?? 0, icon: Download, bgColor: 'bg-accent-light', iconColor: 'text-accent' },
    { label: 'Scans', value: localProfile?.totalScans ?? 0, icon: Eye, bgColor: 'bg-secondary', iconColor: 'text-text-secondary' },
  ]

  return (
    <div className="min-h-screen bg-cream-bg pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden"
        >
          {/* Header with subtle pattern */}
          <div className="h-32 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 relative">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 20px 20px, #234F3D 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-cream-bg shadow-sm">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-cream-bg flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center px-6 pb-6">
            <h1 className="text-xl font-bold text-text-primary">
              {user?.displayName || 'User'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">{user?.email}</p>
            
            {/* Plan Badge */}
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-primary-light border border-primary/20 text-xs font-medium text-primary">
              <Shield className="w-3.5 h-3.5" />
              {localProfile?.plan || 'Free'} Plan
            </div>

            {/* Join Date */}
            {localProfile?.createdAt && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-text-secondary/60">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatTimestamp(localProfile.createdAt)}</span>
              </div>
            )}

            {/* Last Login */}
            {localProfile?.lastLogin && (
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-text-secondary/60">
                <Mail className="w-3.5 h-3.5" />
                <span>Last login via Google</span>
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Loading State - Skeleton */}
          {profileLoading ? (
            <div className="p-6 animate-pulse">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-secondary/60 mx-auto mb-2" />
                    <div className="h-6 bg-secondary/60 rounded w-12 mx-auto mb-1" />
                    <div className="h-3 bg-secondary/40 rounded w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : profileError ? (
            <div className="flex items-center justify-center gap-2 py-8 text-danger">
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
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          <hr className="divider" />

          {/* Actions */}
          <div className="p-6 space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border text-sm font-medium text-text-primary transition-all"
            >
              <QrCode className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => navigate('/my-qr-codes')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border text-sm font-medium text-text-primary transition-all"
            >
              <QrCode className="w-4 h-4" />
              My QR Codes
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-danger/10 hover:bg-danger/20 border border-danger/20 text-sm font-medium text-danger transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
