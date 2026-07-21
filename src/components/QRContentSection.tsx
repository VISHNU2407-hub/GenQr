import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, AlertCircle, Info } from 'lucide-react'
import type { TemplateId, TemplateFormData } from '../utils/qr'
import { TEMPLATES } from '../utils/qr'
import CollapsibleSection from './CollapsibleSection'

interface QRContentSectionProps {
  selectedTemplate: TemplateId | null
  formData: TemplateFormData
  validationError: string | null
  onFormDataChange: (data: TemplateFormData) => void
}

function TemplateFieldInput({
  field,
  value,
  onChange,
}: {
  field: (typeof TEMPLATES)[number]['fields'][number]
  value: string
  onChange: (key: string, value: string) => void
}) {
  if (field.type === 'select' && field.options) {
    return (
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="select-field"
          aria-label={field.label}
        >
          <option value="" className="bg-card-bg text-text-secondary">
            Select {field.label}
          </option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card-bg text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="input-field resize-none"
        aria-label={field.label}
      />
    )
  }

  return (
    <input
      type={field.type}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      className="input-field"
      aria-label={field.label}
    />
  )
}

export default function QRContentSection({
  selectedTemplate,
  formData,
  validationError,
  onFormDataChange,
}: QRContentSectionProps) {
  const template = selectedTemplate ? TEMPLATES.find((t) => t.id === selectedTemplate) : null

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      const newData = { ...formData, [key]: value }
      onFormDataChange(newData)
    },
    [formData, onFormDataChange],
  )

  return (
    <CollapsibleSection title="QR Content" icon={QrCode} defaultOpen={true}>
      <AnimatePresence mode="wait">
        {selectedTemplate && template ? (
          <motion.div
            key={selectedTemplate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Active Template Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <template.icon className="w-5 h-5" style={{ color: template.color }} />
              <span className="text-sm font-semibold text-text-primary">{template.label}</span>
              <span className="ml-auto text-[10px] text-text-secondary bg-secondary/40 px-2 py-0.5 rounded-full">
                {template.fields.filter((f) => f.required).length} required
              </span>
            </div>

            {/* Template Description */}
            <p className="text-xs text-text-secondary">{template.description}</p>

            {/* Form Fields */}
            <div className="space-y-2.5">
              {template.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                    {field.label}
                    {field.required && <span className="text-danger ml-0.5">*</span>}
                  </label>
                  <TemplateFieldInput
                    field={field}
                    value={formData[field.key] ?? ''}
                    onChange={handleFieldChange}
                  />
                </div>
              ))}
            </div>

            {/* Validation Error */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20"
              >
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <span className="text-xs text-danger/80">{validationError}</span>
              </motion.div>
            )}

            {/* Info Message */}
            {!validationError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-light border border-accent/15"
              >
                <Info className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs text-accent/80">
                  Fill in the fields above, then click Generate QR Code
                </span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary/30 border border-border flex items-center justify-center">
              <QrCode className="w-5 h-5 text-text-secondary" />
            </div>
            <p className="text-xs text-text-secondary max-w-[200px]">
              Select a QR type from the bar above to get started
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </CollapsibleSection>
  )
}
