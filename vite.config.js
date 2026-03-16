import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Warn only above 1.5 MB per chunk (avoids noise from large pizza images)
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split vendor libraries into their own chunk for better caching
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'classnames'],
        }
      }
    },
    // Inline small assets (< 8 KB) to reduce HTTP requests
    assetsInlineLimit: 8192,
  },
  // Serve compressed files in preview
  server: {
    open: false,
    port: 5173,
  }
});
