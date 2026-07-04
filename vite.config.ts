import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes(`${path.sep}react${path.sep}`) ||
            id.includes('/react/')
          ) {
            return 'react-vendor'
          }

          if (
            id.includes('recharts') ||
            id.includes('d3-') ||
            id.includes('victory-vendor')
          ) {
            return 'charts'
          }

          if (id.includes('framer-motion') || id.includes('motion-dom')) {
            return 'motion'
          }

          if (id.includes('@supabase')) {
            return 'supabase'
          }

          if (id.includes('@google/generative-ai')) {
            return 'gemini'
          }

          if (
            id.includes('jspdf') ||
            id.includes('html2canvas') ||
            id.includes('canvg') ||
            id.includes('dompurify') ||
            id.includes('fflate') ||
            id.includes('svg-pathdata')
          ) {
            return 'pdf'
          }

          if (id.includes('lucide-react')) {
            return 'icons'
          }

          if (id.includes('react-dropzone') || id.includes('file-selector')) {
            return 'upload'
          }

          if (id.includes('zod') || id.includes('@hookform')) {
            return 'forms'
          }
        },
      },
    },
  },
})
