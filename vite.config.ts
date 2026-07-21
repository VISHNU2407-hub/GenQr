import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Split large third-party dependencies into separate chunks
          if (id.includes('/node_modules/firebase/')) return 'vendor-firebase'
          if (id.includes('/node_modules/framer-motion/') || id.includes('/node_modules/lucide-react/')) return 'vendor-ui'
          if (id.includes('/node_modules/recharts/')) return 'vendor-charts'
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
