import { motion } from 'framer-motion'
import { Zap, Shield, Smartphone } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Fast Generation',
    description: 'Generate QR codes instantly with our optimized engine.',
    bgColor: 'bg-primary-light',
    iconColor: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Fast client-side generation. Your data never leaves your device.',
    bgColor: 'bg-accent-light',
    iconColor: 'text-accent',
  },
  {
    icon: Smartphone,
    title: 'Responsive',
    description: 'Optimized for desktop, tablet and mobile devices.',
    bgColor: 'bg-secondary',
    iconColor: 'text-text-secondary',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
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
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Why Choose{' '}
            <span className="text-primary">GenQR</span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-xl mx-auto">
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
              className="card p-8 group cursor-default"
            >
              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-5`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
