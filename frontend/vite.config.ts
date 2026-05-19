import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk boyut uyarısı limiti (KB)
    chunkSizeWarningLimit: 600,
    // Kaynak haritaları (production debugging için)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vendor kodlarını ayrı chunk'lara böl
        manualChunks(id: string) {
          if (id.includes('node_modules/react-router')) return 'vendor';
          if (id.includes('node_modules/react-dom')) return 'vendor';
          if (id.includes('node_modules/react')) return 'vendor';
          if (id.includes('node_modules/axios')) return 'axios';
        },
      },
    },
  },
})
