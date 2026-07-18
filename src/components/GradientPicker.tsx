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
      <div className="flex gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/5">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange({ gradientType: t.value })}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-all ${
              gradientType === t.value
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-slate-400 hover:text-slate-200'
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
              <span className="text-xs text-slate-400">Color 1</span>
              <div className="relative">
                <input
                  type="color"
                  value={gradientColor1}
                  onChange={(e) => onChange({ gradientColor1: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Gradient color 1"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 font-mono">
                  <span
                    className="w-5 h-5 rounded-md border border-white/10"
                    style={{ backgroundColor: gradientColor1 }}
                  />
                  {gradientColor1.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400">Color 2</span>
              <div className="relative">
                <input
                  type="color"
                  value={gradientColor2}
                  onChange={(e) => onChange({ gradientColor2: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Gradient color 2"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 font-mono">
                  <span
                    className="w-5 h-5 rounded-md border border-white/10"
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
              <span className="text-xs text-slate-400">Direction</span>
              <div className="flex gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/5">
                {directions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => onChange({ gradientDirection: d.value })}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-all ${
                      gradientDirection === d.value
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-slate-400 hover:text-slate-200'
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
