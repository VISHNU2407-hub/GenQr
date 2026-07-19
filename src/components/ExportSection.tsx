import { motion } from 'framer-motion'
import { Download, Lock } from 'lucide-react'
import CollapsibleSection from './CollapsibleSection'

interface ExportSectionProps {
  onDownloadPNG: () => void
  onDownloadSVG: () => void
  onDownloadJPG: () => void
  disabled: boolean
}

export default function ExportSection({ onDownloadPNG, onDownloadSVG, onDownloadJPG, disabled }: ExportSectionProps) {
  return (
    <CollapsibleSection title="Export" icon={Download} defaultOpen={true}>
      {/* Disabled overlay message */}
      {disabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-500/5 border border-slate-500/10 mb-3"
        >
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500">
            Generate a QR code first to enable export options
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onDownloadPNG}
          disabled={disabled}
          className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
            !disabled
              ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]'
              : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="text-xs font-semibold">PNG</span>
        </button>
        <button
          onClick={onDownloadSVG}
          disabled={disabled}
          className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
            !disabled
              ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]'
              : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span className="text-xs font-semibold">SVG</span>
        </button>
        <button
          onClick={onDownloadJPG}
          disabled={disabled}
          className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
            !disabled
              ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]'
              : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="10" y1="13" x2="14" y2="13"/>
            <line x1="12" y1="11" x2="12" y2="15"/>
          </svg>
          <span className="text-xs font-semibold">JPG</span>
        </button>
      </div>
    </CollapsibleSection>
  )
}
