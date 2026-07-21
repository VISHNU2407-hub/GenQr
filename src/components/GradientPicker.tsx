import type { ChangeEvent } from 'react'
import type { GradientType, GradientDirection } from '../utils/qr'

interface GradientPickerProps {
  gradientType: GradientType
  gradientColor1: string
  gradientColor2: string
  gradientDirection: GradientDirection
  onChange: (updates: {
    gradientType?: GradientType
    gradientColor1?: string
    gradientColor2?: string
    gradientDirection?: GradientDirection
  }) => void
}

const directions: { value: GradientDirection; label: string }[] = [
  { value: 'left-to-right', label: 'Left to Right' },
  { value: 'top-to-bottom', label: 'Top to Bottom' },
  { value: 'diagonal', label: 'Diagonal' },
]

const types: { value: GradientType; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
]

export default function GradientPicker({
  gradientType,
  gradientColor1,
  gradientColor2,
  gradientDirection,
  onChange,
}: GradientPickerProps) {
  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex gap-1.5 p-1 bg-secondary/30 rounded-lg border border-border">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange({ gradientType: t.value })}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-all ${
              gradientType === t.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {gradientType !== 'solid' && (
        <>
          {/* Two color pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-text-secondary">Color 1</span>
              <div className="relative">
                <input
                  type="color"
                  value={gradientColor1}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ gradientColor1: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Gradient color 1"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border border-border rounded-lg text-xs text-text-secondary font-mono">
                  <span
                    className="w-5 h-5 rounded-md border border-border"
                    style={{ backgroundColor: gradientColor1 }}
                  />
                  {gradientColor1.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-text-secondary">Color 2</span>
              <div className="relative">
                <input
                  type="color"
                  value={gradientColor2}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ gradientColor2: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Gradient color 2"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border border-border rounded-lg text-xs text-text-secondary font-mono">
                  <span
                    className="w-5 h-5 rounded-md border border-border"
                    style={{ backgroundColor: gradientColor2 }}
                  />
                  {gradientColor2.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Direction selector */}
          {gradientType === 'linear' && (
            <div className="space-y-1.5">
              <span className="text-xs text-text-secondary">Direction</span>
              <div className="flex gap-1.5 p-1 bg-secondary/30 rounded-lg border border-border">
                {directions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => onChange({ gradientDirection: d.value })}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-all ${
                      gradientDirection === d.value
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
