import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Files, Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  Loader2, Download, X, Trash2, Edit3, Save,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRefresh } from '../contexts/RefreshContext'
import { saveGeneratedQR, logActivity, incrementBatchCount } from '../utils/firestore'
import { renderPremiumQR } from '../utils/qrRenderer'
import type { QRCustomization } from '../utils/qr'
import CollapsibleSection from './CollapsibleSection'
import ColorSection from './ColorSection'
import StyleSection from './StyleSection'
import FrameSection from './FrameSection'
import LogoSection from './LogoSection'
import JSZip from 'jszip'
import Toast from './Toast'

// ─── Types ───────────────────────────────────────────────

interface BatchEntry {
  name: string
  content: string
}

interface ValidationResult {
  entry: BatchEntry
  valid: boolean
  error?: string
}

interface GeneratedResult {
  id: string
  name: string
  content: string
  dataUrl: string
  error?: string
}

interface BatchGeneratorProps {
  onPreviewUpdate?: (dataUrl: string | null, name: string, content: string) => void
}

// ─── Helpers ─────────────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = atob(parts[1])
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

const MAX_CONTENT_LENGTH = 2000
const HOST_PORT_REGEX = /:\d{2,5}/
const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/
const HTTP_PREFIX = /^https?:\/\//i

function validateContent(content: string): string | undefined {
  if (!content) return 'Empty content'
  if (content.length > MAX_CONTENT_LENGTH) return `Content exceeds ${MAX_CONTENT_LENGTH} characters`
  // If it starts with http:// or https://, verify it looks like a valid URL
  if (HTTP_PREFIX.test(content)) {
    const rest = content.slice(content.indexOf('://') + 3)
    if (!rest || rest.length < 3) return 'Invalid URL format'
    const host = rest.split('/')[0]
    const hasDomain = host.includes('.') && /[a-z]{2,}/i.test(host.split('.').pop()!)
    const hasPort = HOST_PORT_REGEX.test(host)
    const isIP = IP_REGEX.test(host)
    if (!hasDomain && !hasPort && !isIP) return 'Invalid URL format'
  }
  return undefined
}

function parseCSVText(text: string): BatchEntry[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const headerStr = lines[0].toLowerCase().trim()
  const hasHeader = headerStr === 'name,content' || headerStr === '"name","content"' ||
    headerStr.startsWith('name,') || headerStr.startsWith('"name",')
  const dataLines = hasHeader ? lines.slice(1) : lines
  const entries: BatchEntry[] = []
  for (const line of dataLines) {
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { parts.push(current.trim()); current = '' }
      else { current += char }
    }
    parts.push(current.trim())
    if (parts.length >= 1) {
      const content = parts.length >= 2 ? parts[1] : parts[0]
      const name = parts.length >= 2 ? parts[0] : ''
      if (content) entries.push({ name, content })
    }
  }
  return entries
}

function parseTextareaEntries(text: string): BatchEntry[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(content => ({ name: '', content }))
}

function validateEntries(entries: BatchEntry[]): { results: ValidationResult[]; valid: number; invalid: number } {
  const seen = new Set<string>()
  const unique: BatchEntry[] = []
  for (const entry of entries) {
    if (!seen.has(entry.content)) {
      seen.add(entry.content)
      unique.push(entry)
    }
  }
  const results: ValidationResult[] = unique.map(entry => {
    const error = validateContent(entry.content)
    return { entry, valid: !error, error }
  })
  return {
    results,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
  }
}

// ─── Component ───────────────────────────────────────────

