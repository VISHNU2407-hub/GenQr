import { motion } from 'framer-motion'
import { Palette, Sliders, RotateCcw, Image, LayoutGrid, Frame, Type } from 'lucide-react'
import type { QRCustomization } from '../utils/qr'
import ColorPicker from './ColorPicker'
import SizeSlider from './SizeSlider'
import MarginSlider from './MarginSlider'
import ErrorCorrectionSelect from './ErrorCorrectionSelect'
import LogoUploader from './LogoUploader'
import GradientPicker from './GradientPicker'
import ModuleStyleSelector from './ModuleStyleSelector'
import CornerStyleSelector from './CornerStyleSelector'
import FrameSelector from './FrameSelector'
import LabelEditor from './LabelEditor'

interface StylingPanelProps {
  customization: QRCustomization
  onChange: (customization: QRCustomization) => void
  onReset: () => void
}

export default function StylingPanel({ customization, onChange, onReset }: StylingPanelProps) {
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
          <div className="border-t border-white/5" />
          <div>
            <span className="text-xs text-slate-500 mb-2 block">Gradient</span>
            <GradientPicker
              gradientType={customization.gradientType}
              gradientColor1={customization.gradientColor1}
              gradientColor2={customization.gradientColor2}
              gradientDirection={customization.gradientDirection}
              onChange={(updates) => update(updates)}
            />
          </div>
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
    {
      id: 'style',
      icon: LayoutGrid,
      label: 'Style',
      content: (
        <div className="space-y-5">
          <ModuleStyleSelector
            value={customization.moduleStyle}
            onChange={(moduleStyle) => update({ moduleStyle })}
          />
          <div className="border-t border-white/5" />
          <CornerStyleSelector
            value={customization.cornerStyle}
            onChange={(cornerStyle) => update({ cornerStyle })}
          />
        </div>
      ),
    },
    {
      id: 'logo',
      icon: Image,
      label: 'Logo',
      content: (
        <LogoUploader
          logoDataUrl={customization.logoDataUrl}
          onChange={(logoDataUrl) => update({ logoDataUrl })}
        />
      ),
    },
    {
      id: 'frame',
      icon: Frame,
      label: 'Frame',
      content: (
        <FrameSelector
          value={customization.frameStyle}
          onChange={(frameStyle) => update({ frameStyle })}
        />
      ),
    },
    {
      id: 'label',
      icon: Type,
      label: 'Label',
      content: (
        <LabelEditor
          text={customization.labelText}
          fontSize={customization.labelFontSize}
          fontWeight={customization.labelFontWeight}
          color={customization.labelColor}
          onChange={(updates) => update({
            labelText: updates.text,
            labelFontSize: updates.fontSize,
            labelFontWeight: updates.fontWeight,
            labelColor: updates.color,
          })}
        />
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
