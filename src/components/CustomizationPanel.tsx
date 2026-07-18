import { motion } from 'framer-motion'
import { Palette, Sliders, RotateCcw } from 'lucide-react'
import type { QRCustomization } from '../utils/qr'
import ColorPicker from './ColorPicker'
import SizeSlider from './SizeSlider'
import MarginSlider from './MarginSlider'
import ErrorCorrectionSelect from './ErrorCorrectionSelect'

interface CustomizationPanelProps {
  customization: QRCustomization
  onChange: (customization: QRCustomization) => void
  onReset: () => void
}

export default function CustomizationPanel({ customization, onChange, onReset }: CustomizationPanelProps) {
  const update = (partial: Partial<QRCustomization>) => {
    onChange({ ...customization, ...partial })
  }

  const sections = [
    {
      id: 'colors',
      icon: Palette,
      label: 'Colors',
      content: (
        <div className="space-y-4">
          <ColorPicker
            label="Foreground"
            value={customization.fgColor}
            onChange={(fgColor) => update({ fgColor })}
          />
          <div className="border-t border-white/5" />
          <ColorPicker
            label="Background"
            value={customization.bgColor}
            onChange={(bgColor) => update({ bgColor })}
          />
        </div>
      ),
    },
    {
      id: 'layout',
      icon: Sliders,
      label: 'Layout',
      content: (
        <div className="space-y-6">
          <SizeSlider
            value={customization.size}
            onChange={(size) => update({ size })}
          />
          <MarginSlider
            value={customization.margin}
            onChange={(margin) => update({ margin })}
          />
          <ErrorCorrectionSelect
            value={customization.level}
            onChange={(level) => update({ level })}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="mt-8 pt-8 border-t border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-white tracking-tight">
          Customization
        </h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/5 overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-200">{section.label}</span>
              </div>
              {/* Section Content */}
              <div className="px-4 py-4">
                {section.content}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
