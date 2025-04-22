import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    mimeTypes: {
      './sw.js': 'application/javascript', // Définir explicitement le type MIME
    },
  }
})
