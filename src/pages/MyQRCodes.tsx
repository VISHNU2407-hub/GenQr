import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import {
  getUserQRCodes,
  deleteQRCode,
  duplicateQRCode,
  formatTimestampRelative,
  type GeneratedQR,
  type QRPaginatedResult,
} from '../utils/firestore'
import { QrCode, Search, ArrowUpDown, Trash2, Copy, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react'
import Toast from '../components/Toast'

export default function MyQRCodes() {
  const { user } = useAuth()
  const [qrData, setQrData] = useState<QRPaginatedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [duplicatingIds, setDuplicatingIds] = useState<Set<string>>(new Set())

  const loadQRCodes = useCallback(async (lastDoc?: any) => {
    if (!user) return
    setLoading(true)
    try {
      const result = await getUserQRCodes(user.uid, {
        pageSize: 12,
        lastDoc,
        sortBy,
        search,
      })
      setQrData(result)
    } catch (err) {
      console.error('Failed to load QR codes:', err)
      setToast({ message: 'Failed to load QR codes', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [user, sortBy, search])

  useEffect(() => {
    loadQRCodes()
  }, [loadQRCodes])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    // Reset pagination on search
    loadQRCodes(undefined)
  }, [loadQRCodes])

  const handleDelete = async (qrId: string) => {
    setDeletingIds((prev) => new Set(prev).add(qrId))
    try {
      await deleteQRCode(qrId)
      setQrData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          qrs: prev.qrs.filter((qr) => qr.id !== qrId),
        }
      })
      setToast({ message: 'QR code deleted', type: 'success' })
    } catch {
      setToast({ message: 'Failed to delete QR code', type: 'error' })
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(qrId)
        return next
      })
    }
  }

  const handleDuplicate = async (qrId: string) => {
    if (!user) return
    setDuplicatingIds((prev) => new Set(prev).add(qrId))
    try {
      await duplicateQRCode(qrId, user.uid)
      setToast({ message: 'QR code duplicated', type: 'success' })
      loadQRCodes()
    } catch {
      setToast({ message: 'Failed to duplicate QR code', type: 'error' })
    } finally {
      setDuplicatingIds((prev) => {
        const next = new Set(prev)
        next.delete(qrId)
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            My QR Codes
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Browse, search, and manage all your generated QR codes
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search QR codes..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortBy((prev) => prev === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </motion.div>

        {/* QR Codes Grid */}
        {loading && !qrData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : qrData?.qrs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <QrCode className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              {search ? 'No matching QR codes found' : 'No QR codes yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {search ? 'Try a different search term' : 'Generate your first QR code to see it here'}
            </p>
            {!search && (
              <a href="/" className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5">
                <QrCode className="w-4 h-4" />
                Generate QR Code
              </a>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrData?.qrs.map((qr, index) => (
                <motion.div
                  key={qr.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card p-4 hover:border-primary/20 transition-all duration-200 group"
                >
                  {/* QR Icon & Type */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate capitalize">
                        {qr.type?.replace(/-/g, ' ') || 'QR Code'}
                      </p>
                      {qr.createdAt && (
                        <p className="text-xs text-slate-500">
                          {formatTimestampRelative(qr.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <p className="text-xs text-slate-500 truncate mb-3 font-mono">
                    {qr.content || 'No content'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {qr.downloadCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      {qr.scanCount ?? 0} scans
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(qr.id!)}
                      disabled={duplicatingIds.has(qr.id!)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 text-xs text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50"
                    >
                      {duplicatingIds.has(qr.id!) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(qr.id!)}
                      disabled={deletingIds.has(qr.id!)}
                      className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-xs text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                    >
                      {deletingIds.has(qr.id!) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {qrData && qrData.hasMore && (
              <div className="flex items-center justify-center mt-8">
                <button
                  onClick={() => loadQRCodes(qrData.lastDoc!)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all hover:border-primary/30"
                >
                  Load More
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
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
