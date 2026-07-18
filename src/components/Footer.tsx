import { QrCode } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="about" className="relative border-t border-white/5">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/[0.02] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">GenQR</span>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-500">
              &copy; 2026 GenQR
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Designed &amp; Developed by{' '}
              <span className="text-slate-400 font-medium">VKS</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
