import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import {
  getUserQRCodes,
  deleteQRCode,
  duplicateQRCode,
  incrementDownloadCount,
  formatTimestampRelative,
  logActivity,
  type GeneratedQR,
} from '../utils/firestore'
import { renderQRFromStoredData } from '../utils/qrRenderer'
import { useRefresh } from '../contexts/RefreshContext'
import {
  QrCode, Search, Trash2, Copy, Download, ChevronRight,
  Loader2, X, ArrowUpDown, Check,
  Filter, ChevronDown, Star,
} from 'lucide-react'
import Toast from '../components/Toast'
import ShareMenu from '../components/ShareMenu'
import { toggleFavorite } from '../utils/firestore'

const QR_TYPE_LABELS: Record<string, string> = {
  'website': 'Website',
  'wifi': 'WiFi',
  'business-card': 'Business Card',
  'email': 'Email',
  'phone': 'Phone',
  'sms': 'SMS',
  'whatsapp': 'WhatsApp',
  'location': 'Location',
  'event': 'Event',
  'restaurant-menu': 'Restaurant Menu',
  'portfolio': 'Portfolio',
  'text': 'Text',
  'social-media': 'Social Media',
}

const ALL_QR_TYPES = Object.keys(QR_TYPE_LABELS)

const SORT_OPTIONS: { value: 'newest' | 'oldest' | 'az' | 'za'; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'az', label: 'Alphabetical (A–Z)' },
  { value: 'za', label: 'Alphabetical (Z–A)' },
]

// ─── Skeleton Loader ────────────────────────────────────

