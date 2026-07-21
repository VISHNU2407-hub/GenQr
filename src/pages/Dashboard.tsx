import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRefresh } from '../contexts/RefreshContext'
import { getUserProfile, formatTimestamp } from '../utils/firestore'
import { Zap, Sparkles, ArrowRight } from 'lucide-react'
import StatsDashboard from '../components/StatsDashboard'

// ─── Dashboard Skeleton ──────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-cream-bg pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="h-9 bg-secondary/60 rounded-lg w-64" />
              <div className="h-4 bg-secondary/40 rounded w-48" />
            </div>
            <div className="h-10 bg-secondary/40 rounded-xl w-36" />
          </div>
        </div>
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 sm:p-5">
              <div className="w-9 h-9 rounded-xl bg-secondary/60 mb-3" />
              <div className="h-8 bg-secondary/60 rounded w-16 mb-1" />
              <div className="h-3 bg-secondary/40 rounded w-20" />
            </div>
          ))}
        </div>
        {/* Skeleton charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-5">
            <div className="h-4 bg-secondary/60 rounded w-36 mb-5" />
            <div className="h-52 bg-secondary/30 rounded-xl" />
          </div>
          <div className="card p-5">
            <div className="h-4 bg-secondary/60 rounded w-36 mb-5" />
            <div className="h-52 bg-secondary/30 rounded-xl" />
          </div>
        </div>
        {/* Skeleton plan card */}
        <div className="card p-5 bg-primary-light/50 animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-primary/20" />
            <div className="space-y-2">
              <div className="h-4 bg-primary/20 rounded w-24" />
              <div className="h-3 bg-primary/10 rounded w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { refreshSignal } = useRefresh()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const p = await getUserProfile(user.uid)
        if (!cancelled) setProfile(p)
      } catch (err) {
        if (!cancelled) console.error('Failed to load dashboard:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user, refreshSignal])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-cream-bg pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
                Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
              </h1>
              <p className="mt-2 text-text-secondary">
                Your QR code statistics at a glance.
              </p>
              {profile?.createdAt && (
                <p className="text-xs text-text-secondary/60 mt-1">
                  Member since {formatTimestamp(profile.createdAt)}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Zap className="w-4 h-4" />
              Generate QR
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Stats Dashboard */}
        <StatsDashboard />

        {/* Free Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6 card p-5 bg-primary-light/50 border-primary/15"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-text-primary font-semibold text-sm">{profile?.plan || 'Free'} Plan</h3>
                <p className="text-xs text-text-secondary">You're on the {profile?.plan || 'Free'} plan. Enjoy unlimited QR generation!</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-text-primary text-sm font-medium transition-all border border-border hover:border-primary/20 whitespace-nowrap">
              Upgrade (Coming Soon)
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
