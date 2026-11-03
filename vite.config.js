import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Christmas2026/', // 👈 Critical for GitHub Pages subpath resolution
})