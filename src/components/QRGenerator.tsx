import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Loader2,
  Download,
  CheckCircle2,
  QrCode,
  Globe,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
} from 'lucide-react'
import {
  type QRTypeId,
  type QRFormData,
  QR_TYPES,
  validateForm,
  generateQRValue,
} from '../utils/qr'
import QRTypeSelector from './QRTypeSelector'
import URLForm from './URLForm'
import TextForm from './TextForm'
import EmailForm from './EmailForm'
import PhoneForm from './PhoneForm'
import SMSForm from './SMSForm'
import WiFiForm from './WiFiForm'
import Toast from './Toast'

const typeIcons: Record<QRTypeId, typeof Globe> = {
  url: Globe,
  text: FileText,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  wifi: Wifi,
}

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
  const qrRef = useRef<HTMLDivElement>(null)

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

  const handleDownload = useCallback(() => {
    if (!qrRef.current) return

    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'genqr-code.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const typeInfo = QR_TYPES.find((t) => t.id === selectedType)
  const TypeIcon = typeIcons[selectedType]

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
                    Generate QR Code
                  </>
                )}
              </button>
            </div>

            {/* QR Preview Area */}
            <div className="mt-10">
              <AnimatePresence mode="wait">
                {isGenerated && qrValue ? (
                  <motion.div
                    key="qr-result"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="flex flex-col items-center gap-6"
                  >
                    {/* Type + Success badge */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <TypeIcon className="w-3.5 h-3.5" />
                      {typeInfo?.label} QR Code generated successfully
                    </motion.div>

                    {/* QR Code */}
                    <div ref={qrRef} className="p-6 bg-white rounded-2xl shadow-xl">
                      <QRCodeCanvas
                        value={qrValue}
                        size={220}
                        level="M"
                        fgColor="#0F172A"
                        style={{ display: 'block' }}
                      />
                    </div>

                    {/* Value Display */}
                    <p className="text-sm text-slate-400 text-center break-all max-w-sm leading-relaxed">
                      {qrValue}
                    </p>
                  </motion.div>
                ) : (
                  !isGenerating && (
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
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {/* Download Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleDownload}
                  disabled={!isGenerated}
                  className={`flex items-center gap-2.5 px-6 py-3 text-sm rounded-xl transition-all duration-200 ${
                    isGenerated
                      ? 'btn-secondary cursor-pointer'
                      : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
            </div>
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
