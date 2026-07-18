import { FileText } from 'lucide-react'
import type { QRFormData } from '../utils/qr'

interface TextFormProps {
  data: QRFormData
  onChange: (data: QRFormData) => void
}

export default function TextForm({ data, onChange }: TextFormProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 flex items-start pointer-events-none">
        <FileText className="w-5 h-5 text-slate-500" />
      </div>
      <textarea
        value={data.text ?? ''}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
        placeholder="Enter any text..."
        rows={4}
        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40 resize-none"
        aria-label="Enter text"
      />
    </div>
  )
}
