import { Download, FileImage, FileCode, FileType } from 'lucide-react'

interface DownloadOptionsProps {
  onDownloadPNG: () => void
  onDownloadSVG: () => void
  onDownloadJPG: () => void
  disabled: boolean
}

export default function DownloadOptions({ onDownloadPNG, onDownloadSVG, onDownloadJPG, disabled }: DownloadOptionsProps) {
  const btnClass = (enabled: boolean) =>
    `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
      enabled
        ? 'btn-secondary cursor-pointer'
        : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
    }`

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
          className={btnClass(!disabled)}
        >
          <FileImage className="w-4 h-4" />
          PNG
        </button>
        <button
          onClick={onDownloadSVG}
          disabled={disabled}
          className={btnClass(!disabled)}
        >
          <FileCode className="w-4 h-4" />
          SVG
        </button>
        <button
          onClick={onDownloadJPG}
          disabled={disabled}
          className={btnClass(!disabled)}
        >
          <FileType className="w-4 h-4" />
          JPG
        </button>
      </div>
    </div>
  )
}
