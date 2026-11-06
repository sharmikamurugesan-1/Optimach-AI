import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/echarts/')) {
            return 'vendor-echarts';
          }
          if (id.includes('node_modules/three/')) {
            return 'vendor-three';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})
