import { Frame } from 'lucide-react'
import type { FrameStyle } from '../utils/qr'

interface FrameSelectorProps {
  value: FrameStyle
  onChange: (frame: FrameStyle) => void
}

const options: { value: FrameStyle; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No frame' },
  { value: 'minimal', label: 'Minimal', description: 'Thin border' },
  { value: 'modern', label: 'Modern', description: 'Gradient edge' },
  { value: 'business', label: 'Business', description: 'Clean border' },
  { value: 'social', label: 'Social', description: 'Rounded badge' },
  { value: 'premium', label: 'Premium', description: 'Double border' },
]

export default function FrameSelector({ value, onChange }: FrameSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Frame className="w-4 h-4 text-text-secondary" />
        <span className="text-sm text-text-primary font-medium">Frame</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
              value === opt.value
                ? 'bg-primary-light border-primary/30 text-primary'
                : 'bg-secondary/30 border-border text-text-secondary hover:text-text-primary hover:bg-secondary/50'
            }`}
          >
            <span className="text-xs font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
