import { QrCode, Loader2 } from 'lucide-react'
import type { QRTypeId, QRFormData } from '../utils/qr'
import QRTypeSelector from './QRTypeSelector'
import URLForm from './URLForm'
import TextForm from './TextForm'
import EmailForm from './EmailForm'
import PhoneForm from './PhoneForm'
import SMSForm from './SMSForm'
import WiFiForm from './WiFiForm'
import CollapsibleSection from './CollapsibleSection'

interface QRContentSectionProps {
  selectedType: QRTypeId
  formData: QRFormData
  isGenerating: boolean
  isGenerated: boolean
  onTypeChange: (type: QRTypeId) => void
  onFormChange: (data: QRFormData) => void
  onGenerate: () => void
}

export default function QRContentSection({
  selectedType,
  formData,
  isGenerating,
  isGenerated,
  onTypeChange,
  onFormChange,
  onGenerate,
}: QRContentSectionProps) {
  const handleFormChange = (data: QRFormData) => {
    onFormChange(data)
  }

  return (
    <CollapsibleSection title="QR Content" icon={QrCode} defaultOpen={true}>
      <QRTypeSelector selected={selectedType} onChange={onTypeChange} />

      <div className="space-y-3">
        {selectedType === 'url' && (
          <URLForm data={formData} onChange={handleFormChange} onEnter={onGenerate} />
        )}
        {selectedType === 'text' && (
          <TextForm data={formData} onChange={handleFormChange} />
        )}
        {selectedType === 'email' && (
          <EmailForm data={formData} onChange={handleFormChange} />
        )}
        {selectedType === 'phone' && (
          <PhoneForm data={formData} onChange={handleFormChange} onEnter={onGenerate} />
        )}
        {selectedType === 'sms' && (
          <SMSForm data={formData} onChange={handleFormChange} onEnter={onGenerate} />
        )}
        {selectedType === 'wifi' && (
          <WiFiForm data={formData} onChange={handleFormChange} />
        )}

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary w-full text-base py-3.5 flex items-center justify-center gap-2.5"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              {isGenerated ? 'Regenerate QR Code' : 'Generate QR Code'}
            </>
          )}
        </button>
      </div>
    </CollapsibleSection>
  )
}
