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
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <div className="relative flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg border border-border shadow-sm overflow-hidden flex-shrink-0"
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/40 border border-border rounded-lg text-xs text-text-secondary font-mono hover:bg-secondary/60 transition-colors">
            {value.toUpperCase()}
          </div>
        </label>
      </div>
    </div>
  )
}
