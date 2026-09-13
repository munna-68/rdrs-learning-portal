import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the static build can be dropped on any host,
// at the domain root or in a sub-directory, with zero configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
