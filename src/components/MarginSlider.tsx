import type { ChangeEvent } from 'react'

interface MarginSliderProps {
  value: number
  onChange: (value: number) => void
}

export default function MarginSlider({ value, onChange }: MarginSliderProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300 font-medium">Margin</span>
        <span className="text-sm text-slate-400 font-mono tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={40}
        step={1}
        value={value}
        onChange={handleChange}
        className="custom-slider w-full"
        aria-label="QR code margin"
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>0</span>
        <span>40</span>
      </div>
    </div>
  )
}
