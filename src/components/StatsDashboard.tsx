import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode, Download, Share2, Star, BarChart3, PieChart,
  Activity, CalendarDays, Sparkles, Loader2,
  ArrowUp, ArrowDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useRefresh } from '../contexts/RefreshContext'
import {
  getUserProfile,
  getRecentActivities,
  getDailyActivityCounts,
  getQRTypeDistribution,
  formatTimestampRelative,
  type UserProfile,
  type ActivityLogEntry,
} from '../utils/firestore'

const PIE_COLORS = ['#234F3D', '#4E8B6D', '#6FB089', '#E9A23B', '#D65A5A', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316', '#64748B', '#14B8A6', '#E11D48']

const ACTIVITY_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  generated: { label: 'Created', icon: QrCode },
  downloaded: { label: 'Downloaded', icon: Download },
  shared: { label: 'Shared', icon: Share2 },
  batch_generated: { label: 'Generated Batch', icon: BarChart3 },
  favorite_added: { label: 'Added Favorite', icon: Star },
  favorite_removed: { label: 'Removed Favorite', icon: Star },
}

const QR_TYPE_LABELS: Record<string, string> = {
  'website': 'Website', 'wifi': 'WiFi', 'business-card': 'Business Card',
  'email': 'Email', 'phone': 'Phone', 'sms': 'SMS',
  'whatsapp': 'WhatsApp', 'location': 'Location', 'event': 'Event',
  'restaurant-menu': 'Restaurant Menu', 'portfolio': 'Portfolio',
  'text': 'Text', 'social-media': 'Social Media', 'batch-qr': 'Batch QR', 'batch': 'Batch',
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = display
    const diff = safeValue - start
    if (diff === 0) return
    if (isNaN(diff)) { setDisplay(0); return }
    const duration = 600
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue])
  return <>{display.toLocaleString()}{suffix}</>
}

