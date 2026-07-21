import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Files } from 'lucide-react'
import type { TemplateId, TemplateFormData, QRCustomization } from '../utils/qr'
import { DEFAULT_CUSTOMIZATION, generateTemplateQRValue, validateTemplateForm } from '../utils/qr'
import { canvasToBlob, generateSVG, generateSVGWithFrame, renderPremiumQR, renderQRWithFrame } from '../utils/qrRenderer'
import type { FrameExportOptions } from '../utils/qrRenderer'
import { useAuth } from '../contexts/AuthContext'
import { saveGeneratedQR, incrementDownloadCount, logActivity } from '../utils/firestore'
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
import BatchGenerator from './BatchGenerator'

const SUCCESS_TOAST_DURATION = 3000

export default function QRGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [validationError, setValidationError] = useState<string | null>(null)
  const [qrValue, setQrValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [customization, setCustomization] = useState<QRCustomization>(DEFAULT_CUSTOMIZATION)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success'>('error')
  const [showToast, setShowToast] = useState(false)
  const [lastGeneratedQrId, setLastGeneratedQrId] = useState<string | null>(null)
  const [batchPreviewDataUrl, setBatchPreviewDataUrl] = useState<string | null>(null)
  const [batchPreviewName, setBatchPreviewName] = useState('')
  const [batchPreviewContent, setBatchPreviewContent] = useState('')

  const handleBatchPreviewUpdate = useCallback((dataUrl: string | null, name: string, content: string) => {
    setBatchPreviewDataUrl(dataUrl)
    setBatchPreviewName(name)
    setBatchPreviewContent(content)
  }, [])

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
    setBatchPreviewDataUrl(null)
    if (id) {
      const error = validateTemplateForm(id, {})
      setValidationError(error)
    } else {
      setValidationError(null)
    }
  }, [])

  const handleFormDataChange = useCallback((data: TemplateFormData) => {
    setFormData(data)
    const template = selectedTemplate
    if (template) {
      const error = validateTemplateForm(template, data)
      setValidationError(error)
    }
  }, [selectedTemplate])

  const handleCustomizationChange = useCallback((updates: Partial<QRCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updates }))
  }, [])

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
        triggerRefresh()
        // Log generation activity
        if (savedQrId) {
          logActivity(user.uid, {
            activityType: 'generated',
            qrType: selectedTemplate,
            qrContent: value,
          }).catch((err) => console.warn('Failed to log activity:', err))
        }
      } catch (err: any) {
        console.error('Failed to save QR to Firestore:', err)
        const message = err?.code === 'permission-denied'
          ? 'Permission denied. Please sign out and sign in again.'
          : err?.message || 'Failed to save QR code to your account'
        saveErrorMessage = message
      }
    } else {
      saveCompleted = true
    }

    setTimeout(() => {
      setIsGenerating(false)
      setIsGenerated(true)
      if (saveCompleted) {
        showToastMsg('QR Code generated successfully!', 'success')
      } else if (saveErrorMessage) {
        showToastMsg(`QR generated but NOT saved: ${saveErrorMessage}`, 'error')
      }
    }, 400)
  }, [selectedTemplate, formData, customization, user, showToastMsg, triggerRefresh])

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
  }), [
    qrValue,
    customization.size,
    customization.margin,
    customization.level,
    customization.fgColor,
    customization.bgColor,
    customization.moduleStyle,
    customization.cornerStyle,
    customization.gradientType,
    customization.gradientColor1,
    customization.gradientColor2,
    customization.gradientDirection,
    customization.logoDataUrl,
    customization.logoSize,
  ])

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
    customization.framePreset, customization.frameCustomText,
    customization.frameColor, customization.frameBgColor,
    customization.frameBorderRadius, customization.frameBorderThickness,
    customization.framePadding, customization.frameHasShadow,
    customization.frameRounded, customization.frameOutline,
  ])

  const renderForDownload = useCallback(async (format: 'png' | 'jpeg'): Promise<string | null> => {
    if (!qrValue) return null
    const renderOptions = getRenderOptions()
    const frameOptions = getFrameOptions()

    if (frameOptions.framePreset !== 'none') {
      const canvas = await renderQRWithFrame(renderOptions, frameOptions)
      if (format === 'png') return canvas.toDataURL('image/png')
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
      if (!blob) return null
      return URL.createObjectURL(blob)
    }

    const offscreen = document.createElement('canvas')
    offscreen.width = customization.size
    offscreen.height = customization.size
    await renderPremiumQR(offscreen, renderOptions)

    if (format === 'png') return offscreen.toDataURL('image/png')
    const blob = await canvasToBlob(offscreen, 'image/jpeg', 0.92)
    if (!blob) return null
    return URL.createObjectURL(blob)
  }, [qrValue, customization, getRenderOptions, getFrameOptions])

  const trackDownload = useCallback(() => {
    if (!user || !lastGeneratedQrId) return
    // Fire-and-forget: don't block the download on tracking
    incrementDownloadCount(lastGeneratedQrId, user.uid)
      .then(() => triggerRefresh())
      .catch((err) => console.warn('Failed to track download:', err))
  }, [user, lastGeneratedQrId, triggerRefresh])

  const handleDownloadPNG = useCallback(async () => {
    try {
      const dataUrl = await renderForDownload('png')
      if (!dataUrl) return
      // Download immediately (optimistic)
      const link = document.createElement('a')
      link.download = 'genqr-code.png'
      link.href = dataUrl
      link.click()
      // Track count asynchronously (fire-and-forget)
      trackDownload()
    } catch {
      showToastMsg('Failed to download PNG. Please try again.', 'error')
    }
  }, [renderForDownload, showToastMsg, trackDownload])

  const handleDownloadJPG = useCallback(async () => {
    try {
      const url = await renderForDownload('jpeg')
      if (!url) return
      // Download immediately (optimistic)
      const link = document.createElement('a')
      link.download = 'genqr-code.jpg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      // Track count asynchronously (fire-and-forget)
      trackDownload()
    } catch {
      showToastMsg('Failed to download JPG. Please try again.', 'error')
    }
  }, [renderForDownload, showToastMsg, trackDownload])

  const handleShare = useCallback(async () => {
    if (!qrValue) return

    try {
      const renderOptions = getRenderOptions()
      const frameOptions = getFrameOptions()

      let canvas: HTMLCanvasElement
      if (frameOptions.framePreset !== 'none') {
        canvas = await renderQRWithFrame(renderOptions, frameOptions)
      } else {
        canvas = document.createElement('canvas')
        canvas.width = renderOptions.size
        canvas.height = renderOptions.size
        await renderPremiumQR(canvas, renderOptions)
      }

      const blob = await canvasToBlob(canvas, 'image/png', 1)
      if (!blob) {
        showToastMsg('Failed to generate share image', 'error')
        return
      }

      const file = new File([blob], 'genqr-code.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'genqr-code.png'
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        showToastMsg("Sharing isn't supported in this browser. The QR image has been downloaded.", 'error')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Share failed:', err)
      showToastMsg('Failed to share QR code. Please try again.', 'error')
    }
  }, [qrValue, getRenderOptions, getFrameOptions, showToastMsg])

  const handleDownloadSVG = useCallback(async () => {
    try {
      if (!qrValue) return
      const renderOptions = getRenderOptions()
      const frameOptions = getFrameOptions()
      const svgString = frameOptions.framePreset !== 'none'
        ? generateSVGWithFrame(renderOptions, frameOptions)
        : generateSVG(renderOptions)
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'genqr-code.svg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      // Track count asynchronously (fire-and-forget)
      trackDownload()
    } catch {
      showToastMsg('Failed to download SVG. Please try again.', 'error')
    }
  }, [qrValue, showToastMsg, getRenderOptions, getFrameOptions, trackDownload])

  const handleLogoError = useCallback((message: string) => {
    showToastMsg(message, 'error')
  }, [showToastMsg])

  const canGenerate = selectedTemplate !== null && !validationError

  return (
    <>
      <section id="generator" className="relative px-4 pb-24 -mt-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-light mb-4">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                QR Code Editor
              </h2>
              <p className="mt-2 text-text-secondary text-sm">
                Design and customize your QR code in real time
              </p>
            </div>

            <QRTypeBar
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateChange}
            />

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Right Panel - Live Preview */}
              <div className="w-full lg:w-[60%] order-first lg:order-none">
                <ErrorBoundary>
                  {selectedTemplate === 'batch-qr' ? (
                    <div className="lg:sticky lg:top-24 lg:self-start">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="card p-6 sm:p-8"
                      >
                        <div className="flex items-center gap-2.5 mb-6">
                          <div className={`w-2 h-2 rounded-full ${batchPreviewDataUrl ? 'bg-success' : 'bg-secondary'}`} />
                          <span className="text-sm font-medium text-text-primary">Batch Preview</span>
                        </div>

                        {batchPreviewDataUrl ? (
                          <div className="flex flex-col items-center">
                            <div className="bg-cream-bg rounded-2xl p-4 mb-4 max-w-[280px] w-full">
                              <img
                                src={batchPreviewDataUrl}
                                alt={`Preview: ${batchPreviewName}`}
                                className="w-full h-auto"
                              />
                            </div>
                            <p className="text-sm font-medium text-text-primary text-center truncate max-w-full">
                              {batchPreviewName}
                            </p>
                            <p className="text-xs text-text-secondary/60 text-center truncate max-w-full mt-1 font-mono">
                              {batchPreviewContent}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 py-12">
                            <div className="w-48 h-48 rounded-2xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
                              <div className="text-center px-4">
                                <Files className="w-10 h-10 text-text-secondary/40 mx-auto mb-2" />
                                <p className="text-sm text-text-secondary/60 leading-relaxed">
                                  Click on an entry to preview its QR code
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ) : (
                    <LivePreview
                      qrValue={qrValue}
                      customization={customization}
                      onReset={handleResetAll}
                      onDownloadPNG={handleDownloadPNG}
                      onDownloadSVG={handleDownloadSVG}
                      onDownloadJPG={handleDownloadJPG}
                      onShare={handleShare}
                      canvasRef={canvasRef}
                    />
                  )}
                </ErrorBoundary>
              </div>

              {/* Left Panel - Controls */}
              <div className="w-full lg:w-[40%] space-y-4 order-last lg:order-none">
                {selectedTemplate === 'batch-qr' ? (
                  <AuthGate message="Sign in with Google to generate and manage your QR Codes.">
                    <BatchGenerator onPreviewUpdate={handleBatchPreviewUpdate} />
                  </AuthGate>
                ) : (
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
                )}
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
