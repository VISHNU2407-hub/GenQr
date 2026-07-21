import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { QrCode, RotateCcw, CheckCircle2, Download, Share2, Loader2, type LucideIcon } from 'lucide-react'
import { renderPremiumQR } from '../utils/qrRenderer'
import type { QRCustomization } from '../utils/qr'
import { FRAME_PRESET_TEXTS, FRAME_PRESET_ICONS } from '../utils/qr'

interface LivePreviewProps {
  qrValue: string
  customization: QRCustomization
  onReset: () => void
  onDownloadPNG: () => void
  onDownloadSVG: () => void
  onDownloadJPG: () => void
  onShare?: () => Promise<void>
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-cream-bg border border-border">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">{value}</span>
    </div>
  )
}

function QRRender({
  hasFrame,
  frameBgColor,
  frameRadius,
  framePadding: fPadding,
  frameBorderThickness,
  frameOutline,
  frameShadow,
  frameColor,
  frameText,
  FrameIconComponent,
  frameFontSize,
  bgColor,
  margin,
  canvasRef,
  size,
  displaySize,
}: {
  hasFrame: boolean
  frameBgColor: string
  frameRadius: number
  framePadding: number
  frameBorderThickness: number
  frameOutline: boolean
  frameShadow: string
  frameColor: string
  frameText: string
  FrameIconComponent: LucideIcon | null
  frameFontSize: number
  bgColor: string
  margin: number
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  size: number
  displaySize: number
}) {
  return (
    <motion.div
      key="qr-display"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
    >
      <div
        className="transition-all duration-300"
        style={{
          backgroundColor: hasFrame ? frameBgColor : 'transparent',
          borderRadius: hasFrame ? `${frameRadius}px` : '0',
          padding: hasFrame ? `${fPadding + (frameOutline ? frameBorderThickness : 0)}px` : '0',
          boxShadow: hasFrame ? frameShadow : 'none',
          border: hasFrame && frameOutline
            ? `${frameBorderThickness}px solid ${frameColor}`
            : 'none',
        }}
      >
        {hasFrame && frameText && (
          <div
            className="text-center font-bold mb-3 transition-all duration-200"
            style={{
              color: frameColor,
              fontSize: `${frameFontSize}px`,
              letterSpacing: '0.3px',
            }}
          >
            {FrameIconComponent && <FrameIconComponent className="mr-1.5 inline-block" size={frameFontSize} />}
            {frameText}
          </div>
        )}
        <div className="transition-all duration-300">
          <div
            className="rounded-xl transition-all duration-300"
            style={{
              backgroundColor: bgColor,
              padding: `${Math.max(margin, 4)}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              id="preview-canvas"
              width={size}
              height={size}
              className="block mx-auto"
              style={{
                width: displaySize,
                height: displaySize,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function LivePreview({
  qrValue,
  customization,
  onReset,
  onDownloadPNG,
  onDownloadSVG,
  onDownloadJPG,
  onShare,
  canvasRef: externalCanvasRef,
}: LivePreviewProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = externalCanvasRef ?? internalCanvasRef
  const mountedRef = useRef(true)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const handleShareClick = useCallback(async () => {
    if (!qrValue || isSharing || !onShare) return
    setIsSharing(true)
    try {
      await onShare()
    } finally {
      setIsSharing(false)
    }
  }, [qrValue, isSharing, onShare])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !qrValue) {
      setRenderError(null)
      return
    }

    setRenderError(null)

    const doRender = async () => {
      if (!mountedRef.current) return
      try {
        await renderPremiumQR(canvas, {
          value: qrValue,
          size: customization.size,
          margin: customization.margin,
          level: customization.level,
          fgColor: customization.fgColor,
          bgColor: customization.bgColor,
          moduleStyle: customization.moduleStyle,
          cornerStyle: customization.cornerStyle,
          gradientType: customization.gradientType === 'solid' ? 'solid' : customization.gradientType,
          gradientColor1: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor1,
          gradientColor2: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor2,
          gradientDirection: customization.gradientDirection,
          logoDataUrl: customization.logoDataUrl,
          logoSize: customization.logoSize,
        })
      } catch (err) {
        if (!mountedRef.current) return
        console.error('QR render error:', err)
        setRenderError('Failed to render QR code')
      }
    }

    doRender()
  }, [
    canvasRef,
    qrValue,
    customization.size, customization.margin, customization.level,
    customization.fgColor, customization.bgColor,
    customization.moduleStyle, customization.cornerStyle,
    customization.gradientType, customization.gradientColor1,
    customization.gradientColor2, customization.gradientDirection,
    customization.logoDataUrl, customization.logoSize,
  ])

  const displaySize = Math.min(customization.size, 320)

  const hasFrame = customization.framePreset !== 'none'
  const frameText = customization.framePreset === 'custom'
    ? (customization.frameCustomText || 'Custom Frame')
    : FRAME_PRESET_TEXTS[customization.framePreset]
  const FrameIconComponent = FRAME_PRESET_ICONS[customization.framePreset]
  const frameRadius = customization.frameRounded ? customization.frameBorderRadius : 0
  const frameShadow = customization.frameHasShadow
    ? '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'
    : 'none'
  const frameFontSize = Math.max(14, Math.min(24, customization.size / 15))

  const showEmptyState = !qrValue

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card p-6 sm:p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm font-medium text-success">Live Preview</span>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all duration-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>

        {/* QR Code Display */}
        <div className="flex justify-center mb-6">
          {showEmptyState ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <div className="w-48 h-48 rounded-2xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
                <div className="text-center px-4">
                  <QrCode className="w-12 h-12 text-text-secondary/40 mx-auto mb-2" />
                  <p className="text-sm text-text-secondary/60 leading-relaxed">
                    Select a template, enter your data, customize the design, then click{' '}
                    <span className="text-primary font-medium">Generate QR Code</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ) : renderError ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <div className="w-48 h-48 rounded-2xl bg-danger/5 border-2 border-dashed border-danger/20 flex items-center justify-center">
                <div className="text-center px-4">
                  <QrCode className="w-12 h-12 text-danger/40 mx-auto mb-2" />
                  <p className="text-sm text-danger/60 leading-relaxed">{renderError}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <QRRender
              hasFrame={hasFrame}
              frameBgColor={customization.frameBgColor}
              frameRadius={frameRadius}
              framePadding={customization.framePadding}
              frameBorderThickness={customization.frameBorderThickness}
              frameOutline={customization.frameOutline}
              frameShadow={frameShadow}
              frameColor={customization.frameColor}
              frameText={frameText}
              FrameIconComponent={FrameIconComponent}
              frameFontSize={frameFontSize}
              bgColor={customization.bgColor}
              margin={customization.margin}
              canvasRef={canvasRef}
              size={customization.size}
              displaySize={displaySize}
            />
          )}
        </div>

        {/* Success Badge */}
        {qrValue && !renderError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <span className="flex items-center gap-1.5 text-xs text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>QR Code active</span>
            </span>
          </motion.div>
        )}

        {/* QR Info */}
        {qrValue && !renderError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-2 mb-6"
          >
            <InfoItem label="Size" value={`${customization.size}x${customization.size}px`} />
            <InfoItem label="Foreground" value={customization.gradientType !== 'solid' ? 'Gradient' : customization.fgColor.toUpperCase()} />
            <InfoItem label="Background" value={customization.bgColor.toUpperCase()} />
            <InfoItem label="Error Corr." value={customization.level} />
            <InfoItem label="Margin" value={`${customization.margin}px`} />
            <InfoItem label="Style" value={customization.moduleStyle.charAt(0).toUpperCase() + customization.moduleStyle.slice(1)} />
            <InfoItem label="Frame" value={customization.frameStyle.charAt(0).toUpperCase() + customization.frameStyle.slice(1)} />
            <InfoItem label="Frame Text" value={
              customization.framePreset === 'none'
                ? 'None'
                : customization.framePreset === 'custom'
                  ? (customization.frameCustomText || 'Custom')
                  : FRAME_PRESET_TEXTS[customization.framePreset]
            } />
            <InfoItem label="Logo" value={customization.logoDataUrl ? 'Uploaded' : 'None'} />
          </motion.div>
        )}

        {/* Share & Download Buttons */}
        <div className="space-y-3">
          {/* Share Button */}
          <button
            onClick={handleShareClick}
            disabled={!qrValue || isSharing || !onShare}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
              qrValue && !isSharing
                ? 'bg-primary text-white hover:bg-primary-hover active:scale-[0.98] shadow-sm border-transparent'
                : 'bg-secondary/20 border-border text-text-secondary/40 cursor-not-allowed'
            }`}
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-semibold">Preparing...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Share QR Code</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-primary">Export QR Code</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'PNG', onClick: onDownloadPNG },
              { label: 'SVG', onClick: onDownloadSVG },
              { label: 'JPG', onClick: onDownloadJPG },
            ].map(({ label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                disabled={!qrValue}
                className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
                  qrValue
                    ? 'bg-card-bg border-border text-text-secondary hover:text-text-primary hover:bg-secondary/30 hover:border-accent/30 active:scale-[0.98]'
                    : 'bg-secondary/20 border-border text-text-secondary/40 cursor-not-allowed'
                }`}
              >
                {label === 'PNG' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                ) : label === 'SVG' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="10" y1="13" x2="14" y2="13"/><line x1="12" y1="11" x2="12" y2="15"/>
                  </svg>
                )}
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
