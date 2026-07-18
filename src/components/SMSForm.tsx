import { Phone, MessageSquare } from 'lucide-react'
import type { QRFormData } from '../utils/qr'

interface SMSFormProps {
  data: QRFormData
  onChange: (data: QRFormData) => void
  onEnter: () => void
}

export default function SMSForm({ data, onChange, onEnter }: SMSFormProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Phone className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="tel"
          value={data.phone ?? ''}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onEnter()}
          placeholder="+919876543210"
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40"
          aria-label="Recipient phone number"
        />
      </div>
      <div className="relative">
        <div className="absolute top-4 left-4 flex items-start pointer-events-none">
          <MessageSquare className="w-5 h-5 text-slate-500" />
        </div>
        <textarea
          value={data.message ?? ''}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
          placeholder="Message (optional)"
          rows={3}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40 resize-none"
          aria-label="SMS message"
        />
      </div>
    </div>
  )
}
