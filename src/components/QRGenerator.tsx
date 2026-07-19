import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode } from 'lucide-react'
import type { TemplateId, TemplateFormData, QRCustomization } from '../utils/qr'
import { DEFAULT_CUSTOMIZATION, generateTemplateQRValue, validateTemplateForm } from '../utils/qr'
import { canvasToBlob, generateSVG, generateSVGWithFrame, renderPremiumQR, renderQRWithFrame } from '../utils/qrRenderer'
import type { FrameExportOptions } from '../utils/qrRenderer'
import { useAuth } from '../contexts/AuthContext'
import { saveGeneratedQR, incrementDownloadCount } from '../utils/firestore'
import { useRefresh } from '../contexts/RefreshContext'
import AuthGate from './AuthGate'
import QRContentSection from './QRContentSection'
import QRTypeBar from './QRTypeBar'
import ColorSection from './ColorSection'
import StyleSection from './StyleSection'
import FrameSection from './FrameSection'
import LogoSection from './LogoSection'
import ExportSection from './ExportSection'
import GenerateSection from './GenerateSection'
import LivePreview from './LivePreview'
import ErrorBoundary from './ErrorBoundary'
import Toast from './Toast'

const SUCCESS_TOAST_DURATION = 3000

export default function QRGenerator() {
  // ── Template / Content State ──
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [validationError, setValidationError] = useState<string | null>(null)

  // ── Generation State ──
  const [qrValue, setQrValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)

  // ── Customization State ──
  const [customization, setCustomization] = useState<QRCustomization>(DEFAULT_CUSTOMIZATION)

  // ── Toast State ──
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success'>('error')
  const [showToast, setShowToast] = useState(false)

  // Track the most recently saved QR id so download handlers can increment downloadCount
  const [lastGeneratedQrId, setLastGeneratedQrId] = useState<string | null>(null)

  const { user } = useAuth()
  const { triggerRefresh } = useRefresh()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const showToastMsg = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }, [])

  const handleResetAll = useCallback(() => {
    setSelectedTemplate(null)
    setFormData({})
    setValidationError(null)
    setQrValue('')
    setIsGenerated(false)
    setCustomization(DEFAULT_CUSTOMIZATION)
  }, [])

  const handleTemplateChange = useCallback((id: TemplateId | null) => {
    setSelectedTemplate(id)
    setFormData({})
    setQrValue('')
    setIsGenerated(false)
    // Immediately validate so Generate button shows correct state
    if (id) {
      const error = validateTemplateForm(id, {})
      setValidationError(error)
    } else {
      setValidationError(null)
    }
  }, [])

  const handleFormDataChange = useCallback((data: TemplateFormData) => {
    setFormData(data)

    // Validate as user types (but DON'T auto-generate QR value)
    const template = selectedTemplate
    if (template) {
      const error = validateTemplateForm(template, data)
      setValidationError(error)
    }
  }, [selectedTemplate])

  const handleCustomizationChange = useCallback((updates: Partial<QRCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updates }))
  }, [])

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate) {
      showToastMsg('Please select a QR type', 'error')
      return
    }

    const error = validateTemplateForm(selectedTemplate, formData)
    if (error) {
      setValidationError(error)
      showToastMsg(error, 'error')
      return
    }

    const value = generateTemplateQRValue(selectedTemplate, formData)
    if (!value) {
      showToastMsg('Please fill in all required fields', 'error')
      return
    }

    setIsGenerating(true)
    setQrValue(value)

    let saveCompleted = false
    let saveErrorMessage: string | null = null

    // Save to Firestore if authenticated
    if (user) {
      try {
        const savedQrId = await saveGeneratedQR(user.uid, {
          userId: user.uid,
          type: selectedTemplate,
          content: value,
          style: {
            moduleStyle: customization.moduleStyle,
            cornerStyle: customization.cornerStyle,
            size: customization.size,
            margin: customization.margin,
            level: customization.level,
          },
          colors: {
            fgColor: customization.fgColor,
            bgColor: customization.bgColor,
            gradientType: customization.gradientType,
            gradientColor1: customization.gradientColor1,
            gradientColor2: customization.gradientColor2,
            gradientDirection: customization.gradientDirection,
          },
          frame: {
            framePreset: customization.framePreset,
            frameStyle: customization.frameStyle,
            frameColor: customization.frameColor,
            frameBgColor: customization.frameBgColor,
            frameCustomText: customization.frameCustomText,
          },
          logo: {
            hasLogo: !!customization.logoDataUrl,
            logoSize: customization.logoSize,
          },
        })
        if (savedQrId) {
          setLastGeneratedQrId(savedQrId)
        }
        saveCompleted = true
        // Trigger cross-page refresh so Dashboard/Profile/MyQRCodes update
        triggerRefresh()
      } catch (err: any) {
        console.error('Failed to save QR to Firestore:', err)
        const message = err?.code === 'permission-denied'
          ? 'Permission denied. Please sign out and sign in again.'
          : err?.message || 'Failed to save QR code to your account'
        saveErrorMessage = message
      }
    } else {
      // Not logged in — still let them see/download the QR
      saveCompleted = true
    }

    // Small delay for visual feedback
    setTimeout(() => {
      setIsGenerating(false)
      setIsGenerated(true)

      if (saveCompleted) {
        showToastMsg('QR Code generated successfully!', 'success')
      } else if (saveErrorMessage) {
        // Show a warning: generated on screen but NOT saved
        showToastMsg(`QR generated but NOT saved: ${saveErrorMessage}`, 'error')
      }
    }, 400)
  }, [selectedTemplate, formData, customization, user, showToastMsg, triggerRefresh])

  // ── Build render options ──
  const getRenderOptions = useCallback(() => ({
    value: qrValue,
    size: customization.size,
    margin: customization.margin,
    level: customization.level,
    fgColor: customization.fgColor,
    bgColor: customization.bgColor,
    moduleStyle: customization.moduleStyle,
    cornerStyle: customization.cornerStyle,
    gradientType: customization.gradientType === 'solid' ? 'solid' as const : customization.gradientType,
    gradientColor1: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor1,
    gradientColor2: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor2,
    gradientDirection: customization.gradientDirection,
    logoDataUrl: customization.logoDataUrl,
    logoSize: customization.logoSize,
  }), [qrValue, customization])

  const getFrameOptions = useCallback((): FrameExportOptions => ({
    framePreset: customization.framePreset,
    frameCustomText: customization.frameCustomText,
    frameColor: customization.frameColor,
    frameBgColor: customization.frameBgColor,
    frameBorderRadius: customization.frameBorderRadius,
    frameBorderThickness: customization.frameBorderThickness,
    framePadding: customization.framePadding,
    frameHasShadow: customization.frameHasShadow,
    frameRounded: customization.frameRounded,
    frameOutline: customization.frameOutline,
  }), [
    customization.framePreset,
    customization.frameCustomText,
    customization.frameColor,
    customization.frameBgColor,
    customization.frameBorderRadius,
    customization.frameBorderThickness,
    customization.framePadding,
    customization.frameHasShadow,
    customization.frameRounded,
    customization.frameOutline,
  ])

  // ── Export helpers ──
  const renderForDownload = useCallback(async (format: 'png' | 'jpeg'): Promise<string | null> => {
    if (!qrValue) return null

    const renderOptions = getRenderOptions()
    const frameOptions = getFrameOptions()

    if (frameOptions.framePreset !== 'none') {
      const canvas = await renderQRWithFrame(renderOptions, frameOptions)
      if (format === 'png') {
        return canvas.toDataURL('image/png')
      } else {
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
        if (!blob) return null
        return URL.createObjectURL(blob)
      }
    }

    const offscreen = document.createElement('canvas')
    offscreen.width = customization.size
    offscreen.height = customization.size
    await renderPremiumQR(offscreen, renderOptions)

    if (format === 'png') {
      return offscreen.toDataURL('image/png')
    } else {
      const blob = await canvasToBlob(offscreen, 'image/jpeg', 0.92)
      if (!blob) return null
      return URL.createObjectURL(blob)
    }
  }, [qrValue, customization, getRenderOptions, getFrameOptions])

  const trackDownload = useCallback(async () => {
    if (!user || !lastGeneratedQrId) return
    try {
      await incrementDownloadCount(lastGeneratedQrId, user.uid)
      triggerRefresh()
    } catch (err) {
      console.error('Failed to track download:', err)
      showToastMsg('Download saved, but count could not be updated. Please try again.', 'error')
    }
  }, [user, lastGeneratedQrId, triggerRefresh, showToastMsg])

  const handleDownloadPNG = useCallback(async () => {
    try {
      const dataUrl = await renderForDownload('png')
      if (!dataUrl) return
      const link = document.createElement('a')
      link.download = 'genqr-code.png'
      link.href = dataUrl
      link.click()
      await trackDownload()
    } catch {
      showToastMsg('Failed to download PNG. Please try again.', 'error')
    }
  }, [renderForDownload, showToastMsg, trackDownload])

  const handleDownloadJPG = useCallback(async () => {
    try {
      const url = await renderForDownload('jpeg')
      if (!url) return
      const link = document.createElement('a')
      link.download = 'genqr-code.jpg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      await trackDownload()
    } catch {
      showToastMsg('Failed to download JPG. Please try again.', 'error')
    }
  }, [renderForDownload, showToastMsg, trackDownload])

  const handleDownloadSVG = useCallback(async () => {
    try {
      if (!qrValue) return

      const renderOptions = getRenderOptions()
      const frameOptions = getFrameOptions()

      let svgString: string
      if (frameOptions.framePreset !== 'none') {
        svgString = generateSVGWithFrame(renderOptions, frameOptions)
      } else {
        svgString = generateSVG(renderOptions)
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'genqr-code.svg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      await trackDownload()
    } catch {
      showToastMsg('Failed to download SVG. Please try again.', 'error')
    }
  }, [qrValue, customization, showToastMsg, getRenderOptions, getFrameOptions, trackDownload])

  const handleLogoError = useCallback((message: string) => {
    showToastMsg(message, 'error')
  }, [showToastMsg])

  // Determine if generate should be enabled
  const canGenerate = selectedTemplate !== null && !validationError

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
                Design and customize your QR code in real time
              </p>
            </div>

            {/* QR Type Horizontal Selector */}
            <QRTypeBar
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateChange}
            />

            {/* Two-Panel Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Right Panel - Live Preview (renders FIRST on mobile) */}
              <div className="w-full lg:w-[60%] order-first lg:order-none">
                <ErrorBoundary>
                  <LivePreview
                    qrValue={qrValue}
                    customization={customization}
                    onReset={handleResetAll}
                    onDownloadPNG={handleDownloadPNG}
                    onDownloadSVG={handleDownloadSVG}
                    onDownloadJPG={handleDownloadJPG}
                    canvasRef={canvasRef}
                  />
                </ErrorBoundary>
              </div>

              {/* Left Panel - Controls (renders SECOND on mobile) */}
              <div className="w-full lg:w-[40%] space-y-4 order-last lg:order-none">
                <AuthGate message="Sign in with Google to generate and manage your QR Codes.">
                  <QRContentSection
                    selectedTemplate={selectedTemplate}
                    formData={formData}
                    validationError={validationError}
                    onFormDataChange={handleFormDataChange}
                  />
                  <ColorSection
                    customization={customization}
                    onChange={handleCustomizationChange}
                  />
                  <StyleSection
                    customization={customization}
                    onChange={handleCustomizationChange}
                  />
                  <FrameSection
                    customization={customization}
                    onChange={handleCustomizationChange}
                  />
                  <LogoSection
                    customization={customization}
                    onChange={handleCustomizationChange}
                    onError={handleLogoError}
                  />
                  <GenerateSection
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    isGenerated={isGenerated}
                    disabled={!canGenerate}
                  />
                  <ExportSection
                    onDownloadPNG={handleDownloadPNG}
                    onDownloadSVG={handleDownloadSVG}
                    onDownloadJPG={handleDownloadJPG}
                    disabled={!isGenerated}
                  />
                </AuthGate>
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
