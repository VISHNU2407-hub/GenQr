import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Globe, FileText, Mail, Phone, MessageSquare, Wifi } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { renderPremiumQR } from '../utils/qrRenderer'
import type { QRTypeId, QRCustomization } from '../utils/qr'

const typeIcons: Record<QRTypeId, typeof Globe> = {
  url: Globe,
  text: FileText,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  wifi: Wifi,
}

interface QRPreviewProps {
  qrValue: string
  customization: QRCustomization
  type: QRTypeId
  typeLabel: string
}

// Frame style CSS classes
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

export default function QRPreview({ qrValue, customization, type, typeLabel }: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const TypeIcon = typeIcons[type]

  // Re-render QR whenever customization or value changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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
    })
  }, [
    qrValue, customization.size, customization.margin, customization.level,
    customization.fgColor, customization.bgColor,
    customization.moduleStyle, customization.cornerStyle,
    customization.gradientType, customization.gradientColor1,
    customization.gradientColor2, customization.gradientDirection,
    customization.logoDataUrl,
  ])

  // SVG download ref
  const frameClass = frameClasses[customization.frameStyle] || ''
  const framePadding = framePaddings[customization.frameStyle] || ''

  return (
    <div ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Success badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          <TypeIcon className="w-3.5 h-3.5" />
          {typeLabel} QR Code generated
        </motion.div>

        {/* Frame + QR container */}
        <div className={`rounded-2xl transition-all duration-300 ${frameClass} ${framePadding}`}>
          {/* QR Preview Card */}
          <div
            className="rounded-xl shadow-xl transition-all duration-300"
            style={{
              backgroundColor: customization.bgColor,
            }}
          >
            <div
              style={{
                padding: `${Math.max(customization.margin, 4)}px`,
              }}
            >
              <canvas
                ref={canvasRef}
                width={customization.size}
                height={customization.size}
                className="block mx-auto"
                style={{
                  width: customization.size,
                  height: customization.size,
                }}
              />
            </div>
          </div>
        </div>

        {/* Hidden SVG for download */}
        <div className="hidden" id="qr-svg-container">
          <QRCodeSVG
            value={qrValue}
            size={customization.size}
            level={customization.level}
            fgColor={customization.fgColor}
            bgColor={customization.bgColor}
            marginSize={customization.margin}
          />
        </div>

        {/* Label text */}
        {customization.labelText && (
          <p
            className="text-center transition-all duration-200"
            style={{
              fontSize: customization.labelFontSize,
              fontWeight: customization.labelFontWeight,
              color: customization.labelColor,
            }}
          >
            {customization.labelText}
          </p>
        )}

        {/* Value Display */}
        <p className="text-sm text-slate-400 text-center break-all max-w-sm leading-relaxed">
          {qrValue}
        </p>

        {/* Customization Info */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            {customization.size}&times;{customization.size}px
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            {(customization.gradientType !== 'solid' ? 'Gradient' : customization.fgColor.toUpperCase())}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            {customization.moduleStyle}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            EC: {customization.level}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
