import { Mail, Tag, MessageSquare } from 'lucide-react'
import type { QRFormData } from '../utils/qr'

interface EmailFormProps {
  data: QRFormData
  onChange: (data: QRFormData) => void
}

export default function EmailForm({ data, onChange }: EmailFormProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Mail className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="email"
          value={data.email ?? ''}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="recipient@example.com"
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40"
          aria-label="Recipient email"
        />
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Tag className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="text"
          value={data.subject ?? ''}
          onChange={(e) => onChange({ ...data, subject: e.target.value })}
          placeholder="Subject (optional)"
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40"
          aria-label="Email subject"
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
          aria-label="Email message"
        />
      </div>
    </div>
  )
}
