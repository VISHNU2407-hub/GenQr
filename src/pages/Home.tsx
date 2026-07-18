import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import QRGenerator from '../components/QRGenerator'
import FeatureCards from '../components/FeatureCards'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Hero />
      <QRGenerator />
      <FeatureCards />
      <Footer />
    </motion.div>
  )
}