function QRSkeleton() {
  return (
    <div className="card-sm p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-secondary/60" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-secondary/60 rounded w-24" />
          <div className="h-2.5 bg-secondary/40 rounded w-16" />
        </div>
        <div className="w-9 h-9 rounded-xl bg-secondary/40" />
      </div>
      <div className="h-3 bg-secondary/40 rounded w-full mb-3" />
      <div className="flex gap-3 mb-3">
        <div className="h-3 bg-secondary/40 rounded w-12" />
        <div className="h-3 bg-secondary/40 rounded w-14" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-8 bg-secondary/40 rounded-lg" />
        <div className="flex-1 h-8 bg-secondary/40 rounded-lg" />
        <div className="flex-1 h-8 bg-secondary/40 rounded-lg" />
        <div className="w-8 h-8 bg-secondary/40 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Pending Operations Tracker ──────────────────────────

const pendingOps = new Map<string, 'deleting' | 'favoriting' | 'downloading' | 'duplicating'>()

function isPending(id: string): boolean {
  return pendingOps.has(id)
}

function markPending(id: string, op: 'deleting' | 'favoriting' | 'downloading' | 'duplicating'): boolean {
  if (pendingOps.has(id)) return false
  pendingOps.set(id, op)
  return true
}

function clearPending(id: string): void {
  pendingOps.delete(id)
}

export default function MyQRCodes() {
  const { user } = useAuth()
  const [allQRCodes, setAllQRCodes] = useState<GeneratedQR[]>([])
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const { triggerRefresh, refreshSignal } = useRefresh()
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search with 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showFilterDropdown && !showSortDropdown) return
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false)
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFilterDropdown(false)
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showFilterDropdown, showSortDropdown])

  const loadQRCodes = useCallback(async (loadMore = false) => {
    if (!user) return
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoadingInitial(true)
    }
    try {
      const result = await getUserQRCodes(user.uid, {
        pageSize: 12,
        lastDoc: loadMore ? lastDoc : undefined,
        sortBy: 'newest',
      })
      setAllQRCodes((prev) => {
        if (!loadMore) return result.qrs
        const existingIds = new Set(prev.map((qr) => qr.id))
        const newQrs = result.qrs.filter((qr) => !existingIds.has(qr.id))
        return [...prev, ...newQrs]
      })
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('Failed to load QR codes:', err)
      setToast({ message: 'Failed to load QR codes', type: 'error' })
    } finally {
      setLoadingInitial(false)
      setLoadingMore(false)
    }
  }, [user, lastDoc])

  useEffect(() => {
    loadQRCodes(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps — intentionally runs only on mount
  }, [])

  useEffect(() => {
    if (refreshSignal > 0) {
      setLastDoc(null)
      setAllQRCodes([])
      loadQRCodes(false)
    }
  }, [refreshSignal, loadQRCodes])

  // ─── Client-side search, filter, sort ──────────────────

  const displayQRCodes = useMemo(() => {
    let result = allQRCodes

    // Filter by favorites or type
    if (filterType === 'favorites') {
      result = result.filter((qr) => qr.favorite === true)
    } else if (filterType !== 'all') {
      result = result.filter((qr) => qr.type === filterType)
    }

    // Filter by search term
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim()
      result = result.filter((qr) => {
        const typeLabel = QR_TYPE_LABELS[qr.type] || qr.type || ''
        return (
          typeLabel.toLowerCase().includes(term) ||
          (qr.type || '').toLowerCase().includes(term) ||
          (qr.content || '').toLowerCase().includes(term)
        )
      })
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)
        case 'oldest':
          return (a.createdAt?.toDate?.()?.getTime() || 0) - (b.createdAt?.toDate?.()?.getTime() || 0)
        case 'az':
          return (QR_TYPE_LABELS[a.type] || a.type || '').localeCompare(QR_TYPE_LABELS[b.type] || b.type || '')
        case 'za':
          return (QR_TYPE_LABELS[b.type] || b.type || '').localeCompare(QR_TYPE_LABELS[a.type] || a.type || '')
      }
    })

    return result
  }, [allQRCodes, filterType, debouncedSearch, sortBy])

  const hasActiveFilters = filterType !== 'all' || debouncedSearch.trim() !== '' || sortBy !== 'newest'

  const clearFilters = useCallback(() => {
    setFilterType('all')
    setSearchInput('')
    setDebouncedSearch('')
    setSortBy('newest')
    searchInputRef.current?.focus()
  }, [])

  // ─── Actions (Optimistic UI) ──────────────────────────

  const handleDelete = async (qrId: string) => {
    if (!user) return
    // Prevent duplicate delete requests
    if (!markPending(qrId, 'deleting')) return

    // Store the QR code for potential rollback
    const qrToDelete = allQRCodes.find((qr) => qr.id === qrId)

    // Optimistic: remove from UI immediately
    setAllQRCodes((prev) => prev.filter((qr) => qr.id !== qrId))

    try {
      await deleteQRCode(qrId, user.uid)
      triggerRefresh()
    } catch {
      // Rollback: restore the QR code if deletion fails
      if (qrToDelete) {
        setAllQRCodes((prev) => [...prev, qrToDelete])
      }
      setToast({ message: 'Failed to delete QR code', type: 'error' })
    } finally {
      clearPending(qrId)
    }
  }

  const handleDownloadCount = async (qrId: string, qrType?: string, qrContent?: string) => {
    if (!user) return

    // Optimistic: download immediately (file download), then async count
    // Update count optimistically in the UI
    setAllQRCodes((prev) =>
      prev.map((qr) =>
        qr.id === qrId ? { ...qr, downloadCount: (qr.downloadCount ?? 0) + 1 } : qr
      )
    )

    try {
      await incrementDownloadCount(qrId, user.uid)
      triggerRefresh()
      // Log activity
      logActivity(user.uid, {
        activityType: 'downloaded',
        qrType,
        qrContent,
      }).catch((err) => console.warn('Failed to log activity:', err))
    } catch {
      // Rollback: decrement the count
      setAllQRCodes((prev) =>
        prev.map((qr) =>
          qr.id === qrId ? { ...qr, downloadCount: Math.max(0, (qr.downloadCount ?? 1) - 1) } : qr
        )
      )
      setToast({ message: 'Failed to track download', type: 'error' })
    }
  }

  const handleDuplicate = async (qrId: string) => {
    if (!user) return
    if (!markPending(qrId, 'duplicating')) return

    try {
      await duplicateQRCode(qrId, user.uid)
      setToast({ message: 'QR code duplicated', type: 'success' })
      triggerRefresh()
      setLastDoc(null)
      setAllQRCodes([])
      loadQRCodes(false)
    } catch {
      setToast({ message: 'Failed to duplicate QR code', type: 'error' })
    } finally {
      clearPending(qrId)
    }
  }

  const handleToggleFavorite = async (qrId: string, currentFavorite: boolean, qrType?: string, qrContent?: string) => {
    if (!user) return
    // Prevent duplicate favorite toggles
    if (!markPending(qrId, 'favoriting')) return

    // Optimistic: toggle immediately
    const newFavState = !currentFavorite
    setAllQRCodes((prev) =>
      prev.map((qr) =>
        qr.id === qrId ? { ...qr, favorite: newFavState } : qr
      )
    )

    try {
      await toggleFavorite(qrId, user.uid, currentFavorite)
      triggerRefresh()
      // Log activity
      logActivity(user.uid, {
        activityType: newFavState ? 'favorite_added' : 'favorite_removed',
        qrType,
        qrContent,
      }).catch((err) => console.warn('Failed to log activity:', err))
    } catch {
      // Rollback: revert to original state
      setAllQRCodes((prev) =>
        prev.map((qr) =>
          qr.id === qrId ? { ...qr, favorite: currentFavorite } : qr
        )
      )
      setToast({ message: 'Failed to update favorite', type: 'error' })
    } finally {
      clearPending(qrId)
    }
  }

  const handleDownload = async (qr: GeneratedQR) => {
    if (!user) return

    try {
      const blob = await renderQRFromStoredData({
        content: qr.content,
        style: qr.style,
        colors: qr.colors,
        frame: qr.frame,
      }, 1024)

      if (!blob) {
        setToast({ message: 'Failed to generate QR image', type: 'error' })
        return
      }

      const fileName = `genqr-${qr.type || 'code'}.png`
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = fileName
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setToast({ message: 'QR code downloaded!', type: 'success' })

      // Increment download count (fire-and-forget, with its own error handling)
      handleDownloadCount(qr.id!, qr.type, qr.content)
    } catch (err) {
      console.error('Download failed:', err)
      setToast({ message: 'Failed to download QR code', type: 'error' })
    }
  }

  const isLoading = loadingInitial
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sort'

  return (
    <div className="min-h-screen bg-cream-bg pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            My QR Codes
          </h1>
          <p className="mt-2 text-text-secondary text-sm">
            Browse, search, and manage all your generated QR codes
          </p>
        </motion.div>

        {/* Search, Filter & Sort Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, type, or content..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl input-field"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setDebouncedSearch('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setShowFilterDropdown((prev) => !prev); setShowSortDropdown(false) }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 ${
                  filterType !== 'all'
                    ? 'bg-primary-light border-primary/30 text-primary'
                    : 'bg-card-bg border-border text-text-primary hover:bg-secondary/30'
                }`}
              >
                {filterType === 'favorites' ? (
                  <Star className={`w-4 h-4 ${filterType === 'favorites' ? 'fill-primary' : ''}`} />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {filterType === 'favorites' ? 'Favorites' : filterType !== 'all' ? QR_TYPE_LABELS[filterType] || filterType : 'Filter'}
                </span>
                <span className="sm:hidden">
                  {filterType === 'favorites' ? 'Favs' : filterType !== 'all' ? QR_TYPE_LABELS[filterType] || 'Filter' : 'Type'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 8 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    className="absolute right-0 z-50 mt-1 w-52 card shadow-lg border-border overflow-hidden max-h-72 overflow-y-auto"
                  >
                    <div className="py-1">
                      {/* All option */}
                      <button
                        onClick={() => { setFilterType('all'); setShowFilterDropdown(false) }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                          filterType === 'all'
                            ? 'bg-primary-light text-primary font-medium'
                            : 'text-text-primary hover:bg-secondary/30'
                        }`}
                      >
                        <span className="flex-1">All Types</span>
                        {filterType === 'all' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <hr className="divider my-1" />
                      {/* Favorites filter */}
                      <button
                        onClick={() => { setFilterType('favorites'); setShowFilterDropdown(false) }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                          filterType === 'favorites'
                            ? 'bg-primary-light text-primary font-medium'
                            : 'text-text-primary hover:bg-secondary/30'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${filterType === 'favorites' ? 'fill-primary' : ''}`} />
                        <span className="flex-1">Favorites</span>
                        {filterType === 'favorites' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <hr className="divider my-1" />
                      {ALL_QR_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => { setFilterType(type); setShowFilterDropdown(false) }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                            filterType === type
                              ? 'bg-primary-light text-primary font-medium'
                              : 'text-text-primary hover:bg-secondary/30'
                          }`}
                        >
                          <span className="flex-1">{QR_TYPE_LABELS[type] || type}</span>
                          {filterType === type && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setShowSortDropdown((prev) => !prev); setShowFilterDropdown(false) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card-bg text-text-primary hover:bg-secondary/30 text-sm transition-all duration-200"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <span className="sm:hidden">Sort</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 8 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    className="absolute right-0 z-50 mt-1 w-52 card shadow-lg border-border overflow-hidden"
                  >
                    <div className="py-1">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setShowSortDropdown(false) }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                            sortBy === opt.value
                              ? 'bg-primary-light text-primary font-medium'
                              : 'text-text-primary hover:bg-secondary/30'
                          }`}
                        >
                          <span className="flex-1">{opt.label}</span>
                          {sortBy === opt.value && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Active Filters Chips */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 mb-4"
          >
            <span className="text-xs text-text-secondary/60">Active filters:</span>
            {filterType === 'favorites' && (
              <span className="badge gap-1.5">
                <Star className="w-3 h-3 fill-primary" />
                Favorites
              </span>
            )}
            {filterType !== 'all' && filterType !== 'favorites' && (
              <span className="badge gap-1.5">
                <Filter className="w-3 h-3" />
                {QR_TYPE_LABELS[filterType] || filterType}
              </span>
            )}
            {debouncedSearch.trim() && (
              <span className="badge gap-1.5">
                <Search className="w-3 h-3" />
                "{debouncedSearch.trim()}"
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="badge gap-1.5">
                <ArrowUpDown className="w-3 h-3" />
                {currentSortLabel}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-text-secondary hover:text-text-primary hover:bg-secondary/40 transition-all"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          </motion.div>
        )}

        {/* QR Codes Grid or Skeleton / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <QRSkeleton />
              </motion.div>
            ))}
          </div>
        ) : displayQRCodes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/40 flex items-center justify-center">
              {filterType === 'favorites' ? (
                <Star className="w-8 h-8 text-warning" />
              ) : (
                <QrCode className="w-8 h-8 text-text-secondary/40" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {filterType === 'favorites'
                ? 'No favorite QR codes yet'
                : allQRCodes.length === 0
                  ? 'No QR codes yet'
                  : 'No QR codes found'}
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto">
              {filterType === 'favorites'
                ? 'Star your favorite QR codes to access them quickly'
                : allQRCodes.length === 0
                  ? 'Generate your first QR code to see it here'
                  : 'No QR codes match your current search or filter. Try different criteria.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {filterType === 'favorites' ? (
                <button onClick={() => setFilterType('all')} className="btn-secondary inline-flex items-center gap-2 text-sm px-6 py-2.5">
                  <QrCode className="w-4 h-4" />
                  Browse QR Codes
                </button>
              ) : allQRCodes.length === 0 ? (
                <a href="/" className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5">
                  <QrCode className="w-4 h-4" />
                  Generate QR Code
                </a>
              ) : (
                <button onClick={clearFilters} className="btn-secondary inline-flex items-center gap-2 text-sm px-6 py-2.5">
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-secondary/60">
                Showing {displayQRCodes.length} of {allQRCodes.length} QR code{allQRCodes.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayQRCodes.map((qr, index) => (
                <motion.div
                  key={qr.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className="card-sm p-4 hover:border-primary/20 transition-all duration-200 group"
                >
                  {/* QR Icon & Type */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate capitalize">
                        {QR_TYPE_LABELS[qr.type] || qr.type?.replace(/-/g, ' ') || 'QR Code'}
                      </p>
                      {qr.createdAt && (
                        <p className="text-xs text-text-secondary/60">
                          {formatTimestampRelative(qr.createdAt)}
                        </p>
                      )}
                    </div>
                    {/* Favorites star button - Optimistic (instant toggle) */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(qr.id!, !!qr.favorite, qr.type, qr.content)
                      }}
                      disabled={isPending(qr.id!)}
                      whileTap={{ scale: 0.85 }}
                      className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 flex-shrink-0 ${
                        qr.favorite
                          ? 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20'
                          : 'bg-secondary/30 border-border text-text-secondary/50 hover:text-warning hover:border-warning/30 hover:bg-warning/5'
                      }`}
                      aria-label={qr.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        className={`w-4 h-4 transition-all duration-200 ${
                          qr.favorite ? 'fill-warning stroke-warning' : ''
                        }`}
                      />
                    </motion.button>
                  </div>

                  {/* Content Preview */}
                  <p className="text-xs text-text-secondary/60 truncate mb-3 font-mono">
                    {qr.content || 'No content'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-text-secondary/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {qr.downloadCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      {qr.scanCount ?? 0} scans
                    </span>
                  </div>

                  {/* Actions - Optimistic (instant, no spinners) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(qr)}
                      disabled={isPending(qr.id!)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border text-xs text-text-secondary hover:text-text-primary transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <ShareMenu
                      qr={qr}
                      onToast={(message, type) => setToast({ message, type })}
                    />
                    <button
                      onClick={() => handleDuplicate(qr.id!)}
                      disabled={isPending(qr.id!)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border text-xs text-text-secondary hover:text-text-primary transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(qr.id!)}
                      disabled={isPending(qr.id!)}
                      className="flex items-center justify-center px-3 py-2 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/10 text-xs text-danger hover:text-danger/80 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex items-center justify-center mt-8">
                <button
                  onClick={() => loadQRCodes(true)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-secondary text-sm disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  Load More
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
