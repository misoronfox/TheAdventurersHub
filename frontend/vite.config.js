import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- Importamos esto

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- Lo agregamos a la lista de plugins
  ],
  server: {
    hmr: {
      host: 'adventurers-hub.duckdns.org',
    },
    host: '0.0.0.0', // Esto le dice que escuche en toda la red
    port: 5173
  }
})