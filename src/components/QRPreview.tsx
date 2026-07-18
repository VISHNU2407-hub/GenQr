import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Globe, FileText, Mail, Phone, MessageSquare, Wifi } from 'lucide-react'
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

const QRPreview = forwardRef<HTMLDivElement, QRPreviewProps>(
  ({ qrValue, customization, type, typeLabel }, canvasRef) => {
    const TypeIcon = typeIcons[type]

    return (
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

        {/* Premium QR Preview Card */}
        <div
          className="rounded-2xl shadow-xl transition-all duration-300"
          style={{
            backgroundColor: customization.bgColor,
            padding: Math.max(customization.margin, 4) + 'px',
          }}
        >
          <div ref={canvasRef}>
            <QRCodeCanvas
              value={qrValue}
              size={customization.size}
              level={customization.level}
              fgColor={customization.fgColor}
              bgColor={customization.bgColor}
              marginSize={customization.margin}
              style={{ display: 'block' }}
            />
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
            Margin: {customization.margin}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            EC: {customization.level}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: customization.fgColor }} />
            {customization.fgColor.toUpperCase()}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: customization.bgColor, border: '1px solid rgba(255,255,255,0.1)' }} />
            {customization.bgColor.toUpperCase()}
          </span>
        </div>
      </motion.div>
    )
  }
)

QRPreview.displayName = 'QRPreview'

export default QRPreview
