import { Download, FileImage, FileCode } from 'lucide-react'

interface DownloadOptionsProps {
  onDownloadPNG: () => void
  onDownloadSVG: () => void
  disabled: boolean
}

export default function DownloadOptions({ onDownloadPNG, onDownloadSVG, disabled }: DownloadOptionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-300 font-medium">Download</span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onDownloadPNG}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
            !disabled
              ? 'btn-secondary cursor-pointer'
              : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
          }`}
        >
          <FileImage className="w-4 h-4" />
          PNG
        </button>
        <button
          onClick={onDownloadSVG}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
            !disabled
              ? 'btn-secondary cursor-pointer'
              : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
          }`}
        >
          <FileCode className="w-4 h-4" />
          SVG
        </button>
      </div>
    </div>
  )
}
