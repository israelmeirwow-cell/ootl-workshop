import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages serves the site under /ootl-workshop/: build with BASE_PATH=/ootl-workshop/ (npm run build:gh)
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  // React + Motion are one ~160 kB (gzip) chunk; that is expected for this page.
  build: { chunkSizeWarningLimit: 600 },
})
