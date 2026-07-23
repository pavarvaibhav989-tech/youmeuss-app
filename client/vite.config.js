import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        /**
         * Split vendors into separate cacheable chunks.
         * Each chunk is downloaded once and cached by the browser.
         * Users only re-download a chunk when that specific library updates.
         */
        manualChunks(id) {
          // Three.js — heavy 3D library, only used in ParticleLab
          if (id.includes('three')) {
            return 'vendor-three';
          }
          // CodeMirror — only used in ParticleLab
          if (id.includes('@codemirror') || id.includes('@uiw/codemirror')) {
            return 'vendor-codemirror';
          }
          // Socket.io client
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
            return 'vendor-socket';
          }
          // React core + router
          if (id.includes('react') && id.includes('node_modules')) {
            return 'vendor-react';
          }
          // Everything else in node_modules → shared vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
    // Increase chunk size warning threshold — vendors are expected to be large
    chunkSizeWarningLimit: 600,
  },
})
