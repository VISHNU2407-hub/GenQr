import { Image } from 'lucide-react'
import type { QRCustomization } from '../utils/qr'
import LogoUploader from './LogoUploader'
import CollapsibleSection from './CollapsibleSection'

interface LogoSectionProps {
  customization: QRCustomization
  onChange: (updates: Partial<QRCustomization>) => void
  onError?: (message: string) => void
}

export default function LogoSection({ customization, onChange, onError }: LogoSectionProps) {
  return (
    <CollapsibleSection title="Logo" icon={Image} defaultOpen={false}>
      <LogoUploader
        logoDataUrl={customization.logoDataUrl}
        onChange={(logoDataUrl) => onChange({ logoDataUrl })}
        onError={onError}
      />
      {customization.logoDataUrl && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Logo Size</span>
            <span className="text-xs text-text-secondary/80 font-mono">{customization.logoSize}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={40}
            step={5}
            value={customization.logoSize}
            onChange={(e) => onChange({ logoSize: Number(e.target.value) })}
            className="custom-slider w-full"
            aria-label="Logo size"
          />
          <div className="flex justify-between text-[10px] text-text-secondary/60">
            <span>10%</span>
            <span>40%</span>
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}
