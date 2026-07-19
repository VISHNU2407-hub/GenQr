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
import { canvasToBlob, generateSVG, renderPremiumQR } from '../utils/qrRenderer'
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

const SUCCESS_TOAST_DURATION = 3000

export default function QRGenerator() {
  const [formData, setFormData] = useState<QRFormData>(defaultFormData)
  const [selectedType, setSelectedType] = useState<QRTypeId>('url')
  const [qrValue, setQrValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success'>('error')
  const [showToast, setShowToast] = useState(false)
  const [customization, setCustomization] = useState<QRCustomization>(DEFAULT_CUSTOMIZATION)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const showToastMsg = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }, [])

  const handleResetAll = useCallback(() => {
    setFormData(defaultFormData)
    setQrValue('')
    setIsGenerated(false)
    setCustomization(DEFAULT_CUSTOMIZATION)
  }, [])

  const handleTypeChange = useCallback((type: QRTypeId) => {
    setSelectedType(type)
    const value = generateQRValue(type, formData)
    if (value) {
      setQrValue(value)
    } else {
      setQrValue('')
    }
  }, [formData])

  const handleFormChange = useCallback((data: QRFormData) => {
    setFormData(data)
    const value = generateQRValue(selectedType, data)
    if (!value) {
      setQrValue('')
    } else {
      setQrValue(value)
    }
  }, [selectedType])

  const handleGenerate = useCallback(() => {
    const error = validateForm(selectedType, formData)
    if (error) {
      showToastMsg(error, 'error')
      return
    }

    setIsGenerating(true)
    const value = generateQRValue(selectedType, formData)

    // Small delay for visual feedback
    setTimeout(() => {
      setQrValue(value)
      setIsGenerating(false)
      setIsGenerated(true)
      showToastMsg('QR Code generated successfully!', 'success')
    }, 300)
  }, [selectedType, formData, showToastMsg])

  const handleCustomizationChange = useCallback((updates: Partial<QRCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updates }))
  }, [])

  // Re-render on a temporary canvas for download to ensure logo is included
  const renderForDownload = useCallback(async (format: 'png' | 'jpeg'): Promise<string | null> => {
    if (!qrValue) return null

    // Create an offscreen canvas
    const offscreen = document.createElement('canvas')
    offscreen.width = customization.size
    offscreen.height = customization.size

    await renderPremiumQR(offscreen, {
      value: qrValue,
      size: customization.size,
      margin: customization.margin,
      level: customization.level,
      fgColor: customization.fgColor,
      bgColor: customization.bgColor,
      moduleStyle: customization.moduleStyle,
      cornerStyle: customization.cornerStyle,
      gradientType: customization.gradientType === 'solid' ? 'solid' : customization.gradientType,
      gradientColor1: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor1,
      gradientColor2: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor2,
      gradientDirection: customization.gradientDirection,
      logoDataUrl: customization.logoDataUrl,
      logoSize: customization.logoSize,
    })

    if (format === 'png') {
      return offscreen.toDataURL('image/png')
    } else {
      const blob = await canvasToBlob(offscreen, 'image/jpeg', 0.92)
      if (!blob) return null
      return URL.createObjectURL(blob)
    }
  }, [qrValue, customization])

  const handleDownloadPNG = useCallback(async () => {
    try {
      const dataUrl = await renderForDownload('png')
      if (!dataUrl) return
      const link = document.createElement('a')
      link.download = 'genqr-code.png'
      link.href = dataUrl
      link.click()
    } catch {
      showToastMsg('Failed to download PNG. Please try again.', 'error')
    }
  }, [renderForDownload, showToastMsg])

  const handleDownloadJPG = useCallback(async () => {
    try {
      const url = await renderForDownload('jpeg')
      if (!url) return
      const link = document.createElement('a')
      link.download = 'genqr-code.jpg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      showToastMsg('Failed to download JPG. Please try again.', 'error')
    }
  }, [renderForDownload, showToastMsg])

  const handleDownloadSVG = useCallback(() => {
    try {
      if (!qrValue) return
      const svgString = generateSVG({
        value: qrValue,
        size: customization.size,
        margin: customization.margin,
        level: customization.level,
        fgColor: customization.fgColor,
        bgColor: customization.bgColor,
        moduleStyle: customization.moduleStyle,
        cornerStyle: customization.cornerStyle,
        gradientType: customization.gradientType === 'solid' ? 'solid' : customization.gradientType,
        gradientColor1: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor1,
        gradientColor2: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor2,
        gradientDirection: customization.gradientDirection,
        logoDataUrl: customization.logoDataUrl,
        logoSize: customization.logoSize,
      })
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'genqr-code.svg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      showToastMsg('Failed to download SVG. Please try again.', 'error')
    }
  }, [qrValue, customization, showToastMsg])

  const handleLogoError = useCallback((message: string) => {
    showToastMsg(message, 'error')
  }, [showToastMsg])

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
              <div className="w-full lg:w-[60%] order-first lg:order-none">
                <LivePreview
                  qrValue={qrValue}
                  customization={customization}
                  type={selectedType}
                  typeLabel={typeInfo?.label ?? ''}
                  onReset={handleResetAll}
                  onDownloadPNG={handleDownloadPNG}
                  onDownloadSVG={handleDownloadSVG}
                  onDownloadJPG={handleDownloadJPG}
                  canvasRef={canvasRef}
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
                  onError={handleLogoError}
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
        type={toastType}
        duration={toastType === 'success' ? SUCCESS_TOAST_DURATION : 6000}
      />
    </>
  )
}

