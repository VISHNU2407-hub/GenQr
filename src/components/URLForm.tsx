import { Link } from 'lucide-react'
import type { QRFormData } from '../utils/qr'

interface URLFormProps {
  data: QRFormData
  onChange: (data: QRFormData) => void
  onEnter: () => void
}

export default function URLForm({ data, onChange, onEnter }: URLFormProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Link className="w-5 h-5 text-slate-500" />
      </div>
      <input
        type="url"
        value={data.url ?? ''}
        onChange={(e) => onChange({ ...data, url: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        placeholder="https://example.com"
        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40"
        aria-label="Enter URL"
      />
    </div>
  )
}
