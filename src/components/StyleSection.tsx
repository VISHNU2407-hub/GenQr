import { LayoutGrid } from 'lucide-react'
import type { QRCustomization } from '../utils/qr'
import ModuleStyleSelector from './ModuleStyleSelector'
import CornerStyleSelector from './CornerStyleSelector'
import FrameSelector from './FrameSelector'
import SizeSlider from './SizeSlider'
import MarginSlider from './MarginSlider'
import ErrorCorrectionSelect from './ErrorCorrectionSelect'
import CollapsibleSection from './CollapsibleSection'

interface StyleSectionProps {
  customization: QRCustomization
  onChange: (updates: Partial<QRCustomization>) => void
}

export default function StyleSection({ customization, onChange }: StyleSectionProps) {
  return (
    <CollapsibleSection title="Style" icon={LayoutGrid} defaultOpen={true}>
      <ModuleStyleSelector
        value={customization.moduleStyle}
        onChange={(moduleStyle) => onChange({ moduleStyle })}
      />
      <div className="border-t border-white/5" />
      <CornerStyleSelector
        value={customization.cornerStyle}
        onChange={(cornerStyle) => onChange({ cornerStyle })}
      />
      <div className="border-t border-white/5" />
      <FrameSelector
        value={customization.frameStyle}
        onChange={(frameStyle) => onChange({ frameStyle })}
      />
      <div className="border-t border-white/5 pt-2" />
      <SizeSlider
        value={customization.size}
        onChange={(size) => onChange({ size })}
      />
      <MarginSlider
        value={customization.margin}
        onChange={(margin) => onChange({ margin })}
      />
      <ErrorCorrectionSelect
        value={customization.level}
        onChange={(level) => onChange({ level })}
      />
    </CollapsibleSection>
  )
}
