import type { ChangeEvent } from 'react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-300 font-medium">{label}</span>
      <div className="relative flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg border border-white/10 shadow-sm overflow-hidden flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <label className="relative cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Pick ${label.toLowerCase()} color`}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 font-mono hover:bg-white/10 transition-colors">
            {value.toUpperCase()}
          </div>
        </label>
      </div>
    </div>
  )
}
