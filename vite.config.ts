import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react'))              return 'vendor'
          if (id.includes('node_modules/framer-motion'))      return 'framer'
          if (id.includes('node_modules/@supabase'))          return 'supabase'
          if (id.includes('node_modules/zustand'))            return 'zustand'
        },
      },
    },
  },
})
