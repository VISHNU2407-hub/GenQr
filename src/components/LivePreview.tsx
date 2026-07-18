import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode, RotateCcw, CheckCircle2, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { renderPremiumQR } from '../utils/qrRenderer'
import type { QRTypeId, QRCustomization } from '../utils/qr'

interface LivePreviewProps {
  qrValue: string
  customization: QRCustomization
  type: QRTypeId
  typeLabel: string
  onReset: () => void
  onDownloadPNG: () => void
  onDownloadSVG: () => void
  onDownloadJPG: () => void
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-300 truncate max-w-[120px]">{value}</span>
    </div>
  )
}

const frameClasses: Record<string, string> = {
  none: '',
  minimal: 'ring-1 ring-white/10',
  modern: 'ring-2 ring-primary/30 shadow-lg shadow-primary/10',
  business: 'ring-1 ring-white/20 shadow-xl',
  social: 'ring-2 ring-accent/30 rounded-3xl shadow-lg shadow-accent/10',
  premium: 'ring-2 ring-primary/20 ring-offset-2 ring-offset-dark-bg shadow-2xl',
}

const framePaddings: Record<string, string> = {
  none: '',
  minimal: 'p-0',
  modern: 'p-1.5',
  business: 'p-0',
  social: 'p-2',
  premium: 'p-1',
}

export default function LivePreview({
  qrValue,
  customization,
  type: _type,
  typeLabel,
  onReset,
  onDownloadPNG,
  onDownloadSVG,
  onDownloadJPG,
}: LivePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !qrValue) return

    renderPremiumQR(canvas, {
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
  }, [
    qrValue, customization.size, customization.margin, customization.level,
    customization.fgColor, customization.bgColor,
    customization.moduleStyle, customization.cornerStyle,
    customization.gradientType, customization.gradientColor1,
    customization.gradientColor2, customization.gradientDirection,
    customization.logoDataUrl,
  ])

  const displaySize = Math.min(customization.size, 320)
  const frameClass = frameClasses[customization.frameStyle] || ''
  const framePadding = framePaddings[customization.frameStyle] || ''

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-6 sm:p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-sm font-medium text-emerald-400">Live Preview</span>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>

        {/* QR Code Display */}
        <div className="flex justify-center mb-6">
          {qrValue ? (
            <motion.div
              key={qrValue + customization.size + customization.fgColor + customization.frameStyle + customization.moduleStyle + customization.cornerStyle}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              <div className={`rounded-2xl transition-all duration-300 ${frameClass} ${framePadding}`}>
                <div
                  className="rounded-xl shadow-xl transition-all duration-300"
                  style={{
                    backgroundColor: customization.bgColor,
                    padding: `${Math.max(customization.margin, 4)}px`,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={customization.size}
                    height={customization.size}
                    className="block mx-auto"
                    style={{
                      width: displaySize,
                      height: displaySize,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <div className="w-48 h-48 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Your QR code will appear here</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Hidden SVG for download */}
        <div className="hidden" id="qr-svg-container">
          {qrValue && (
            <QRCodeSVG
              value={qrValue}
              size={customization.size}
              level={customization.level}
              fgColor={customization.fgColor}
              bgColor={customization.bgColor}
              marginSize={customization.margin}
            />
          )}
        </div>

        {/* Success Badge */}
        {qrValue && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">{typeLabel}</span>
              <span>QR Code active</span>
            </span>
          </motion.div>
        )}

        {/* QR Info */}
        {qrValue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-2 mb-6"
          >
            <InfoItem label="Type" value={typeLabel} />
            <InfoItem label="Size" value={customization.size + 'x' + customization.size + 'px'} />
            <InfoItem label="Foreground" value={customization.gradientType !== 'solid' ? 'Gradient' : customization.fgColor.toUpperCase()} />
            <InfoItem label="Background" value={customization.bgColor.toUpperCase()} />
            <InfoItem label="Error Corr." value={customization.level} />
            <InfoItem label="Margin" value={customization.margin + 'px'} />
            <InfoItem label="Frame" value={customization.frameStyle.charAt(0).toUpperCase() + customization.frameStyle.slice(1)} />
            <InfoItem label="Logo" value={customization.logoDataUrl ? 'Uploaded' : 'None'} />
          </motion.div>
        )}

        {/* Download Buttons */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-slate-200">Export QR Code</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onDownloadPNG}
              disabled={!qrValue}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
                qrValue
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]'
                  : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-xs font-semibold">PNG</span>
            </button>
            <button
              onClick={onDownloadSVG}
              disabled={!qrValue}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
                qrValue
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]'
                  : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              <span className="text-xs font-semibold">SVG</span>
            </button>
            <button
              onClick={onDownloadJPG}
              disabled={!qrValue}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
                qrValue
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]'
                  : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="10" y1="13" x2="14" y2="13"/>
                <line x1="12" y1="11" x2="12" y2="15"/>
              </svg>
              <span className="text-xs font-semibold">JPG</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
