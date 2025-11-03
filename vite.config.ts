import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/SSC/', // GitHub Pages uses /repo-name/ as base path
})
