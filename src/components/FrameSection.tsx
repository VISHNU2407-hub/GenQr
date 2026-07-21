import { motion } from 'framer-motion'
import { Frame, Type, Square, Maximize2, CornerDownRight } from 'lucide-react'
import type { QRCustomization, FramePreset } from '../utils/qr'
import { FRAME_PRESET_TEXTS, FRAME_PRESET_ICONS } from '../utils/qr'
import CollapsibleSection from './CollapsibleSection'
import ColorPicker from './ColorPicker'

interface FrameSectionProps {
  customization: QRCustomization
  onChange: (updates: Partial<QRCustomization>) => void
}

const PRESETS: FramePreset[] = [
  'none',
  'scan-me',
  'scan-to-visit',
  'download-app',
  'scan-for-wifi',
  'contact-me',
  'view-menu',
  'follow-us',
  'open-website',
  'custom',
]

function MiniFramePreview({ preset, isSelected, frameColor, frameBgColor }: { preset: FramePreset; isSelected: boolean; frameColor: string; frameBgColor: string }) {
  const text = preset === 'custom' ? 'Custom Frame' : FRAME_PRESET_TEXTS[preset]
  const IconComponent = preset === 'custom' ? null : FRAME_PRESET_ICONS[preset]

  if (preset === 'none') {
    return (
      <div className={`w-full h-14 rounded-lg flex items-center justify-center transition-all duration-200 ${
        isSelected ? 'bg-primary-light border-primary/30' : 'bg-secondary/30 border-border'
      } border`}>
        <span className="text-xs text-text-secondary">No Frame</span>
      </div>
    )
  }

  return (
    <div
      className={`w-full rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary/40' : 'ring-1 ring-border'
      }`}
      style={{
        backgroundColor: frameBgColor || '#FFFFFF',
        border: '1px solid',
        borderColor: isSelected ? 'rgba(35,79,61,0.4)' : 'rgba(0,0,0,0.06)',
      }}
    >
      <div className="p-1.5 flex flex-col items-center gap-1">
        <div
          className="w-full rounded px-1 py-0.5 text-center text-[8px] font-bold leading-tight truncate"
          style={{
            backgroundColor: frameColor || '#234F3D',
            color: '#FFFFFF',
          }}
        >
          <span>{IconComponent && <IconComponent className="w-2.5 h-2.5 inline-block mr-0.5" />}</span>
          <span>{text || 'Custom'}</span>
        </div>
        <div
          className="w-6 h-6 rounded-xs flex items-center justify-center"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <div className="grid grid-cols-3 gap-[1px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-[0.5px]"
                style={{ backgroundColor: frameColor || '#234F3D' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <span className="text-sm text-text-primary flex-1">{label}</span>
      <div
        className={`toggle ${enabled ? 'active' : ''}`}
        onClick={() => onChange(!enabled)}
      >
        <div className="toggle-knob" />
      </div>
    </label>
  )
}

export default function FrameSection({ customization, onChange }: FrameSectionProps) {
  const showCustomText = customization.framePreset === 'custom'
  const frameActive = customization.framePreset !== 'none'

  const handlePresetChange = (preset: FramePreset) => {
    onChange({ framePreset: preset })
  }

  return (
    <CollapsibleSection title="Frame" icon={Frame} defaultOpen={true}>
      {/* Frame Presets */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Frame className="w-4 h-4 text-text-secondary" />
          <span className="text-sm text-text-primary font-medium">Frame Templates</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((preset) => {
            const isSelected = customization.framePreset === preset
            return (
              <motion.button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-card-bg'
                    : 'hover:ring-1 hover:ring-border'
                }`}
              >
                <MiniFramePreview
                  preset={preset}
                  isSelected={isSelected}
                  frameColor={customization.frameColor}
                  frameBgColor={customization.frameBgColor}
                />
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center"
                  >
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Custom Text Input */}
      {showCustomText && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary font-medium">Custom Text</span>
          </div>
          <input
            type="text"
            value={customization.frameCustomText}
            onChange={(e) => onChange({ frameCustomText: e.target.value })}
            placeholder="Enter frame text..."
            className="input-field"
          />
        </motion.div>
      )}

      {/* Frame Style Controls */}
      {frameActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 pt-2 border-t border-border"
        >
          <ColorPicker
            label="Frame Color"
            value={customization.frameColor}
            onChange={(color) => onChange({ frameColor: color })}
          />

          <ColorPicker
            label="Background Color"
            value={customization.frameBgColor}
            onChange={(color) => onChange({ frameBgColor: color })}
          />

          {/* Border Radius */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-primary font-medium">Border Radius</span>
              <span className="text-xs text-text-secondary ml-auto">{customization.frameBorderRadius}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={customization.frameBorderRadius}
              onChange={(e) => onChange({ frameBorderRadius: Number(e.target.value) })}
              className="custom-slider w-full"
            />
          </div>

          {/* Border Thickness */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-primary font-medium">Border Thickness</span>
              <span className="text-xs text-text-secondary ml-auto">{customization.frameBorderThickness}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={customization.frameBorderThickness}
              onChange={(e) => onChange({ frameBorderThickness: Number(e.target.value) })}
              className="custom-slider w-full"
            />
          </div>

          {/* Frame Padding */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CornerDownRight className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-primary font-medium">Frame Padding</span>
              <span className="text-xs text-text-secondary ml-auto">{customization.framePadding}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={60}
              value={customization.framePadding}
              onChange={(e) => onChange({ framePadding: Number(e.target.value) })}
              className="custom-slider w-full"
            />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-1">
            <ToggleSwitch
              enabled={customization.frameHasShadow}
              onChange={(v) => onChange({ frameHasShadow: v })}
              label="Drop Shadow"
            />
            <ToggleSwitch
              enabled={customization.frameRounded}
              onChange={(v) => onChange({ frameRounded: v })}
              label="Rounded Corners"
            />
            <ToggleSwitch
              enabled={customization.frameOutline}
              onChange={(v) => onChange({ frameOutline: v })}
              label="Border Outline"
            />
          </div>
        </motion.div>
      )}
    </CollapsibleSection>
  )
}