export default function BatchGenerator({ onPreviewUpdate }: BatchGeneratorProps) {
  const { user } = useAuth()
  const { triggerRefresh } = useRefresh()
  const [inputMode, setInputMode] = useState<'textarea' | 'csv'>('textarea')
  const [textareaInput, setTextareaInput] = useState('')
  const [csvFileName, setCsvFileName] = useState('')
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [showValidation, setShowValidation] = useState(false)
  const [editableEntries, setEditableEntries] = useState<BatchEntry[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0, failed: 0 })
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([])
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [customization, setCustomization] = useState<QRCustomization>({
    fgColor: '#000000', bgColor: '#FFFFFF', size: 250, margin: 10, level: 'M',
    moduleStyle: 'square', cornerStyle: 'square', gradientType: 'solid',
    gradientColor1: '#000000', gradientColor2: '#3B82F6', gradientDirection: 'left-to-right',
    frameStyle: 'none', logoDataUrl: null, logoSize: 25,
    framePreset: 'none', frameCustomText: '', frameColor: '#3B82F6',
    frameBgColor: '#FFFFFF', frameBorderRadius: 16, frameBorderThickness: 2,
    framePadding: 24, frameHasShadow: true, frameRounded: true, frameOutline: true,
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCustomizationChange = useCallback((updates: Partial<QRCustomization>) => {
    setCustomization(prev => ({ ...prev, ...updates }))
  }, [])

  const handleParseInput = useCallback(() => {
    const entries = inputMode === 'textarea' ? parseTextareaEntries(textareaInput) : []
    if (entries.length === 0) {
      setToast({ message: 'No valid entries found', type: 'error' })
      return
    }
    if (onPreviewUpdate) onPreviewUpdate(null, '', '')
    const { results, valid, invalid } = validateEntries(entries)
    setValidationResults(results)
    setEditableEntries(results.map(r => ({ ...r.entry })))
    setShowValidation(true)
    setEditingIndex(null)
    setToast({ message: `${valid} valid${invalid > 0 ? `, ${invalid} invalid` : ''} entries`, type: invalid > 0 ? 'error' : 'success' })
  }, [inputMode, textareaInput, onPreviewUpdate])

  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) { setToast({ message: 'Failed to read CSV file', type: 'error' }); return }
      const entries = parseCSVText(text)
      if (entries.length === 0) { setToast({ message: 'No valid entries found in CSV', type: 'error' }); return }
      const { results, valid, invalid } = validateEntries(entries)
      setValidationResults(results)
      setEditableEntries(results.map(r => ({ ...r.entry })))
      setShowValidation(true)
      setEditingIndex(null)
      setToast({ message: `CSV loaded: ${valid} valid${invalid > 0 ? `, ${invalid} invalid` : ''} entries`, type: invalid > 0 ? 'error' : 'success' })
    }
    reader.onerror = () => setToast({ message: 'Failed to read CSV file', type: 'error' })
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const startEditingName = useCallback((index: number) => {
    setEditingIndex(index)
    setEditNameValue(editableEntries[index]?.name || '')
  }, [editableEntries])

  const saveEditingName = useCallback(() => {
    if (editingIndex === null) return
    setEditableEntries(prev => prev.map((e, i) =>
      i === editingIndex ? { ...e, name: editNameValue.trim() } : e
    ))
    setEditingIndex(null)
  }, [editingIndex, editNameValue])

  const handlePreviewEntry = useCallback(async (entry: BatchEntry) => {
    if (!onPreviewUpdate) return
    try {
      const canvas = document.createElement('canvas')
      const previewSize = 200
      canvas.width = previewSize
      canvas.height = previewSize
      await renderPremiumQR(canvas, {
        value: entry.content, size: previewSize, margin: 8, level: 'M',
        fgColor: customization.fgColor, bgColor: customization.bgColor,
        moduleStyle: customization.moduleStyle, cornerStyle: customization.cornerStyle,
        gradientType: customization.gradientType === 'solid' ? 'solid' : customization.gradientType,
        gradientColor1: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor1,
        gradientColor2: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor2,
        gradientDirection: customization.gradientDirection,
        logoDataUrl: customization.logoDataUrl, logoSize: customization.logoSize,
      })
      const dataUrl = canvas.toDataURL('image/png')
      onPreviewUpdate(dataUrl, entry.name || entry.content.substring(0, 40), entry.content)
    } catch (err) {
      console.error('Preview render failed:', err)
    }
  }, [customization, onPreviewUpdate])

  const handleRemoveEntry = useCallback((index: number) => {
    setEditableEntries(prev => prev.filter((_, i) => i !== index))
    setValidationResults(prev => prev.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
    if (onPreviewUpdate) onPreviewUpdate(null, '', '')
  }, [editingIndex, onPreviewUpdate])

  const handleGenerateAll = useCallback(async () => {
    if (!user) return
    const validEntries = editableEntries.filter((_, i) => validationResults[i]?.valid)
    if (validEntries.length === 0) { setToast({ message: 'No valid entries to generate', type: 'error' }); return }
    setIsGenerating(true)
    setGenerationProgress({ completed: 0, total: validEntries.length, failed: 0 })
    setGeneratedResults([])
    const results: GeneratedResult[] = []
    for (let i = 0; i < validEntries.length; i++) {
      const entry = validEntries[i]
      const displayName = entry.name || entry.content.substring(0, 40) + (entry.content.length > 40 ? '...' : '')
      try {
        const canvas = document.createElement('canvas')
        canvas.width = customization.size
        canvas.height = customization.size
        await renderPremiumQR(canvas, {
          value: entry.content, size: customization.size, margin: customization.margin,
          level: customization.level, fgColor: customization.fgColor, bgColor: customization.bgColor,
          moduleStyle: customization.moduleStyle, cornerStyle: customization.cornerStyle,
          gradientType: customization.gradientType === 'solid' ? 'solid' : customization.gradientType,
          gradientColor1: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor1,
          gradientColor2: customization.gradientType === 'solid' ? customization.fgColor : customization.gradientColor2,
          gradientDirection: customization.gradientDirection,
          logoDataUrl: customization.logoDataUrl, logoSize: customization.logoSize,
        })
        const dataUrl = canvas.toDataURL('image/png')
        let savedId = ''
        try {
          savedId = await saveGeneratedQR(user.uid, {
            userId: user.uid, type: 'website', content: entry.content,
            style: { moduleStyle: customization.moduleStyle, cornerStyle: customization.cornerStyle, size: customization.size, margin: customization.margin, level: customization.level },
            colors: { fgColor: customization.fgColor, bgColor: customization.bgColor, gradientType: customization.gradientType, gradientColor1: customization.gradientColor1, gradientColor2: customization.gradientColor2, gradientDirection: customization.gradientDirection },
            frame: { framePreset: customization.framePreset, frameStyle: customization.frameStyle, frameColor: customization.frameColor, frameBgColor: customization.frameBgColor, frameCustomText: customization.frameCustomText },
            logo: { hasLogo: !!customization.logoDataUrl, logoSize: customization.logoSize },
          })
        } catch (err) { console.error('Failed to save QR:', err) }
        results.push({ id: savedId, name: displayName, content: entry.content, dataUrl })
        setGenerationProgress(prev => ({ ...prev, completed: prev.completed + 1 }))
      } catch (err) {
        console.error('Failed to generate QR:', err)
        results.push({ id: '', name: displayName, content: entry.content, dataUrl: '', error: 'Generation failed' })
        setGenerationProgress(prev => ({ ...prev, completed: prev.completed + 1, failed: prev.failed + 1 }))
      }
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    setGeneratedResults(results)
    setIsGenerating(false)
    triggerRefresh()
    // Log batch activity
    const succeeded = results.filter(r => !r.error).length
    if (succeeded > 0 && user) {
      logActivity(user.uid, {
        activityType: 'batch_generated',
        qrName: `Batch (${succeeded})`,
        batchCount: succeeded,
      }).catch((err) => console.warn('Failed to log activity:', err))
      incrementBatchCount(user.uid, succeeded).catch((err) => console.warn('Failed to increment batch count:', err))
    }
    const failed = results.filter(r => r.error).length
    setToast({ message: `Generated ${succeeded} QR code${succeeded !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`, type: failed > 0 && succeeded === 0 ? 'error' : 'success' })
  }, [user, editableEntries, validationResults, customization, triggerRefresh])

  const handleDownloadIndividual = useCallback(async (result: GeneratedResult) => {
    if (!result.dataUrl) return
    setDownloadingIds(prev => new Set(prev).add(result.content))
    try {
      const link = document.createElement('a')
      link.download = `genqr-${result.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 30)}.png`
      link.href = result.dataUrl
      link.click()
      setToast({ message: 'QR code downloaded', type: 'success' })
    } catch { setToast({ message: 'Failed to download QR code', type: 'error' }) }
    finally { setDownloadingIds(prev => { const next = new Set(prev); next.delete(result.content); return next }) }
  }, [])

  const handleDownloadAll = useCallback(async () => {
    if (generatedResults.length === 0) return
    setIsDownloadingAll(true)
    try {
      const zip = new JSZip()
      const validResults = generatedResults.filter(r => r.dataUrl)

      for (let i = 0; i < validResults.length; i++) {
        const result = validResults[i]
        const safeName = result.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 30) || 'qr'
        const fileName = `genqr-${i + 1}-${safeName}.png`
        try {
          const blob = dataUrlToBlob(result.dataUrl)
          zip.file(fileName, blob)
        } catch {
          console.error('Failed to add file to ZIP:', fileName)
        }
      }

      const dateStr = new Date().toISOString().split('T')[0]
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.download = `genqr-batch-${dateStr}.zip`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)

      setToast({ message: `Downloaded ${validResults.length} QR codes as ZIP`, type: 'success' })
    } catch (err) {
      console.error('ZIP download failed:', err)
      setToast({ message: 'Failed to create ZIP download', type: 'error' })
    } finally {
      setIsDownloadingAll(false)
    }
  }, [generatedResults])

  const handleClear = useCallback(() => {
    setValidationResults([])
    setEditableEntries([])
    setEditingIndex(null)
    setShowValidation(false)
    setGenerationProgress({ completed: 0, total: 0, failed: 0 })
    setGeneratedResults([])
    setTextareaInput('')
    setCsvFileName('')
    if (onPreviewUpdate) onPreviewUpdate(null, '', '')
  }, [onPreviewUpdate])

  const validCount = editableEntries.filter((_, i) => validationResults[i]?.valid).length
  const invalidCount = editableEntries.filter((_, i) => !validationResults[i]?.valid).length
  const hasGenerated = generatedResults.length > 0
  const canGenerate = validCount > 0 && !isGenerating && editableEntries.length > 0

  return (
    <div className="space-y-4">
      {/* Batch Input Section */}
      <CollapsibleSection title="Batch Input" icon={Files} defaultOpen={!hasGenerated}>
        <div className="space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/40 border border-border">
            <button
              onClick={() => { setInputMode('textarea'); setCsvFileName('') }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${inputMode === 'textarea' ? 'bg-card-bg text-text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M8 3H3v5"/><path d="M3 16v5h5M16 21h5v-5"/></svg>
              Text
            </button>
            <button
              onClick={() => { setInputMode('csv') }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${inputMode === 'csv' ? 'bg-card-bg text-text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>

          {inputMode === 'textarea' ? (
            <div className="space-y-2">
              <textarea
                value={textareaInput}
                onChange={(e) => setTextareaInput(e.target.value)}
                placeholder={`Paste your entries here, one per line:\n\nhttps://google.com\nhttps://github.com\nhttps://openai.com`}
                rows={8}
                className="input-field resize-none font-mono text-xs"
                aria-label="Batch entries"
              />
              <p className="text-xs text-text-secondary/60">One entry per line. Duplicates will be removed automatically.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" aria-label="Upload CSV file" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 cursor-pointer transition-all"
              >
                <Upload className="w-8 h-8 text-text-secondary" />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">Upload CSV File</p>
                  <p className="text-xs text-text-secondary mt-1">Columns: Name (optional), Content (required)</p>
                </div>
                {csvFileName && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-light text-primary text-xs font-medium">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {csvFileName}
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasGenerated && (
            <button
              onClick={handleParseInput}
              disabled={inputMode === 'textarea' && !textareaInput.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Parse Entries
            </button>
          )}
        </div>
      </CollapsibleSection>

      {/* Editable Entry List */}
      <AnimatePresence>
        {showValidation && editableEntries.length > 0 && !hasGenerated && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-text-primary">Review Entries</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span className="text-xs font-medium text-text-primary">{validCount}</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-danger" />
                    <span className="text-xs font-medium text-danger">{invalidCount}</span>
                  </div>
                )}
                <button onClick={() => setShowValidation(false)} className="text-text-secondary hover:text-text-primary transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {editableEntries.map((entry, i) => {
                const vr = validationResults[i]
                const isValid = vr?.valid
                const isEditing = editingIndex === i

                return (
                  <motion.div
                    key={i}
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      isValid
                        ? 'bg-cream-bg border-border hover:border-primary/20 hover:bg-secondary/20'
                        : 'bg-danger/5 border-danger/15'
                    }`}
                    onClick={() => { if (isValid && !isEditing) handlePreviewEntry(entry) }}
                  >
                    {/* Index */}
                    <span className="text-[10px] text-text-secondary/40 font-mono w-4 shrink-0 text-right">{i + 1}</span>

                    {/* Status indicator */}
                    {isValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                    )}

                    {/* Name (editable inline) */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingName()
                              if (e.key === 'Escape') setEditingIndex(null)
                            }}
                            onBlur={saveEditingName}
                            className="input-field-sm text-xs py-1"
                            placeholder="Enter a name..."
                            autoFocus
                          />
                          <button
                            onClick={saveEditingName}
                            className="p-1 rounded-md text-primary hover:bg-primary-light transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingName(i)}
                          className="flex items-center gap-1.5 group w-full text-left"
                        >
                          {entry.name ? (
                            <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">
                              {entry.name}
                            </span>
                          ) : (
                            <span className="text-xs text-text-secondary/50 italic">Add name...</span>
                          )}
                          <Edit3 className="w-3 h-3 text-text-secondary/30 group-hover:text-primary transition-colors shrink-0" />
                        </button>
                      )}
                      {/* Content preview */}
                      <p className="text-[10px] text-text-secondary/50 truncate mt-0.5 font-mono">
                        {entry.content}
                      </p>
                    </div>

                    {vr?.error && (
                      <span className="text-[10px] text-danger/70 shrink-0">{vr.error}</span>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveEntry(i)}
                      className="p-1 rounded-md text-text-secondary/30 hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                      aria-label="Remove entry"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customization Sections */}
      {!isGenerating && !hasGenerated && (
        <>
          <ColorSection customization={customization} onChange={handleCustomizationChange} />
          <StyleSection customization={customization} onChange={handleCustomizationChange} />
          <FrameSection customization={customization} onChange={handleCustomizationChange} />
          <LogoSection customization={customization} onChange={handleCustomizationChange} onError={(msg) => setToast({ message: msg, type: 'error' })} />
        </>
      )}

      {/* Generate Button */}
      {!hasGenerated && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-light">
              <Files className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Batch Generate</span>
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-primary text-white text-base font-semibold hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Generating...</>
            ) : (
              <><Files className="w-5 h-5" />Generate All{validCount > 0 && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{validCount}</span>}</>
            )}
          </button>
        </motion.div>
      )}

      {/* Generation Progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-semibold text-text-primary">Generating...</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-text-secondary/50 bg-secondary/40 px-2 py-0.5 rounded-full font-mono">
                  Batch {generationProgress.total}
                </span>
                <span className="text-xs font-medium text-text-secondary">{generationProgress.completed} / {generationProgress.total} Complete</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(generationProgress.completed / generationProgress.total) * 100}%` }} className="h-full rounded-full bg-primary" transition={{ duration: 0.3 }} />
            </div>
            {generationProgress.failed > 0 && <p className="text-xs text-danger mt-2">{generationProgress.failed} failed</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      <AnimatePresence>
        {hasGenerated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Summary Card */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-light">
                    <Files className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">Generation Complete</h4>
                    <p className="text-xs text-text-secondary">{generatedResults.length} QR code{generatedResults.length !== 1 ? 's' : ''} generated</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-success/5 border border-success/10">
                  <p className="text-2xl font-bold text-success">{generatedResults.filter(r => !r.error).length}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Successful</p>
                </div>
                {generatedResults.some(r => r.error) && (
                  <div className="text-center p-3 rounded-xl bg-danger/5 border border-danger/10">
                    <p className="text-2xl font-bold text-danger">{generatedResults.filter(r => r.error).length}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Failed</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloadingAll || generatedResults.every(r => !r.dataUrl)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isDownloadingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  )}
                  Download ZIP
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/30 text-text-secondary text-sm font-medium hover:bg-secondary/50 hover:text-text-primary border border-border transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>

            {/* QR Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {generatedResults.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className={`card-sm p-3 ${result.error ? 'border-danger/20' : ''}`}
                >
                  {result.error ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <AlertCircle className="w-8 h-8 text-danger" />
                      <p className="text-xs text-danger text-center">{result.name}</p>
                      <p className="text-[10px] text-danger/60">{result.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center mb-2 bg-cream-bg rounded-lg p-2">
                        <img src={result.dataUrl} alt={`QR for ${result.name}`} className="w-full max-w-[120px] h-auto" />
                      </div>
                      <p className="text-[11px] font-medium text-text-primary truncate mb-2 text-center">{result.name}</p>
                      <button
                        onClick={() => handleDownloadIndividual(result)}
                        disabled={downloadingIds.has(result.content)}
                        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border text-xs text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
                      >
                        {downloadingIds.has(result.content) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Download PNG
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <Toast message={toast.message} isVisible={true} onClose={() => setToast(null)} type={toast.type} />
      )}
    </div>
  )
}
