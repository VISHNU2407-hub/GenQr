import { motion, AnimatePresence } from 'framer-motion'
import { TEMPLATES } from '../utils/qr'
import type { TemplateId } from '../utils/qr'

const scrollbarStyles = `
  .scrollbar-premium::-webkit-scrollbar {
    height: 4px;
  }

  .scrollbar-premium::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }

  .scrollbar-premium::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.15);
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  .scrollbar-premium::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.35);
  }

  .scrollbar-premium::-webkit-scrollbar-thumb:active {
    background: rgba(59, 130, 246, 0.5);
  }
`

interface QRTypeBarProps {
  selectedTemplate: TemplateId | null
  onSelect: (id: TemplateId | null) => void
}

const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export default function QRTypeBar({ selectedTemplate, onSelect }: QRTypeBarProps) {
  return (
    <>
      <style>{scrollbarStyles}</style>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
      <div className="glass-card p-4 sm:p-5 overflow-hidden">
        {/* Label */}
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            QR Type
          </span>
          {selectedTemplate && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full font-medium"
            >
              {TEMPLATES.find((t) => t.id === selectedTemplate)?.label}
            </motion.span>
          )}
        </div>

        {/* Horizontal scrollable container */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-premium"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
          }}
        >
          {TEMPLATES.map((template) => {
              const isSelected = selectedTemplate === template.id

              return (
                <motion.button
                  key={template.id}
                  layout
                  onClick={() => onSelect(isSelected ? null : template.id)}
                  className={"relative flex flex-col items-center gap-1.5 shrink-0 rounded-xl border transition-colors duration-200 " +
                    (isSelected
                      ? 'border-primary/40'
                      : 'border-white/[0.06] hover:border-white/20')
                  }
                  style={{
                    width: '80px',
                    scrollSnapAlign: 'start',
                    backgroundColor: isSelected
                      ? 'rgba(59,130,246,0.08)'
                      : 'rgba(255,255,255,0.02)',
                    boxShadow: isSelected
                      ? '0 0 20px rgba(59,130,246,0.15), 0 4px 12px rgba(0,0,0,0.2)'
                      : 'none',
                  }}
                  animate={{
                    scale: isSelected ? 1.08 : 1,
                    y: isSelected ? -2 : 0,
                  }}
                  whileHover={{
                    scale: isSelected ? 1.08 : 1.05,
                    y: isSelected ? -2 : -1,
                    transition: { type: 'spring', stiffness: 400, damping: 20 },
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    layout: { type: 'spring', stiffness: 300, damping: 25 },
                  }}
                >
                  {/* Glow ring on selected */}
                  {isSelected && (
                    <motion.div
                      layoutId="selected-glow"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      style={{
                        boxShadow: 'inset 0 0 0 1.5px rgba(59,130,246,0.5)',
                      }}
                    />
                  )}

                  {/* Icon container */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mt-2 transition-colors duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? template.color + '20'
                        : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {template.icon}
                  </div>

                  {/* Label */}
                  <span
                    className={"text-[9px] font-semibold leading-tight text-center px-1 pb-2 transition-colors duration-200 " +
                      (isSelected ? 'text-white' : 'text-slate-400')
                    }
                    style={{ lineHeight: '1.2' }}
                  >
                    {template.label}
                  </span>

                  {/* Bottom indicator strip */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        layoutId="selected-indicator"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ scaleX: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{
                          backgroundColor: template.color,
                          boxShadow: '0 0 8px ' + template.color + '60',
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
        </div>
      </div>
      </motion.div>
    </>
  )
}
