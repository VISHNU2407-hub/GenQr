import { Type } from 'lucide-react'

interface LabelEditorProps {
  text: string
  fontSize: number
  fontWeight: number
  color: string
  onChange: (updates: {
    text?: string
    fontSize?: number
    fontWeight?: number
    color?: string
  }) => void
}

const presets = ['Visit Website', 'Scan Me', 'Download App', 'Follow Us', 'Get Started', 'Learn More']

export default function LabelEditor({ text, fontSize, fontWeight, color, onChange }: LabelEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-300 font-medium">Label</span>
      </div>

      {/* Label text input */}
      <input
        type="text"
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Enter label text..."
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40 text-sm"
      />

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange({ text: p })}
            className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${
              text === p
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Font controls */}
      {text && (
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500">Size</span>
            <select
              value={fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none appearance-none cursor-pointer"
            >
              {[10, 12, 14, 16, 18, 20, 24].map((s) => (
                <option key={s} value={s} className="bg-dark-card text-white">{s}px</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500">Weight</span>
            <select
              value={fontWeight}
              onChange={(e) => onChange({ fontWeight: Number(e.target.value) })}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none appearance-none cursor-pointer"
            >
              {[400, 500, 600, 700, 800].map((w) => (
                <option key={w} value={w} className="bg-dark-card text-white">{w}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500">Color</span>
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => onChange({ color: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Label color"
              />
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 font-mono">
                <span className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: color }} />
                {color.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
