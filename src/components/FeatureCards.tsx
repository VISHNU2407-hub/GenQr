import { motion } from 'framer-motion'
import { Zap, Shield, Smartphone } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Fast Generation',
    description: 'Generate QR codes instantly with our optimized engine.',
    gradient: 'from-primary/20 to-accent/20',
    iconColor: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Fast client-side generation. Your data never leaves your device.',
    gradient: 'from-accent/20 to-primary/20',
    iconColor: 'text-accent',
  },
  {
    icon: Smartphone,
    title: 'Responsive',
    description: 'Optimized for desktop, tablet and mobile devices.',
    gradient: 'from-primary/20 to-accent/20',
    iconColor: 'text-primary',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
}

export default function FeatureCards() {
  return (
    <section id="features" className="relative px-4 pb-32">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Why Choose{' '}
            <span className="gradient-text">GenQR</span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            Everything you need for quick and reliable QR code generation
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="feature-card group relative overflow-hidden"
            >
              {/* Gradient Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Corner Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
