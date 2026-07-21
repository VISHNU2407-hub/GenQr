import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, Image, ClipboardList, Check, Loader2 } from 'lucide-react'
import { renderQRFromStoredData } from '../utils/qrRenderer'
import { logActivity, incrementShareCount } from '../utils/firestore'
import { useAuth } from '../contexts/AuthContext'
import type { GeneratedQR } from '../utils/firestore'

interface ShareMenuProps {
  qr: GeneratedQR
  onToast: (message: string, type: 'success' | 'error') => void
}

type ShareAction = 'share' | 'download' | 'copy-image' | 'copy-text'

export default function ShareMenu({ qr, onToast }: ShareMenuProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeAction, _setActiveAction] = useState<ShareAction | null>(null)
  const [justCopied, setJustCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const getBlob = useCallback(async (): Promise<Blob | null> => {
    return renderQRFromStoredData({
      content: qr.content,
      style: qr.style,
      colors: qr.colors,
      frame: qr.frame,
    })
  }, [qr])

  // Track share activity asynchronously (fire-and-forget)
  const trackShare = useCallback(() => {
    if (user && qr.id) {
      logActivity(user.uid, {
        activityType: 'shared',
        qrType: qr.type,
        qrContent: qr.content,
      }).catch((err) => console.warn('Failed to log activity:', err))
      incrementShareCount(user.uid).catch((err) => console.warn('Failed to increment share count:', err))
    }
  }, [user, qr])

  const performAction = useCallback(async (action: ShareAction) => {
    setIsOpen(false) // Close menu immediately for snappy feel

    if (action === 'copy-text') {
      try {
        await navigator.clipboard.writeText(qr.content)
        setJustCopied(true)
        setTimeout(() => setJustCopied(false), 2000)
        onToast('QR content copied to clipboard', 'success')
      } catch {
        onToast('Failed to copy to clipboard', 'error')
      }
      return
    }

    // Start generating the blob immediately
    let blob: Blob | null = null
    try {
      blob = await getBlob()
    } catch {
      onToast('Failed to generate QR image', 'error')
      return
    }

    if (!blob) {
      onToast('Failed to generate QR image', 'error')
      return
    }

    const fileName = `genqr-${qr.type || 'code'}.png`

    try {
      switch (action) {
        case 'share': {
          const file = new File([blob], fileName, { type: 'image/png' })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] }).catch((err) => {
              if (err.name === 'AbortError') return
              throw err
            })
            onToast('QR code shared successfully', 'success')
          } else {
            // Fallback: download immediately (optimistic)
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = fileName
            link.href = url
            link.click()
            URL.revokeObjectURL(url)
            onToast('Sharing not supported - QR downloaded instead', 'error')
          }
          // Track share count asynchronously (fire-and-forget)
          trackShare()
          break
        }
        case 'download': {
          // Download immediately (optimistic)
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = fileName
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
          onToast('QR code downloaded', 'success')
          break
        }
        case 'copy-image': {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          onToast('QR image copied to clipboard', 'success')
          break
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error(`Share action "${action}" failed:`, err)
      onToast('Failed to process action', 'error')
    }
  }, [qr, getBlob, onToast, trackShare])

  const menuItems: { action: ShareAction; label: string; icon: typeof Share2 }[] = [
    { action: 'share', label: 'Share QR Image', icon: Share2 },
    { action: 'download', label: 'Download PNG', icon: Download },
    { action: 'copy-image', label: 'Copy Image', icon: Image },
    { action: 'copy-text', label: 'Copy QR Content', icon: justCopied ? Check : ClipboardList },
  ]

  return (
    <div className="relative flex-1">
      <button
        ref={buttonRef}
        onClick={() => { setIsOpen((prev) => !prev); setJustCopied(false) }}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border text-xs text-text-secondary hover:text-text-primary transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Share menu"
      >
        {activeAction ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
        Share
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full mb-1.5 right-0 z-50 w-56 card shadow-lg border-border overflow-hidden origin-bottom-right"
          >
            <div className="py-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isLoading = activeAction === item.action
                const isCopied = item.action === 'copy-text' && justCopied

                return (
                  <button
                    key={item.action}
                    onClick={() => performAction(item.action)}
                    disabled={activeAction !== null}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-secondary/30 transition-colors disabled:opacity-60 group whitespace-nowrap"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/50 transition-colors">
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <Icon className={`w-3.5 h-3.5 ${isCopied ? 'text-success' : 'text-text-secondary'}`} />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isCopied ? 'text-success' : 'text-text-primary'}`}>
                      {isCopied ? 'Copied!' : item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
