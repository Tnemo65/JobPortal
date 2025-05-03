import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Listen on all addresses
    hmr: {
      // Disable WebSocket for production build
      clientPort: process.env.NODE_ENV === 'production' ? 80 : 5173,
      // If deployed behind a proxy like Nginx, use:
      protocol: 'ws', // Use WebSocket protocol
      host: process.env.NODE_ENV === 'production' ? '35.234.9.125' : 'localhost',
    },
  },
  build: {
    // Improve production build
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['redux', 'react-redux', 'redux-persist'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select'],
        }
      }
    }
  }
})
