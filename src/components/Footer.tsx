

export default function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="GenQR Logo"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-text-secondary">
              &copy; 2026 GenQR
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">
              Designed &amp; Developed by{' '}
              <span className="font-bold tracking-tight">
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                  VKS
                </span>
                <span className="text-text-secondary ml-1.5 font-normal">
                  —{' '}
                  <span className="bg-gradient-to-r from-violet-500 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(168,85,247,0.3)]">
                    Visionary Kraft Studio
                  </span>
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
