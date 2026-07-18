import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, QrCode } from 'lucide-react'
import {
  type QRTypeId,
  type QRFormData,
  type QRCustomization,
  QR_TYPES,
  DEFAULT_CUSTOMIZATION,
  validateForm,
  generateQRValue,
} from '../utils/qr'
import { canvasToBlob } from '../utils/qrRenderer'
import QRTypeSelector from './QRTypeSelector'
import URLForm from './URLForm'
import TextForm from './TextForm'
import EmailForm from './EmailForm'
import PhoneForm from './PhoneForm'
import SMSForm from './SMSForm'
import WiFiForm from './WiFiForm'
import QRPreview from './QRPreview'
import StylingPanel from './CustomizationPanel'
import DownloadOptions from './DownloadOptions'
import Toast from './Toast'

const defaultFormData: QRFormData = {
  url: '',
  text: '',
  email: '',
  subject: '',
  message: '',
  phone: '',
  ssid: '',
  password: '',
  security: 'WPA',
}

export default function QRGenerator() {
  const [formData, setFormData] = useState<QRFormData>(defaultFormData)
  const [selectedType, setSelectedType] = useState<QRTypeId>('url')
  const [qrValue, setQrValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [customization, setCustomization] = useState<QRCustomization>(DEFAULT_CUSTOMIZATION)
  const previewRef = useRef<HTMLDivElement>(null)

  const showError = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }, [])

  const handleTypeChange = useCallback((type: QRTypeId) => {
    setSelectedType(type)
    setQrValue('')
    setIsGenerated(false)
  }, [])

  const handleFormChange = useCallback((data: QRFormData) => {
    setFormData(data)
  }, [])

  const handleGenerate = useCallback(() => {
    const error = validateForm(selectedType, formData)
    if (error) {
      showError(error)
      return
    }

    setIsGenerating(true)
    setIsGenerated(false)

    const value = generateQRValue(selectedType, formData)

    setTimeout(() => {
      setQrValue(value)
      setIsGenerating(false)
      setIsGenerated(true)
    }, 600)
  }, [selectedType, formData, showError])

  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!previewRef.current) return null
    return previewRef.current.querySelector('canvas')
  }, [])

  const handleDownloadPNG = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'genqr-code.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [getCanvas])

  const handleDownloadJPG = useCallback(async () => {
    const canvas = getCanvas()
    if (!canvas) return
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'genqr-code.jpg'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [getCanvas])

  const handleDownloadSVG = useCallback(() => {
    const container = document.getElementById('qr-svg-container')
    if (!container) return
    const svg = container.querySelector('svg')
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGElement
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'genqr-code.svg'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleResetCustomization = useCallback(() => {
    setCustomization(DEFAULT_CUSTOMIZATION)
  }, [])

  const typeInfo = QR_TYPES.find((t) => t.id === selectedType)

  return (
    <>
      <section id="generator" className="relative px-4 pb-24 -mt-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="glass-card p-6 sm:p-8 md:p-10"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                QR Code Generator
              </h2>
              <p className="mt-2 text-slate-400 text-sm">
                {typeInfo?.description ?? 'Generate a QR code instantly'}
              </p>
            </div>

            {/* Type Selector */}
            <QRTypeSelector selected={selectedType} onChange={handleTypeChange} />

            {/* Dynamic Form */}
            <div className="space-y-4">
              {selectedType === 'url' && (
                <URLForm data={formData} onChange={handleFormChange} onEnter={handleGenerate} />
              )}
              {selectedType === 'text' && (
                <TextForm data={formData} onChange={handleFormChange} />
              )}
              {selectedType === 'email' && (
                <EmailForm data={formData} onChange={handleFormChange} />
              )}
              {selectedType === 'phone' && (
                <PhoneForm data={formData} onChange={handleFormChange} onEnter={handleGenerate} />
              )}
              {selectedType === 'sms' && (
                <SMSForm data={formData} onChange={handleFormChange} onEnter={handleGenerate} />
              )}
              {selectedType === 'wifi' && (
                <WiFiForm data={formData} onChange={handleFormChange} />
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2.5"
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

            {/* QR Preview & Customization */}
            {isGenerated && qrValue ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* QR Preview */}
                <div className="mt-10" ref={previewRef}>
                  <QRPreview
                    qrValue={qrValue}
                    customization={customization}
                    type={selectedType}
                    typeLabel={typeInfo?.label ?? ''}
                  />
                </div>

                {/* Download Options */}
                <div className="mt-6">
                  <DownloadOptions
                    onDownloadPNG={handleDownloadPNG}
                    onDownloadSVG={handleDownloadSVG}
                    onDownloadJPG={handleDownloadJPG}
                    disabled={false}
                  />
                </div>

                {/* Styling Panel */}
                <StylingPanel
                  customization={customization}
                  onChange={setCustomization}
                  onReset={handleResetCustomization}
                />
              </motion.div>
            ) : (
              <div className="mt-10">
                <AnimatePresence mode="wait">
                  {!isGenerating && (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 py-8"
                    >
                      <div className="w-48 h-48 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/10 flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">
                            Your QR code will appear here
                          </p>
                        </div>
                      </div>

                      {/* Download Buttons (disabled) */}
                      <DownloadOptions
                        onDownloadPNG={() => {}}
                        onDownloadSVG={() => {}}
                        onDownloadJPG={() => {}}
                        disabled={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
