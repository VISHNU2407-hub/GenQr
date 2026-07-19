import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserProfile, getUserQRCodes, formatTimestamp, type UserProfile, type GeneratedQR } from '../utils/firestore'
import { QrCode, Zap, Download, BarChart3, Sparkles, ArrowRight, Clock, Eye, Activity, Loader2, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recentQRs, setRecentQRs] = useState<GeneratedQR[]>([])
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const loadDashboard = async () => {
      try {
        // Fetch both fresh profile data and recent QR codes in parallel
        const [profile, qrResult] = await Promise.all([
          getUserProfile(user.uid),
          getUserQRCodes(user.uid, { pageSize: 5, sortBy: 'newest' }),
        ])

        if (!cancelled) {
          setLocalProfile(profile)
          setRecentQRs(qrResult.qrs)
          setProfileError(null)
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load dashboard data:', err)
          if (err?.code === 'failed-precondition') {
            setProfileError('Database indexes are being created. Please wait a moment and refresh.')
          } else {
            setProfileError('Failed to load dashboard data')
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [user])

  const stats = [
    {
      label: 'Total QR Generated',
      value: localProfile?.totalGeneratedQR ?? 0,
      icon: QrCode,
      color: 'from-primary/20 to-accent/20',
      iconColor: 'text-primary',
    },
    {
      label: 'Total Downloads',
      value: localProfile?.totalDownloads ?? 0,
      icon: Download,
      color: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Total Scans',
      value: localProfile?.totalScans ?? 0,
      icon: Eye,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Account Plan',
      value: localProfile?.plan ?? 'Free',
      icon: Sparkles,
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
    },
  ]

  const quickActions = [
    { label: 'New QR Code', icon: Zap, onClick: () => navigate('/'), color: 'from-primary to-accent' },
    { label: 'My QR Codes', icon: QrCode, onClick: () => navigate('/my-qr-codes'), color: 'from-emerald-500 to-green-600' },
    { label: 'Profile', icon: BarChart3, onClick: () => navigate('/profile'), color: 'from-purple-500 to-pink-600' },
  ]

  return (
    <div className="min-h-screen bg-dark-bg pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 text-slate-400">
            Here's what's happening with your QR codes today.
          </p>
          {localProfile?.createdAt && (
            <p className="text-xs text-slate-500 mt-1">
              Member since {formatTimestamp(localProfile.createdAt)}
            </p>
          )}
        </motion.div>

        {/* Quick Generate Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Quick Generate</h3>
                <p className="text-xs text-slate-400">Create a new QR code in seconds</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 whitespace-nowrap"
            >
              <QrCode className="w-4 h-4" />
              Generate QR
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="glass-card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions & Recent QR Codes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-200 group"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 ml-auto group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent QR Codes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-white font-semibold text-sm">Recent QR Codes</h3>
                </div>
                <button
                  onClick={() => navigate('/my-qr-codes')}
                  className="text-xs text-primary hover:text-primary-hover transition-colors"
                >
                  View all
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : recentQRs.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No QR codes yet</p>
                  <p className="text-xs text-slate-600 mt-1">Generate your first QR code to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentQRs.map((qr, index) => (
                    <div
                      key={qr.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-5 h-5 text-primary/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300 truncate capitalize">
                          {qr.type?.replace(/-/g, ' ') || 'QR Code'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{qr.content}</p>
                      </div>
                      <div className="text-xs text-slate-500 flex-shrink-0">
                        {/* Timestamp - would need to format */}
                        {qr.createdAt ? 'Recent' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Free Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass-card p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/10"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Free Plan</h3>
                <p className="text-xs text-slate-400">You're on the Free plan. Enjoy unlimited QR generation!</p>
              </div>
            </div>
            <button className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all border border-white/10 hover:border-white/20">
              Upgrade (Coming Soon)
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
