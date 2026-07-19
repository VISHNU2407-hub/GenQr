import { useCallback, useRef } from 'react'
import { Image, Upload, X } from 'lucide-react'

interface LogoUploaderProps {
  logoDataUrl: string | null
  onChange: (dataUrl: string | null) => void
  onError?: (message: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGE_DIMENSION = 500

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

export default function LogoUploader({ logoDataUrl, onChange, onError }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      onError?.('Logo file must be less than 5MB')
      return
    }

    // Validate file type
    const isAcceptedType = ACCEPTED_TYPES.includes(file.type) || 
      file.name.match(/\.(png|jpg|jpeg|svg)$/i) !== null
    
    if (!isAcceptedType) {
      onError?.('Please upload a PNG, JPG, or SVG file')
      return
    }

    // SVG files need special handling - read directly as text then convert to data URL
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return

      // For SVG files, check dimensions by creating an offscreen image
      if (file.type === 'image/svg+xml' || file.name.match(/\.svg$/i)) {
        onChange(dataUrl)
        return
      }

      // For raster images, verify dimensions
      const img = document.createElement('img')
      img.onload = () => {
        if (img.naturalWidth > MAX_IMAGE_DIMENSION || img.naturalHeight > MAX_IMAGE_DIMENSION) {
          onError?.(`Logo dimensions too large (${img.naturalWidth}x${img.naturalHeight}). Maximum is ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px`)
          return
        }
        onChange(dataUrl)
      }
      img.onerror = () => {
        onError?.('Failed to load logo image')
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      onError?.('Failed to read file')
    }
    reader.readAsDataURL(file)
  }, [onChange, onError])

  const handleRemove = useCallback(() => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [onChange])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-300 font-medium">Logo</span>
      </div>
      
      {logoDataUrl ? (
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
          <img
            src={logoDataUrl}
            alt="Logo preview"
            className="w-12 h-12 object-contain rounded-lg bg-white"
          />
          <span className="flex-1 text-xs text-slate-400 truncate">Logo uploaded</span>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            aria-label="Remove logo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-primary/30 hover:bg-white/[0.02] transition-all">
          <Upload className="w-5 h-5 text-slate-500" />
          <span className="text-sm text-slate-400">Upload logo (PNG, JPG, SVG)</span>
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
