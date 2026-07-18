import { Palette } from 'lucide-react'
import type { QRCustomization } from '../utils/qr'
import ColorPicker from './ColorPicker'
import GradientPicker from './GradientPicker'
import CollapsibleSection from './CollapsibleSection'

interface ColorSectionProps {
  customization: QRCustomization
  onChange: (updates: Partial<QRCustomization>) => void
}

export default function ColorSection({ customization, onChange }: ColorSectionProps) {
  return (
    <CollapsibleSection title="Colors" icon={Palette} defaultOpen={true}>
      <ColorPicker
        label="Foreground"
        value={customization.fgColor}
        onChange={(fgColor) => onChange({ fgColor })}
      />
      <div className="border-t border-white/5" />
      <ColorPicker
        label="Background"
        value={customization.bgColor}
        onChange={(bgColor) => onChange({ bgColor })}
      />
      <div className="border-t border-white/5" />
      <div>
        <span className="text-xs text-slate-500 mb-2 block">Gradient</span>
        <GradientPicker
          gradientType={customization.gradientType}
          gradientColor1={customization.gradientColor1}
          gradientColor2={customization.gradientColor2}
          gradientDirection={customization.gradientDirection}
          onChange={(updates) => onChange(updates)}
        />
      </div>
    </CollapsibleSection>
  )
}
