import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    assetsInlineLimit: 2000000, // Inline files up to 2MB as Base64 data URLs
  },
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  }
})
