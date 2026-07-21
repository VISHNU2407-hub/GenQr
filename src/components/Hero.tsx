import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex flex-col items-center justify-center px-4 pt-24 pb-24 overflow-hidden"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light border border-primary/15 text-primary text-xs font-medium mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Generate &bull; Customize &bull; Share
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-text-primary"
        >
          Generate{' '}
          <span className="text-primary">QR Codes</span>
          <br />
          Instantly
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Create beautiful, high-quality QR codes for websites in seconds
          with a fast, elegant and modern QR generator.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#generator" className="btn-primary text-base px-8 py-3.5">
            Generate a QR Code
          </a>
          <a href="#features" className="btn-secondary text-base px-8 py-3.5">
            Explore Features
          </a>
        </motion.div>
      </div>

    </section>
  )
}
