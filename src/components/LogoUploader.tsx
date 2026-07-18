import { useCallback, useRef } from 'react'
import { Image, Upload, X } from 'lucide-react'

interface LogoUploaderProps {
  logoDataUrl: string | null
  onChange: (dataUrl: string | null) => void
}

export default function LogoUploader({ logoDataUrl, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (dataUrl) {
        // Limit logo size by checking image dimensions
        const img = document.createElement('img')
        img.onload = () => {
          if (img.naturalWidth > 300 || img.naturalHeight > 300) {
            return
          }
          onChange(dataUrl)
        }
        img.src = dataUrl
      }
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const handleRemove = useCallback(() => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
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
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
