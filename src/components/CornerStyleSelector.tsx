import { Square } from 'lucide-react'
import type { CornerStyle } from '../utils/qr'

interface CornerStyleSelectorProps {
  value: CornerStyle
  onChange: (style: CornerStyle) => void
}

const options: { value: CornerStyle; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
]

export default function CornerStyleSelector({ value, onChange }: CornerStyleSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">          <Square className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-300 font-medium">Corner Style</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              value === opt.value
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <CornerIcon style={opt.value} isActive={value === opt.value} />
            <span className="text-[10px] font-medium leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CornerIcon({ style, isActive }: { style: CornerStyle; isActive: boolean }) {
  const color = isActive ? '#3B82F6' : '#94A3B8'
  const size = 20

  switch (style) {
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect x="1" y="1" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
          <rect x="4" y="4" width="12" height="12" rx="1" fill={color} />
        </svg>
      )
    case 'rounded':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect x="1" y="1" width="18" height="18" rx="5" stroke={color} strokeWidth="2" fill="none" />
          <rect x="5" y="5" width="10" height="10" rx="3" fill={color} />
        </svg>
      )
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="2" fill="none" />
          <circle cx="10" cy="10" r="5" fill={color} />
        </svg>
      )
  }
}
