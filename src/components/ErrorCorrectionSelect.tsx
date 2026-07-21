import { Shield } from 'lucide-react'
import type { ErrorCorrectionLevel } from '../utils/qr'

interface ErrorCorrectionSelectProps {
  value: ErrorCorrectionLevel
  onChange: (level: ErrorCorrectionLevel) => void
}

const levels: { value: ErrorCorrectionLevel; label: string; desc: string }[] = [
  { value: 'L', label: 'L - Low', desc: '7% recovery' },
  { value: 'M', label: 'M - Medium', desc: '15% recovery' },
  { value: 'Q', label: 'Q - Quartile', desc: '25% recovery' },
  { value: 'H', label: 'H - High', desc: '30% recovery' },
]

export default function ErrorCorrectionSelect({ value, onChange }: ErrorCorrectionSelectProps) {
  const current = levels.find((l) => l.value === value)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-text-secondary" />
        <span className="text-sm text-text-primary font-medium">Error Correction</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ErrorCorrectionLevel)}
          className="select-field"
          aria-label="Error correction level"
        >
          {levels.map((level) => (
            <option key={level.value} value={level.value} className="bg-card-bg text-text-primary">
              {level.label} &mdash; {level.desc}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-text-secondary/60">{current?.desc}</p>
    </div>
  )
}
