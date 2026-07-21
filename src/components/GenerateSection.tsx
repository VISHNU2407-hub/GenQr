import { motion } from 'framer-motion'
import { QrCode, Sparkles, Loader2, CheckCircle2, Zap } from 'lucide-react'

interface GenerateSectionProps {
  onGenerate: () => void
  isGenerating: boolean
  isGenerated: boolean
  disabled: boolean
}

export default function GenerateSection({
  onGenerate,
  isGenerating,
  isGenerated,
  disabled,
}: GenerateSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-light">
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-text-primary">Generate</span>
      </div>

      <button
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        className={`
          relative w-full overflow-hidden rounded-2xl
          flex items-center justify-center gap-3
          px-6 py-4 sm:py-5
          text-base sm:text-lg font-semibold tracking-tight
          transition-all duration-300
          ${disabled && !isGenerating && !isGenerated
            ? 'bg-secondary/50 text-text-secondary/50 cursor-not-allowed border border-border'
            : isGenerated
              ? 'bg-success text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98]'
              : 'bg-primary text-white shadow-sm hover:shadow-md hover:bg-primary-hover active:scale-[0.98]'
          }
        `}
      >
        {/* Icon */}
        <motion.div
          animate={
            isGenerating
              ? { rotate: 360 }
              : isGenerated
                ? { scale: [1, 1.3, 1] }
                : {}
          }
          transition={
            isGenerating
              ? { duration: 1, repeat: Infinity, ease: 'linear' }
              : { duration: 0.4 }
          }
          className="relative z-10"
        >
          {isGenerating ? (
            <Loader2 className="w-6 h-6" />
          ) : isGenerated ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <QrCode className="w-6 h-6" />
          )}
        </motion.div>

        {/* Text */}
        <span className="relative z-10">
          {isGenerating
            ? 'Generating...'
            : isGenerated
              ? 'Regenerate QR Code'
              : 'Generate QR Code'}
        </span>

        {!isGenerated && !isGenerating && !disabled && (
          <Sparkles className="w-5 h-5 relative z-10 opacity-70" />
        )}
      </button>

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mt-2.5"
      >
        {disabled && !isGenerated ? (
          <p className="text-xs text-text-secondary/60">
            Select a template and fill in required fields
          </p>
        ) : isGenerated ? (
          <p className="text-xs text-success/70">
            QR code generated! Customize further or export below.
          </p>
        ) : (
          <p className="text-xs text-text-secondary/60">
            Click to generate your QR code with current settings
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
