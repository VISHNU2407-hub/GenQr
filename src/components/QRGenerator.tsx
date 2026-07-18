import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode } from 'lucide-react'
import type { QRTypeId, QRFormData, QRCustomization } from '../utils/qr'
import {
  QR_TYPES,
  DEFAULT_CUSTOMIZATION,
  validateForm,
  generateQRValue,
} from '../utils/qr'
import { canvasToBlob } from '../utils/qrRenderer'
import QRContentSection from './QRContentSection'
import ColorSection from './ColorSection'
import StyleSection from './StyleSection'
import LogoSection from './LogoSection'
import ExportSection from './ExportSection'
import LivePreview from './LivePreview'
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
  const autoGenRef = useRef(false)

  const showError = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }, [])

  const handleResetAll = useCallback(() => {
    setFormData(defaultFormData)
    setQrValue('')
    setIsGenerated(false)
    autoGenRef.current = false
    setCustomization(DEFAULT_CUSTOMIZATION)
  }, [])

  const handleTypeChange = useCallback((type: QRTypeId) => {
    setSelectedType(type)
    if (autoGenRef.current) {
      const value = generateQRValue(type, formData)
      if (value) {
        setQrValue(value)
      }
    }
  }, [formData])

  const handleFormChange = useCallback((data: QRFormData) => {
    setFormData(data)
    if (autoGenRef.current) {
      const value = generateQRValue(selectedType, data)
      if (value) {
        const error = validateForm(selectedType, data)
        if (!error) {
          setQrValue(value)
        }
      }
    }
  }, [selectedType])

  const handleGenerate = useCallback(() => {
    const error = validateForm(selectedType, formData)
    if (error) {
      showError(error)
      return
    }

    setIsGenerating(true)
    const value = generateQRValue(selectedType, formData)

    setTimeout(() => {
      setQrValue(value)
      setIsGenerating(false)
      setIsGenerated(true)
      autoGenRef.current = true
    }, 400)
  }, [selectedType, formData, showError])

  const handleCustomizationChange = useCallback((updates: Partial<QRCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updates }))
  }, [])

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

  const typeInfo = QR_TYPES.find((t) => t.id === selectedType)

  return (
    <>
      <section id="generator" className="relative px-4 pb-24 -mt-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                QR Code Editor
              </h2>
              <p className="mt-2 text-slate-400 text-sm">
                {typeInfo?.description ?? 'Design and customize your QR code in real time'}
              </p>
            </div>

            {/* Two-Panel Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Right Panel - Live Preview (renders FIRST on mobile) */}
              <div className="w-full lg:w-[60%] order-first lg:order-none" ref={previewRef}>
                <LivePreview
                  qrValue={qrValue}
                  customization={customization}
                  type={selectedType}
                  typeLabel={typeInfo?.label ?? ''}
                  onReset={handleResetAll}
                  onDownloadPNG={handleDownloadPNG}
                  onDownloadSVG={handleDownloadSVG}
                  onDownloadJPG={handleDownloadJPG}
                />
              </div>

              {/* Left Panel - Controls (renders SECOND on mobile) */}
              <div className="w-full lg:w-[40%] space-y-4 order-last lg:order-none">
                <QRContentSection
                  selectedType={selectedType}
                  formData={formData}
                  isGenerating={isGenerating}
                  isGenerated={isGenerated}
                  onTypeChange={handleTypeChange}
                  onFormChange={handleFormChange}
                  onGenerate={handleGenerate}
                />
                <ColorSection
                  customization={customization}
                  onChange={handleCustomizationChange}
                />
                <StyleSection
                  customization={customization}
                  onChange={handleCustomizationChange}
                />
                <LogoSection
                  customization={customization}
                  onChange={handleCustomizationChange}
                />
                <ExportSection
                  onDownloadPNG={handleDownloadPNG}
                  onDownloadSVG={handleDownloadSVG}
                  onDownloadJPG={handleDownloadJPG}
                  disabled={!qrValue}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
