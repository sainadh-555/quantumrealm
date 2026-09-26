import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/quantumrealm/',
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    open: false
  }
})
