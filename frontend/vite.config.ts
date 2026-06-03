import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,        // Bind to 0.0.0.0 — required for Replit & container deployments
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,        // Also needed for `vite preview` in production preview mode
    port: 4173,
    strictPort: true,
  },
})