function StatCard({ label, value, icon: Icon, bgColor, iconColor, trend, trendLabel }: {
  label: string; value: number; icon: typeof QrCode; bgColor: string; iconColor: string
  trend?: 'up' | 'down' | null; trendLabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 sm:p-5 hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={'w-9 h-9 rounded-xl ' + bgColor + ' flex items-center justify-center'}>
          <Icon className={'w-4.5 h-4.5 ' + iconColor} />
        </div>
        {trend && (
          <div className={'flex items-center gap-0.5 text-xs font-medium ' + (trend === 'up' ? 'text-success' : 'text-danger')}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trendLabel || ''}
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </motion.div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-sm px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-text-primary">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value} activities</p>
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div className="card-sm px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-text-primary">{QR_TYPE_LABELS[data.name] || data.name}</p>
      <p className="text-sm font-bold text-primary">{data.value} QR codes</p>
    </div>
  )
}

export default function StatsDashboard() {
  const { user } = useAuth()
  const { refreshSignal } = useRefresh()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentActivities, setRecentActivities] = useState<ActivityLogEntry[]>([])
  const [dailyActivity, setDailyActivity] = useState<{ date: string; count: number }[]>([])
  const [typeDistribution, setTypeDistribution] = useState<{ name: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [chartDays, setChartDays] = useState<'7' | '30'>('7')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const loadStats = async () => {
      setLoading(true)
      try {
        const [prof, activities, daily, types] = await Promise.all([
          getUserProfile(user.uid),
          getRecentActivities(user.uid, 20),
          getDailyActivityCounts(user.uid, 30),
          getQRTypeDistribution(user.uid),
        ])
        if (!cancelled) {
          setProfile(prof)
          setRecentActivities(activities)
          setDailyActivity(daily)
          setTypeDistribution(types)
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadStats()
    return () => { cancelled = true }
  }, [user, refreshSignal])

  const insights = useMemo(() => {
    if (!profile) return null
    const totalQR = profile.totalGeneratedQR ?? 0
    const totalDownloads = profile.totalDownloads ?? 0
    const totalShares = profile.totalShares ?? 0
    const totalFavorites = profile.totalFavorites ?? 0
    const totalBatchQRs = profile.totalBatchQRs ?? 0
    const mostUsedType = typeDistribution.length > 0 ? typeDistribution[0].name : null
    // Count occurrences for true "most downloaded/shared" type
    const downloadActivities = recentActivities.filter(a => a.activityType === 'downloaded')
    const downloadTypeCounts = new Map<string, number>()
    downloadActivities.forEach(a => {
      if (a.qrType) downloadTypeCounts.set(a.qrType, (downloadTypeCounts.get(a.qrType) || 0) + 1)
    })
    const mostDownloadedType = downloadTypeCounts.size > 0
      ? Array.from(downloadTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null
    const shareActivities = recentActivities.filter(a => a.activityType === 'shared')
    const shareTypeCounts = new Map<string, number>()
    shareActivities.forEach(a => {
      if (a.qrType) shareTypeCounts.set(a.qrType, (shareTypeCounts.get(a.qrType) || 0) + 1)
    })
    const mostSharedType = shareTypeCounts.size > 0
      ? Array.from(shareTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null
    let avgPerDay = 0
    if (profile.createdAt?.toDate) {
      const daysSinceCreation = Math.max(1, (Date.now() - profile.createdAt.toDate().getTime()) / 86400000)
      avgPerDay = totalQR / daysSinceCreation
    }
    return { totalQR, totalFavorites, totalDownloads, totalShares, totalBatchQRs, mostUsedType, mostDownloadedType, mostSharedType, avgPerDay }
  }, [profile, typeDistribution, recentActivities])

  const filteredChartData = useMemo(() => {
    const days = parseInt(chartDays)
    return dailyActivity.slice(-days)
  }, [dailyActivity, chartDays])

  const thisMonthQRCount = useMemo(() => {
    const now = new Date()
    return dailyActivity
      .filter(d => {
        const [m] = d.date.split(' ')
        const dateMonth = new Date(m + ' 1, 2000').getMonth()
        return dateMonth === now.getMonth()
      })
      .reduce((sum, d) => sum + d.count, 0)
  }, [dailyActivity])

  const computeTrend = (current: number, previous: number): { trend: 'up' | 'down' | null; label: string } | null => {
    if (previous === 0 && current === 0) return null
    if (previous === 0) return { trend: 'up', label: 'New' }
    const pct = Math.round(((current - previous) / previous) * 100)
    if (pct === 0) return null
    return { trend: pct > 0 ? 'up' : 'down', label: Math.abs(pct) + '%' }
  }

  const summaryCards = useMemo(() => {
    if (!profile) return []
    const counts = dailyActivity.map(d => d.count)
    const recentTwoWeeks = counts.slice(-14)
    const recentWeek = recentTwoWeeks.slice(-7)
    const prevWeek = recentTwoWeeks.slice(0, 7)
    const currentWeekTotal = recentWeek.reduce((a, b) => a + b, 0)
    const prevWeekTotal = prevWeek.reduce((a, b) => a + b, 0)
    const trend = computeTrend(currentWeekTotal, prevWeekTotal)
    return [
      { label: 'Total QR Codes', value: profile.totalGeneratedQR ?? 0, icon: QrCode, bgColor: 'bg-primary-light', iconColor: 'text-primary', ...trend },
      { label: 'Favorite QR Codes', value: profile.totalFavorites ?? 0, icon: Star, bgColor: 'bg-warning/10', iconColor: 'text-warning' },
      { label: 'Total Downloads', value: profile.totalDownloads ?? 0, icon: Download, bgColor: 'bg-accent-light', iconColor: 'text-accent' },
      { label: 'Total Shares', value: profile.totalShares ?? 0, icon: Share2, bgColor: 'bg-secondary', iconColor: 'text-text-secondary' },
      { label: 'Batch QR Jobs', value: profile.totalBatchQRs ?? 0, icon: BarChart3, bgColor: 'bg-primary-light', iconColor: 'text-primary' },
      { label: 'This Month Activity', value: thisMonthQRCount ?? 0, icon: CalendarDays, bgColor: 'bg-accent-light', iconColor: 'text-accent' },
    ]
  }, [profile, dailyActivity, thisMonthQRCount])

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            bgColor={card.bgColor}
            iconColor={card.iconColor}
            trend={'trend' in card ? (card as any).trend : null}
            trendLabel={'label' in card ? (card as any).label : undefined}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">QR Generation Activity</h3>
                <p className="text-xs text-text-secondary/60">Daily activity over time</p>
              </div>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-secondary/40 border border-border">
              <button onClick={() => setChartDays('7')} className={'px-3 py-1.5 rounded-md text-xs font-medium transition-all ' + (chartDays === '7' ? 'bg-card-bg text-text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text-primary')}>7 Days</button>
              <button onClick={() => setChartDays('30')} className={'px-3 py-1.5 rounded-md text-xs font-medium transition-all ' + (chartDays === '30' ? 'bg-card-bg text-text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text-primary')}>30 Days</button>
            </div>
          </div>
          <div className="h-52 sm:h-60">
            {filteredChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData} barCategoryGap="20%">
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6F6F6F' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6F6F6F' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(35, 79, 61, 0.06)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#234F3D" maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Activity className="w-10 h-10 text-text-secondary/20 mb-3" />
                <p className="text-sm text-text-secondary/50">No activity data yet</p>
                <p className="text-xs text-text-secondary/30 mt-1">Generate QR codes to see activity here</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <PieChart className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">QR Type Distribution</h3>
              <p className="text-xs text-text-secondary/60">Breakdown by category</p>
            </div>
          </div>
          <div className="h-52 sm:h-60">
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                    {typeDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend verticalAlign="bottom" height={36}
                    formatter={(value: string) => <span className="text-xs text-text-secondary">{QR_TYPE_LABELS[value] || value}</span>}
                    iconSize={8} iconType="circle"
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <PieChart className="w-10 h-10 text-text-secondary/20 mb-3" />
                <p className="text-sm text-text-secondary/50">No distribution data yet</p>
                <p className="text-xs text-text-secondary/30 mt-1">Create different types of QR codes to populate</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
            </div>
            <span className="text-xs text-text-secondary/50">{recentActivities.length} events</span>
          </div>
          <AnimatePresence mode="popLayout">
            {recentActivities.length > 0 ? (
              <div className="space-y-1">
                {recentActivities.slice(0, 10).map((activity, index) => {
                  const info = ACTIVITY_LABELS[activity.activityType]
                  const ActivityIcon = info?.icon || Activity
                  const typeLabel = QR_TYPE_LABELS[activity.qrType || ''] || activity.qrType || ''
                  let description = ''
                  if (activity.activityType === 'batch_generated') {
                    description = activity.qrName || 'Batch (' + (activity.batchCount || '?') + ')'
                  } else if (activity.qrType && activity.activityType !== 'favorite_added' && activity.activityType !== 'favorite_removed') {
                    description = typeLabel + ' QR'
                  }
                  return (
                    <motion.div key={activity.id || index} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/20 transition-colors">
                      <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (activity.activityType === 'favorite_added' ? 'bg-warning/10 text-warning' : activity.activityType === 'favorite_removed' ? 'bg-danger/10 text-danger' : 'bg-secondary/40 text-text-secondary')}>
                        <ActivityIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary">
                          <span className="font-medium">{info?.label || activity.activityType}</span>
                          {description && <span className="text-text-secondary"> {description}</span>}
                        </p>
                        {activity.qrContent && (
                          <p className="text-xs text-text-secondary/50 truncate mt-0.5 font-mono">{activity.qrContent}</p>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary/40 flex-shrink-0">
                        {activity.timestamp ? formatTimestampRelative(activity.timestamp) : ''}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="w-10 h-10 text-text-secondary/20 mb-3" />
                <p className="text-sm text-text-secondary/50">No recent activity</p>
                <p className="text-xs text-text-secondary/30 mt-1">Your actions will appear here</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-warning" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Insights</h3>
          </div>
          {insights ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-primary-light/50 border border-primary/10">
                <p className="text-2xl font-bold text-primary">{insights.totalQR}</p>
                <p className="text-xs text-text-secondary mt-0.5">Total QR Codes Generated</p>
              </div>
              <div className="p-3.5 rounded-xl bg-accent-light/50 border border-accent/10">
                <p className="text-lg font-bold text-accent">{insights.mostUsedType ? QR_TYPE_LABELS[insights.mostUsedType] || insights.mostUsedType : '—'}</p>
                <p className="text-xs text-text-secondary mt-0.5">Most Used QR Type</p>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                <p className="text-lg font-bold text-text-primary">{insights.mostDownloadedType ? QR_TYPE_LABELS[insights.mostDownloadedType] || insights.mostDownloadedType : '—'}</p>
                <p className="text-xs text-text-secondary mt-0.5">Most Downloaded</p>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                <p className="text-lg font-bold text-text-primary">{insights.mostSharedType ? QR_TYPE_LABELS[insights.mostSharedType] || insights.mostSharedType : '—'}</p>
                <p className="text-xs text-text-secondary mt-0.5">Most Shared</p>
              </div>
              <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/15">
                <p className="text-xl font-bold text-warning">{insights.totalFavorites}</p>
                <p className="text-xs text-text-secondary mt-0.5">Favorite QR Codes</p>
              </div>
              <div className="p-3.5 rounded-xl bg-primary-light/50 border border-primary/10">
                <p className="text-xl font-bold text-primary">{insights.avgPerDay.toFixed(1)}</p>
                <p className="text-xs text-text-secondary mt-0.5">Avg QR Per Day</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Sparkles className="w-10 h-10 text-text-secondary/20 mb-3" />
              <p className="text-sm text-text-secondary/50">No insights yet</p>
              <p className="text-xs text-text-secondary/30 mt-1">Generate more QR codes to see insights</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
