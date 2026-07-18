import { motion } from 'framer-motion'
import {
  Globe,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
} from 'lucide-react'
import type { QRTypeId } from '../utils/qr'

interface QRTypeSelectorProps {
  selected: QRTypeId
  onChange: (type: QRTypeId) => void
}

const typeIcons: Record<QRTypeId, typeof Globe> = {
  url: Globe,
  text: FileText,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  wifi: Wifi,
}

const types: { id: QRTypeId; label: string }[] = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'sms', label: 'SMS' },
  { id: 'wifi', label: 'WiFi' },
]

export default function QRTypeSelector({ selected, onChange }: QRTypeSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8 p-1.5 bg-white/[0.03] rounded-2xl border border-white/5">
      {types.map((type) => {
        const Icon = typeIcons[type.id]
        const isActive = selected === type.id
        return (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`relative flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTypeTab"
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-xl"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
            <span className="relative z-10">
              <Icon className="w-4 h-4" />
            </span>
            <span className="relative z-10 hidden sm:inline">{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}
