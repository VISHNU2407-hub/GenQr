import type { ChangeEvent } from 'react'

interface SizeSliderProps {
  value: number
  onChange: (value: number) => void
}

export default function SizeSlider({ value, onChange }: SizeSliderProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-primary font-medium">Size</span>
        <span className="text-sm text-text-secondary font-mono tabular-nums">{value}px</span>
      </div>
      <input
        type="range"
        min={150}
        max={500}
        step={10}
        value={value}
        onChange={handleChange}
        className="custom-slider w-full"
        aria-label="QR code size"
      />
      <div className="flex justify-between text-xs text-text-secondary/60">
        <span>150px</span>
        <span>500px</span>
      </div>
    </div>
  )
}
