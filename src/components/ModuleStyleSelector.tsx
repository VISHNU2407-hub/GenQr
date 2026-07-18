import { Square } from 'lucide-react'
import type { ModuleStyle } from '../utils/qr'

interface ModuleStyleSelectorProps {
  value: ModuleStyle
  onChange: (style: ModuleStyle) => void
}

const options: { value: ModuleStyle; label: string; icon: string }[] = [
  { value: 'square', label: 'Square', icon: 'square' },
  { value: 'rounded', label: 'Rounded', icon: 'rounded' },
  { value: 'extra-rounded', label: 'Extra Round', icon: 'extra-round' },
  { value: 'dot', label: 'Dot', icon: 'dot' },
]

export default function ModuleStyleSelector({ value, onChange }: ModuleStyleSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Square className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-300 font-medium">Module Style</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
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
            <ModuleIcon style={opt.value} isActive={value === opt.value} />
            <span className="text-[10px] font-medium leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ModuleIcon({ style, isActive }: { style: ModuleStyle; isActive: boolean }) {
  const color = isActive ? '#3B82F6' : '#94A3B8'
  const size = 20

  switch (style) {
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="2" fill={color} />
        </svg>
      )
    case 'rounded':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="4" fill={color} />
        </svg>
      )
    case 'extra-rounded':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="7" fill={color} />
        </svg>
      )
    case 'dot':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill={color} />
        </svg>
      )
  }
}
