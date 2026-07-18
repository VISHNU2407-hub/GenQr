import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, type LucideIcon } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  icon: LucideIcon
  defaultOpen?: boolean
  children: ReactNode
}

export default function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.02]"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-white/[0.02] border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-200"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-slate-200">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="text-slate-500"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
